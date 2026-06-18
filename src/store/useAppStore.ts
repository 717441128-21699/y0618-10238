import { create } from 'zustand';
import {
  WorkOrder,
  ProcessTask,
  Workstation,
  ExceptionItem,
  WarehouseEntry,
  Product,
  ScheduleResult,
  BottleneckInfo,
  DashboardMetrics,
} from '../types';
import {
  mockWorkOrders,
  mockProcessTasks,
  mockWorkstations,
  mockExceptions,
  mockWarehouseEntries,
  mockProducts,
} from '../data/mockData';

interface AppState {
  products: Product[];
  workOrders: WorkOrder[];
  processTasks: ProcessTask[];
  workstations: Workstation[];
  exceptions: ExceptionItem[];
  warehouseEntries: WarehouseEntry[];
  
  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'orderNo' | 'createdAt' | 'status'>) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  deleteWorkOrder: (id: string) => void;
  scheduleWorkOrder: (orderId: string) => void;
  
  startProcessTask: (taskId: string, operator: string) => void;
  completeProcessTask: (taskId: string, actualQty: number, qualifiedQty: number, defectQty: number) => void;
  
  addException: (exception: Omit<ExceptionItem, 'id' | 'status' | 'reportedAt'>) => void;
  updateException: (id: string, updates: Partial<ExceptionItem>) => void;
  
  addWarehouseEntry: (entry: Omit<WarehouseEntry, 'id' | 'entryTime'>) => void;
  
  computeSchedule: () => ScheduleResult[];
  getBottlenecks: () => BottleneckInfo[];
  getDashboardMetrics: () => DashboardMetrics;
  rescheduleAll: () => number;
  
  getTasksByWorkOrder: (workOrderId: string) => ProcessTask[];
  getWorkOrderProgress: (workOrderId: string) => number;
}

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateOrderNo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const num = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `WO${year}${month}${num}`;
};

export const useAppStore = create<AppState>((set, get) => ({
  products: mockProducts,
  workOrders: mockWorkOrders,
  processTasks: mockProcessTasks,
  workstations: mockWorkstations,
  exceptions: mockExceptions,
  warehouseEntries: mockWarehouseEntries,

  addWorkOrder: (orderData) => {
    const product = get().products.find(p => p.id === orderData.productId);
    if (!product) return;

    const newOrderId = generateId();
    const newOrder: WorkOrder = {
      ...orderData,
      id: newOrderId,
      orderNo: generateOrderNo(),
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      productName: product.name,
      productModel: product.model,
    };
    
    const newTasks: ProcessTask[] = product.processRoute.map((step, index) => {
      const availableWs = get().workstations.filter(ws => ws.type === step.workstationType && ws.status !== 'down');
      const ws = availableWs[index % Math.max(availableWs.length, 1)] || { id: '', name: '未分配' };
      
      return {
        id: generateId(),
        workOrderId: newOrderId,
        workOrderNo: newOrder.orderNo,
        processName: step.name,
        workstationId: ws.id,
        workstationName: ws.name,
        seq: index + 1,
        plannedQty: orderData.quantity,
        actualQty: 0,
        status: 'pending',
        qualifiedQty: 0,
        defectQty: 0,
      };
    });
    
    set((state) => ({ 
      workOrders: [newOrder, ...state.workOrders],
      processTasks: [...newTasks, ...state.processTasks],
    }));
  },

  scheduleWorkOrder: (orderId) => {
    const { workOrders, products, workstations, processTasks } = get();
    const order = workOrders.find(o => o.id === orderId);
    const product = products.find(p => p.id === order?.productId);
    if (!order || !product) return;

    const workHoursPerDay = 8;
    const startOfDay = new Date();
    startOfDay.setHours(8, 0, 0, 0);
    
    const orderTasks = processTasks.filter(t => t.workOrderId === orderId).sort((a, b) => a.seq - b.seq);
    let currentTime = new Date(startOfDay);
    let prevTaskEnd: Date | null = null;
    
    const updatedTasks = orderTasks.map(task => {
      const step = product.processRoute.find(s => s.name === task.processName);
      if (!step) return task;
      
      const availableWorkstations = workstations.filter(
        ws => ws.type === step.workstationType && ws.status !== 'down'
      );
      const ws = availableWorkstations[0];
      if (!ws) return task;
      
      const totalMinutes = order.quantity * step.cycleTime;
      const totalHours = totalMinutes / 60;
      const workDays = Math.ceil(totalHours / workHoursPerDay);
      const actualDurationHours = workDays * workHoursPerDay;
      
      let taskStart: Date;
      if (prevTaskEnd) {
        taskStart = new Date(prevTaskEnd);
      } else {
        taskStart = new Date(currentTime);
      }
      
      const taskEnd = new Date(taskStart.getTime() + actualDurationHours * 60 * 60 * 1000);
      prevTaskEnd = taskEnd;
      
      return {
        ...task,
        workstationId: ws.id,
        workstationName: ws.name,
      };
    });
    
    set((state) => ({
      workOrders: state.workOrders.map(o =>
        o.id === orderId
          ? {
              ...o,
              status: 'scheduled' as const,
              scheduledStartDate: startOfDay.toISOString().split('T')[0],
              estimatedCompletionDate: prevTaskEnd?.toISOString().split('T')[0],
            }
          : o
      ),
      processTasks: state.processTasks.map(t => {
        const updated = updatedTasks.find(u => u.id === t.id);
        return updated || t;
      }),
    }));
  },

  updateWorkOrder: (id, updates) => {
    set((state) => ({
      workOrders: state.workOrders.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    }));
  },

  deleteWorkOrder: (id) => {
    set((state) => ({
      workOrders: state.workOrders.filter((o) => o.id !== id),
      processTasks: state.processTasks.filter((t) => t.workOrderId !== id),
    }));
  },

  startProcessTask: (taskId, operator) => {
    const now = new Date().toISOString();
    set((state) => {
      const task = state.processTasks.find(t => t.id === taskId);
      if (!task) return state;
      
      const updatedTasks = state.processTasks.map(t =>
        t.id === taskId
          ? { ...t, status: 'in_progress' as const, startTime: now, operator }
          : t
      );
      
      const order = state.workOrders.find(o => o.id === task.workOrderId);
      const updatedOrders = state.workOrders.map(o =>
        o.id === task.workOrderId && o.status !== 'producing'
          ? { ...o, status: 'producing' as const }
          : o
      );
      
      const updatedWorkstations = state.workstations.map(w =>
        w.id === task.workstationId
          ? { ...w, status: 'running' as const, currentTaskId: taskId }
          : w
      );
      
      return { processTasks: updatedTasks, workOrders: updatedOrders, workstations: updatedWorkstations };
    });
  },

  completeProcessTask: (taskId, actualQty, qualifiedQty, defectQty) => {
    const now = new Date().toISOString();
    set((state) => {
      const task = state.processTasks.find(t => t.id === taskId);
      if (!task) return state;
      
      const updatedTasks = state.processTasks.map(t =>
        t.id === taskId
          ? { ...t, status: 'completed' as const, endTime: now, actualQty, qualifiedQty, defectQty }
          : t
      );
      
      const updatedWorkstations = state.workstations.map(w =>
        w.id === task.workstationId && w.currentTaskId === taskId
          ? { ...w, status: 'idle' as const, currentTaskId: undefined }
          : w
      );
      
      const orderTasks = updatedTasks.filter(t => t.workOrderId === task.workOrderId);
      const allCompleted = orderTasks.every(t => t.status === 'completed');
      
      const updatedOrders = state.workOrders.map(o => {
        if (o.id !== task.workOrderId) return o;
        if (allCompleted) {
          return { ...o, status: 'completed' as const, actualCompletionDate: now.split('T')[0] };
        }
        return o;
      });
      
      return { processTasks: updatedTasks, workOrders: updatedOrders, workstations: updatedWorkstations };
    });
  },

  addException: (exceptionData) => {
    const newException: ExceptionItem = {
      ...exceptionData,
      id: generateId(),
      status: 'reported',
      reportedAt: new Date().toISOString(),
    };
    set((state) => ({ exceptions: [newException, ...state.exceptions] }));
  },

  updateException: (id, updates) => {
    set((state) => ({
      exceptions: state.exceptions.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
  },

  addWarehouseEntry: (entryData) => {
    const newEntry: WarehouseEntry = {
      ...entryData,
      id: generateId(),
      entryTime: new Date().toISOString(),
      shipped: false,
    };
    set((state) => ({
      warehouseEntries: [newEntry, ...state.warehouseEntries],
      workOrders: state.workOrders.map(o =>
        o.id === entryData.workOrderId
          ? { ...o, status: 'warehoused' as const }
          : o
      ),
    }));
  },

  computeSchedule: () => {
    const { workOrders, products, workstations } = get();
    const results: ScheduleResult[] = [];
    
    const workHoursPerDay = 8;
    const startOfDay = new Date();
    startOfDay.setHours(8, 0, 0, 0);
    
    const workstationQueues: Record<string, Date> = {};
    workstations.forEach(ws => {
      workstationQueues[ws.id] = new Date(startOfDay);
    });
    
    const sortedOrders = [...workOrders]
      .filter(o => o.status !== 'completed' && o.status !== 'warehoused')
      .sort((a, b) => {
        const dateA = new Date(a.deliveryDate).getTime();
        const dateB = new Date(b.deliveryDate).getTime();
        return dateA - dateB;
      });
    
    sortedOrders.forEach(order => {
      const product = products.find(p => p.id === order.productId);
      if (!product) return;
      
      const tasks: ScheduleResult['tasks'] = [];
      let prevTaskEnd: Date | null = null;
      
      product.processRoute.forEach((step, seq) => {
        const availableWorkstations = workstations.filter(
          ws => ws.type === step.workstationType && ws.status !== 'down'
        );
        
        if (availableWorkstations.length === 0) return;
        
        let earliestWs = availableWorkstations[0];
        let earliestTime = workstationQueues[earliestWs.id];
        
        availableWorkstations.forEach(ws => {
          if (workstationQueues[ws.id] < earliestTime) {
            earliestTime = workstationQueues[ws.id];
            earliestWs = ws;
          }
        });
        
        const totalMinutes = order.quantity * step.cycleTime;
        const totalHours = totalMinutes / 60;
        const workDays = Math.ceil(totalHours / workHoursPerDay);
        const actualDurationHours = workDays * workHoursPerDay;
        
        const existingTasks = get().processTasks.filter(
          t => t.workOrderId === order.id && t.processName === step.name && t.status !== 'pending'
        );
        
        let taskStart: Date;
        if (existingTasks.length > 0 && existingTasks[0].startTime) {
          taskStart = new Date(existingTasks[0].startTime);
        } else if (prevTaskEnd) {
          taskStart = new Date(Math.max(prevTaskEnd.getTime(), earliestTime.getTime()));
        } else {
          taskStart = new Date(earliestTime);
        }
        
        const taskEnd = new Date(taskStart.getTime() + actualDurationHours * 60 * 60 * 1000);
        workstationQueues[earliestWs.id] = taskEnd;
        prevTaskEnd = taskEnd;
        
        tasks.push({
          processName: step.name,
          workstationId: earliestWs.id,
          workstationName: earliestWs.name,
          seq: seq + 1,
          plannedStart: taskStart.toISOString(),
          plannedEnd: taskEnd.toISOString(),
          duration: totalMinutes,
        });
      });
      
      const totalCycleTime = tasks.reduce((sum, t) => sum + t.duration, 0);
      
      results.push({
        workOrderId: order.id,
        workOrderNo: order.orderNo,
        productName: order.productName,
        tasks,
        totalCycleTime,
      });
    });
    
    return results;
  },

  getBottlenecks: () => {
    const { workstations, processTasks } = get();
    const workHoursPerDay = 8;
    const totalAvailableMinutes = workHoursPerDay * 60;
    
    const bottlenecks: BottleneckInfo[] = [];
    const wsTypes = [...new Set(workstations.map(w => w.type))];
    
    wsTypes.forEach(type => {
      const typeWorkstations = workstations.filter(w => w.type === type && w.status !== 'down');
      if (typeWorkstations.length === 0) return;
      
      const totalCapacity = typeWorkstations.length * totalAvailableMinutes;
      
      const tasksOfType = processTasks.filter(
        t => typeWorkstations.some(ws => ws.id === t.workstationId) && t.status !== 'pending'
      );
      
      let workload = 0;
      tasksOfType.forEach(task => {
        const workstation = workstations.find(w => w.id === task.workstationId);
        if (workstation && workstation.capacityPerHour > 0) {
          const taskMinutes = (task.plannedQty / workstation.capacityPerHour) * 60;
          workload += taskMinutes;
        }
      });
      
      const utilization = Math.min((workload / totalCapacity) * 100, 100);
      const affectedOrders = new Set(tasksOfType.map(t => t.workOrderId)).size;
      
      bottlenecks.push({
        workstationType: type,
        workload: Math.round(utilization * 10) / 10,
        affectedOrders,
        isBottleneck: utilization > 85,
      });
    });
    
    return bottlenecks.sort((a, b) => b.workload - a.workload);
  },

  getDashboardMetrics: (): DashboardMetrics => {
    const { workOrders, processTasks, workstations, exceptions, warehouseEntries } = get();
    
    const today = new Date().toISOString().split('T')[0];
    const todayCompletedTasks = processTasks.filter(
      t => t.status === 'completed' && t.endTime?.startsWith(today)
    );
    const todayOutput = todayCompletedTasks.reduce((sum, t) => sum + t.actualQty, 0);
    
    const runningEquipment = workstations.filter(w => w.status === 'running').length;
    const totalEquipment = workstations.length;
    
    const pendingExceptions = exceptions.filter(
      e => e.status === 'reported' || e.status === 'handling'
    ).length;
    
    const completedOrders = workOrders.filter(o => o.status === 'completed' || o.status === 'warehoused');
    const onTimeCount = completedOrders.filter(o => {
      if (!o.actualCompletionDate) return false;
      return o.actualCompletionDate <= o.deliveryDate;
    }).length;
    const onTimeDeliveryRate = completedOrders.length > 0
      ? Math.round((onTimeCount / completedOrders.length) * 100)
      : 95;
    
    const completedTasks = processTasks.filter(t => t.status === 'completed');
    const totalQty = completedTasks.reduce((sum, t) => sum + t.actualQty, 0);
    const qualifiedQty = completedTasks.reduce((sum, t) => sum + t.qualifiedQty, 0);
    const overallPassRate = totalQty > 0 ? Math.round((qualifiedQty / totalQty) * 1000) / 10 : 97;
    
    const totalWsMinutes = workstations.length * 8 * 60;
    const runningWs = workstations.filter(w => w.status === 'running').length;
    const equipmentUtilization = Math.round((runningWs / workstations.length) * 75 * 10) / 10;
    
    const producingOrders = workOrders.filter(o => o.status === 'producing').length;
    const completedToday = workOrders.filter(
      o => o.actualCompletionDate === today
    ).length;
    
    return {
      todayOutput,
      runningEquipment,
      totalEquipment,
      pendingExceptions,
      onTimeDeliveryRate,
      overallPassRate,
      equipmentUtilization,
      producingOrders,
      completedToday,
    };
  },

  getTasksByWorkOrder: (workOrderId) => {
    return get().processTasks
      .filter(t => t.workOrderId === workOrderId)
      .sort((a, b) => a.seq - b.seq);
  },

  getWorkOrderProgress: (workOrderId) => {
    const tasks = get().processTasks.filter(t => t.workOrderId === workOrderId);
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
    
    let progress = completedTasks.length;
    inProgressTasks.forEach(t => {
      if (t.plannedQty > 0) {
        progress += t.actualQty / t.plannedQty;
      }
    });
    
    return Math.round((progress / tasks.length) * 100);
  },

  rescheduleAll: () => {
    const { workOrders, products, workstations, processTasks } = get();
    const workHoursPerDay = 8;
    const startOfDay = new Date();
    startOfDay.setHours(8, 0, 0, 0);

    const activeOrders = [...workOrders]
      .filter(o => o.status !== 'completed' && o.status !== 'warehoused')
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const pa = priorityOrder[a.priority || 'medium'];
        const pb = priorityOrder[b.priority || 'medium'];
        if (pa !== pb) return pa - pb;
        return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
      });

    const workstationQueues: Record<string, Date> = {};
    workstations.forEach(ws => {
      workstationQueues[ws.id] = new Date(startOfDay);
    });

    const orderUpdates: Record<string, { scheduledStartDate?: string; estimatedCompletionDate?: string; status: WorkOrder['status'] }> = {};
    const taskUpdates: Record<string, { workstationId: string; workstationName: string }> = {};

    activeOrders.forEach(order => {
      const product = products.find(p => p.id === order.productId);
      if (!product) return;

      const orderTasks = processTasks
        .filter(t => t.workOrderId === order.id)
        .sort((a, b) => a.seq - b.seq);

      let prevTaskEnd: Date | null = null;

      orderTasks.forEach(task => {
        const step = product.processRoute.find(s => s.name === task.processName);
        if (!step) return;

        const availableWorkstations = workstations.filter(
          ws => ws.type === step.workstationType && ws.status !== 'down'
        );
        if (availableWorkstations.length === 0) return;

        let earliestWs = availableWorkstations[0];
        let earliestTime = workstationQueues[earliestWs.id];
        availableWorkstations.forEach(ws => {
          if (workstationQueues[ws.id] < earliestTime) {
            earliestTime = workstationQueues[ws.id];
            earliestWs = ws;
          }
        });

        let taskStart: Date;
        if (task.status === 'in_progress' && task.startTime) {
          taskStart = new Date(task.startTime);
        } else if (prevTaskEnd) {
          taskStart = new Date(Math.max(prevTaskEnd.getTime(), earliestTime.getTime()));
        } else {
          taskStart = new Date(earliestTime);
        }

        const totalMinutes = order.quantity * step.cycleTime;
        const totalHours = totalMinutes / 60;
        const workDays = Math.ceil(totalHours / workHoursPerDay);
        const actualDurationHours = Math.max(workDays * workHoursPerDay, 1);
        const taskEnd = new Date(taskStart.getTime() + actualDurationHours * 60 * 60 * 1000);

        workstationQueues[earliestWs.id] = taskEnd;
        prevTaskEnd = taskEnd;

        if (task.status === 'pending') {
          taskUpdates[task.id] = {
            workstationId: earliestWs.id,
            workstationName: earliestWs.name,
          };
        }
      });

      const orderStartDate = startOfDay.toISOString().split('T')[0];
      const orderEndDate = prevTaskEnd ? prevTaskEnd.toISOString().split('T')[0] : undefined;
      const newStatus: WorkOrder['status'] = order.status === 'producing' ? 'producing' : 'scheduled';
      orderUpdates[order.id] = {
        scheduledStartDate: orderStartDate,
        estimatedCompletionDate: orderEndDate,
        status: newStatus,
      };
    });

    set((state) => ({
      workOrders: state.workOrders.map(o => {
        const upd = orderUpdates[o.id];
        if (!upd) return o;
        return {
          ...o,
          status: upd.status,
          scheduledStartDate: upd.scheduledStartDate,
          estimatedCompletionDate: upd.estimatedCompletionDate,
        };
      }),
      processTasks: state.processTasks.map(t => {
        const upd = taskUpdates[t.id];
        if (!upd) return t;
        return { ...t, workstationId: upd.workstationId, workstationName: upd.workstationName };
      }),
    }));

    return activeOrders.length;
  },
}));
