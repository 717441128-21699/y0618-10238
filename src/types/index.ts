export interface Product {
  id: string;
  model: string;
  name: string;
  processRoute: ProcessStep[];
}

export interface ProcessStep {
  name: string;
  workstationType: string;
  cycleTime: number;
}

export type WorkOrderStatus = 'pending' | 'scheduled' | 'producing' | 'completed' | 'warehoused';

export interface WorkOrder {
  id: string;
  orderNo: string;
  productId: string;
  productName: string;
  productModel: string;
  quantity: number;
  deliveryDate: string;
  status: WorkOrderStatus;
  createdAt: string;
  scheduledStartDate?: string;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  customerName?: string;
  priority?: 'low' | 'medium' | 'high';
  defaultWarehouseQty?: number;
}

export type ProcessTaskStatus = 'pending' | 'in_progress' | 'completed';

export interface ProcessTask {
  id: string;
  workOrderId: string;
  workOrderNo: string;
  processName: string;
  workstationId: string;
  workstationName: string;
  seq: number;
  plannedQty: number;
  actualQty: number;
  startTime?: string;
  endTime?: string;
  status: ProcessTaskStatus;
  qualifiedQty: number;
  defectQty: number;
  operator?: string;
}

export type WorkstationStatus = 'running' | 'idle' | 'maintenance' | 'down';

export interface Workstation {
  id: string;
  name: string;
  type: string;
  capacityPerHour: number;
  status: WorkstationStatus;
  currentTaskId?: string;
  dailyOutput?: number;
}

export type ExceptionType = 'downtime' | 'quality' | 'material' | 'other';
export type ExceptionStatus = 'reported' | 'handling' | 'resolved';

export interface ExceptionItem {
  id: string;
  workOrderId: string;
  workOrderNo: string;
  processName: string;
  type: ExceptionType;
  description: string;
  status: ExceptionStatus;
  reportedAt: string;
  resolvedAt?: string;
  handler?: string;
  resolveNote?: string;
  downtimeMinutes?: number;
}

export interface WarehouseEntry {
  id: string;
  workOrderId: string;
  workOrderNo: string;
  productName: string;
  productModel: string;
  quantity: number;
  entryTime: string;
  operator: string;
  remark?: string;
  shipped?: boolean;
  shippedAt?: string;
}

export interface ScheduleResult {
  workOrderId: string;
  workOrderNo: string;
  productName: string;
  tasks: ScheduledTask[];
  bottleneck?: string;
  totalCycleTime: number;
}

export interface ScheduledTask {
  processName: string;
  workstationId: string;
  workstationName: string;
  seq: number;
  plannedStart: string;
  plannedEnd: string;
  duration: number;
}

export interface BottleneckInfo {
  workstationType: string;
  workload: number;
  affectedOrders: number;
  isBottleneck: boolean;
}

export interface DashboardMetrics {
  todayOutput: number;
  runningEquipment: number;
  totalEquipment: number;
  pendingExceptions: number;
  onTimeDeliveryRate: number;
  overallPassRate: number;
  equipmentUtilization: number;
  producingOrders: number;
  completedToday: number;
}

export interface RescheduleImpact {
  workOrderId: string;
  workOrderNo: string;
  productName: string;
  oldEstimatedCompletion?: string;
  newEstimatedCompletion?: string;
  delayDays: number;
  isNewOrder: boolean;
}

export interface DeliveryRiskInfo {
  workOrderId: string;
  workOrderNo: string;
  productName: string;
  deliveryDate: string;
  estimatedCompletion?: string;
  delayDays: number;
  stuckProcess?: string;
  stuckWorkstationType?: string;
  priority?: 'low' | 'medium' | 'high';
  suggestions: string[];
}
