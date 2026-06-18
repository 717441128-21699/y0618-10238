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
  RescheduleImpact,
  DeliveryRiskInfo,
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
  scheduleVersion: number;
  lastRescheduleImpacts: RescheduleImpact[];
  lastScheduleResults: ScheduleResult[];
  
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
  getScheduleResults: () => ScheduleResult[];
  getBottlenecks: () => BottleneckInfo[];
  getDashboardMetrics: () => DashboardMetrics;
  rescheduleAll: () => number;
  rescheduleAllWithImpact: () => { count: number; impacts: RescheduleImpact[] };
  getDeliveryRisks: () => DeliveryRiskInfo[];
  clearLastImpacts: () => void;
  
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
  scheduleVersion: 1,
  lastRescheduleImpacts: [],
  lastScheduleResults: [],

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
      justCreated: true,
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
      scheduleVersion: state.scheduleVersion + 1,
      lastScheduleResults: [],
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
      scheduleVersion: state.scheduleVersion + 1,
      lastScheduleResults: [],
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
      
      return {
        processTasks: updatedTasks,
        workOrders: updatedOrders,
        workstations: updatedWorkstations,
        scheduleVersion: state.scheduleVersion + 1,
        lastScheduleResults: [],
      };
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
      
      const orderTasks = updatedTasks.filter(t => t.workOrderId === task.workOrderId).sort((a, b) => a.seq - b.seq);
      const allCompleted = orderTasks.every(t => t.status === 'completed');
      const lastSeq = Math.max(...orderTasks.map(t => t.seq));
      const isLastTask = task.seq === lastSeq;
      const defaultWarehouseQty = isLastTask ? qualifiedQty : 0;

      const updatedOrders = state.workOrders.map(o => {
        if (o.id !== task.workOrderId) return o;
        const updates: Partial<WorkOrder> = {};
        if (allCompleted) {
          updates.status = 'completed';
          updates.actualCompletionDate = now.split('T')[0];
        }
        if (isLastTask && defaultWarehouseQty > 0) {
          updates.defaultWarehouseQty = defaultWarehouseQty;
        }
        return Object.keys(updates).length > 0 ? { ...o, ...updates } : o;
      });
      
      return {
        processTasks: updatedTasks,
        workOrders: updatedOrders,
        workstations: updatedWorkstations,
        scheduleVersion: state.scheduleVersion + 1,
        lastScheduleResults: [],
      };
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
      scheduleVersion: state.scheduleVersion + 1,
      lastScheduleResults: [],
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
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const pa = priorityOrder[a.priority || 'medium'];
        const pb = priorityOrder[b.priority || 'medium'];
        if (pa !== pb) return pa - pb;
        return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime();
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

  getScheduleResults: () => {
    const { lastScheduleResults } = get();
    if (lastScheduleResults.length > 0) {
      return lastScheduleResults;
    }
    return get().computeSchedule();
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
    const { workOrders, processTasks } = get();

    const results = get().computeSchedule();

    const orderUpdates: Record<string, { scheduledStartDate?: string; estimatedCompletionDate?: string; status: WorkOrder['status'] }> = {};
    const taskUpdates: Record<string, { workstationId: string; workstationName: string }> = {};

    results.forEach(result => {
      const order = workOrders.find(o => o.id === result.workOrderId);
      if (!order) return;
      const orderTasks = processTasks
        .filter(t => t.workOrderId === result.workOrderId)
        .sort((a, b) => a.seq - b.seq);

      const firstTask = result.tasks[0];
      const lastTask = result.tasks[result.tasks.length - 1];
      const orderStartDate = firstTask ? firstTask.plannedStart.split('T')[0] : undefined;
      const orderEndDate = lastTask ? lastTask.plannedEnd.split('T')[0] : undefined;
      const newStatus: WorkOrder['status'] = order.status === 'producing' ? 'producing' : 'scheduled';
      orderUpdates[result.workOrderId] = {
        scheduledStartDate: orderStartDate,
        estimatedCompletionDate: orderEndDate,
        status: newStatus,
      };

      result.tasks.forEach(schedTask => {
        const matchedTask = orderTasks.find(t => t.seq === schedTask.seq);
        if (matchedTask && matchedTask.status === 'pending') {
          taskUpdates[matchedTask.id] = {
            workstationId: schedTask.workstationId,
            workstationName: schedTask.workstationName,
          };
        }
      });
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
      lastScheduleResults: results,
      scheduleVersion: state.scheduleVersion + 1,
    }));

    return results.length;
  },

  rescheduleAllWithImpact: () => {
    const { workOrders } = get();
    const beforeMap: Record<string, { estDate?: string; justCreated: boolean }> = {};
    workOrders.forEach(o => {
      beforeMap[o.id] = {
        estDate: o.estimatedCompletionDate,
        justCreated: o.justCreated === true,
      };
    });

    const count = get().rescheduleAll();

    const impacts: RescheduleImpact[] = [];
    get().workOrders.forEach(o => {
      const before = beforeMap[o.id];
      const oldDate = before?.estDate;
      const newDate = o.estimatedCompletionDate;
      const wasJustCreated = before?.justCreated === true;

      let delayDays = 0;
      if (oldDate && newDate) {
        delayDays = Math.ceil(
          (new Date(newDate).getTime() - new Date(oldDate).getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      const isAffected = wasJustCreated || (oldDate !== undefined && delayDays !== 0);
      if (isAffected) {
        impacts.push({
          workOrderId: o.id,
          workOrderNo: o.orderNo,
          productName: o.productName,
          oldEstimatedCompletion: oldDate,
          newEstimatedCompletion: newDate,
          delayDays,
          isNewOrder: wasJustCreated,
        });
      }
    });

    set((state) => ({
      lastRescheduleImpacts: impacts,
      workOrders: state.workOrders.map(o => ({ ...o, justCreated: false })),
    }));

    return { count, impacts };
  },

  clearLastImpacts: () => {
    set({ lastRescheduleImpacts: [] });
  },

  getDeliveryRisks: (): DeliveryRiskInfo[] => {
    const { workOrders, processTasks, products, workstations } = get();
    const schedules = get().getScheduleResults();
    const bottlenecks = get().getBottlenecks();
    const results: DeliveryRiskInfo[] = [];

    workOrders.forEach(order => {
      if (order.status === 'completed' || order.status === 'warehoused') return;

      const schedule = schedules.find(s => s.workOrderId === order.id);
      const estimatedEnd = schedule && schedule.tasks.length > 0
        ? new Date(schedule.tasks[schedule.tasks.length - 1].plannedEnd)
        : (order.estimatedCompletionDate ? new Date(order.estimatedCompletionDate) : null);
      const delivery = new Date(order.deliveryDate);
      let delayDays = 0;
      if (estimatedEnd) {
        delayDays = Math.ceil(
          (estimatedEnd.getTime() - delivery.getTime()) / (1000 * 60 * 60 * 24)
        );
      }
      if (delayDays < 0) delayDays = 0;
      if (!estimatedEnd) delayDays = 0;

      const suggestions: string[] = [];
      let stuckProcess: string | undefined;
      let stuckWorkstationType: string | undefined;

      if (estimatedEnd && delayDays > 0) {
        const product = products.find(p => p.id === order.productId);
        const orderTasks = processTasks.filter(t => t.workOrderId === order.id);

        const inProgressTask = orderTasks.find(t => t.status === 'in_progress');
        const pendingTask = [...orderTasks].sort((a, b) => a.seq - b.seq).find(t => t.status === 'pending');

        let checkTask: typeof orderTasks[0] | undefined = inProgressTask || pendingTask;
        if (checkTask) {
          const step = product?.processRoute.find(s => s.name === checkTask!.processName);
          if (step) {
            stuckProcess = step.name;
            stuckWorkstationType = step.workstationType;
            const bottle = bottlenecks.find(b => b.workstationType === step.workstationType);
            if (bottle?.isBottleneck) {
              suggestions.push(`【${step.workstationType}】机台负载 ${bottle.workload}%，优先安排该工单在空闲同类型机台生产`);
            } else {
              suggestions.push(`检查【${step.name}】物料到位情况，尽快启动`);
            }
          }
        }

        if (schedule) {
          const longTask = [...schedule.tasks].sort((a, b) => b.duration - a.duration)[0];
          if (longTask && longTask.processName !== stuckProcess) {
            const sameTypeWs = workstations.filter(
              w => w.type === stuckWorkstationType || 
              schedule.tasks.find(t => t.workstationId === w.id)?.processName === longTask.processName
            );
            const idleCount = sameTypeWs.filter(w => w.status === 'idle').length;
            if (idleCount > 0) {
              suggestions.push(`工时最长工序【${longTask.processName}】有 ${idleCount} 台空闲机台，可协调并行处理`);
            }
          }
        }

        if (delayDays >= 3) {
          suggestions.push(`建议提前与客户沟通交期，延迟约 ${delayDays} 天`);
        }

        const highPriority = order.priority === 'high';
        if (highPriority && delayDays > 0) {
          suggestions.push('该工单为高优先级，可暂停普通工单以让该机台优先生产');
        }

        if (suggestions.length === 0) {
          suggestions.push('建议关注该工单进度，必要时协调加班补产');
        }

        results.push({
          workOrderId: order.id,
          workOrderNo: order.orderNo,
          productName: order.productName,
          deliveryDate: order.deliveryDate,
          estimatedCompletion: estimatedEnd ? estimatedEnd.toISOString().split('T')[0] : undefined,
          delayDays,
          stuckProcess,
          stuckWorkstationType,
          priority: order.priority,
          suggestions,
        });
      }
    });

    return results.sort((a, b) => b.delayDays - a.delayDays);
  },
}));
