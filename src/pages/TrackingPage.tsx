import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Search,
  Clock,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  User,
  Factory,
  X,
  CalendarClock,
} from 'lucide-react';

export function TrackingPage() {
  const scheduleVersion = useAppStore(s => s.scheduleVersion);
  const { workOrders, processTasks, getWorkOrderProgress, getTasksByWorkOrder, getScheduleResults, getBottlenecks, products } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const filteredOrders = workOrders.filter(order =>
    order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productName.includes(searchTerm) ||
    order.customerName?.includes(searchTerm)
  );

  const getDeliveryRisk = (order: typeof workOrders[0]) => {
    const progress = getWorkOrderProgress(order.id);
    const delivery = new Date(order.deliveryDate);
    const now = new Date();
    const diffDays = Math.ceil((delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (order.status === 'completed' || order.status === 'warehoused') {
      return { level: 'safe', text: '已完成', color: 'text-[#00B42A]' };
    }
    
    if (diffDays <= 0) {
      return { level: 'critical', text: '已超期', color: 'text-[#F53F3F]' };
    }
    if (diffDays <= 2 && progress < 80) {
      return { level: 'high', text: '高风险', color: 'text-[#F53F3F]' };
    }
    if (diffDays <= 5 && progress < 50) {
      return { level: 'medium', text: '中风险', color: 'text-[#FF7D00]' };
    }
    return { level: 'low', text: '正常', color: 'text-[#00B42A]' };
  };

  const selectedOrderData = workOrders.find(o => o.id === selectedOrder);
  const selectedTasks = selectedOrder ? getTasksByWorkOrder(selectedOrder) : [];

  const orderSchedule = useMemo(() => {
    if (!selectedOrder) return null;
    const allSchedules = getScheduleResults();
    return allSchedules.find(s => s.workOrderId === selectedOrder) || null;
  }, [selectedOrder, getScheduleResults, scheduleVersion]);

  const orderBottlenecks = useMemo(() => {
    if (!selectedOrderData) return [];
    const product = products.find(p => p.id === selectedOrderData.productId);
    if (!product) return [];
    const allBottlenecks = getBottlenecks();
    const orderProcessTypes = [...new Set(product.processRoute.map(s => s.workstationType))];
    return allBottlenecks.filter(b => orderProcessTypes.includes(b.workstationType));
  }, [selectedOrderData, products, getBottlenecks, scheduleVersion]);

  const estimatedVsDeliveryRisk = useMemo(() => {
    if (!selectedOrderData) return null;
    const schedule = orderSchedule;
    const estimatedDateStr = schedule && schedule.tasks.length > 0
      ? schedule.tasks[schedule.tasks.length - 1].plannedEnd.split('T')[0]
      : selectedOrderData.estimatedCompletionDate;
    if (!estimatedDateStr) return null;
    const estimated = new Date(estimatedDateStr);
    const delivery = new Date(selectedOrderData.deliveryDate);
    const delayDays = Math.ceil((estimated.getTime() - delivery.getTime()) / (1000 * 60 * 60 * 24));
    return {
      estimatedDateStr,
      delayDays: delayDays > 0 ? delayDays : 0,
      isAtRisk: delayDays > 0,
      isSafe: delayDays < 0,
      safeDays: delayDays < 0 ? Math.abs(delayDays) : 0,
    };
  }, [selectedOrderData, orderSchedule, scheduleVersion]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">订单追踪</h1>
          <p className="text-[#86909C] text-sm mt-1">实时查看订单生产进度与交货风险</p>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="w-5 h-5 text-[#86909C] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="输入订单号、产品名称或客户名称查询..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-12 bg-[#1D2129] border border-[#2D3340] rounded-lg pl-12 pr-4 text-white placeholder-[#86909C] focus:outline-none focus:border-[#165DFF] transition-colors"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
          {filteredOrders.map(order => {
            const progress = getWorkOrderProgress(order.id);
            const risk = getDeliveryRisk(order);
            
            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order.id)}
                className={`bg-[#1D2129] rounded-lg border p-4 cursor-pointer transition-all ${
                  selectedOrder === order.id
                    ? 'border-[#165DFF] shadow-lg shadow-[#165DFF]/10'
                    : 'border-[#2D3340] hover:border-[#3D4455]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-medium font-mono">{order.orderNo}</p>
                    <p className="text-[#86909C] text-xs">{order.productName}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[#86909C]">{order.quantity}件</span>
                  <span className={`flex items-center gap-1 ${risk.color}`}>
                    {risk.level !== 'safe' && risk.level !== 'low' && (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    {risk.text}
                  </span>
                </div>

                <div className="h-1.5 bg-[#2D3340] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      risk.level === 'critical' || risk.level === 'high'
                        ? 'bg-[#F53F3F]'
                        : risk.level === 'medium'
                        ? 'bg-[#FF7D00]'
                        : 'bg-[#00B42A]'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-[#86909C]">进度 {progress}%</span>
                  <span className="text-[10px] text-[#86909C]">{order.deliveryDate}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="col-span-2">
          {selectedOrderData ? (
            <div className="bg-[#1D2129] rounded-lg border border-[#2D3340]">
              <div className="px-6 py-5 border-b border-[#2D3340]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-bold text-white font-mono">{selectedOrderData.orderNo}</h2>
                      <StatusBadge status={selectedOrderData.status} />
                    </div>
                    <p className="text-[#C9CDD4]">{selectedOrderData.productName} · {selectedOrderData.productModel}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium flex items-center gap-1 justify-end ${
                      getDeliveryRisk(selectedOrderData).color
                    }`}>
                      {getDeliveryRisk(selectedOrderData).level !== 'safe' && getDeliveryRisk(selectedOrderData).level !== 'low' && (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      交货风险: {getDeliveryRisk(selectedOrderData).text}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 mt-5 pt-5 border-t border-[#2D3340]">
                  <div>
                    <p className="text-[#86909C] text-xs mb-1">生产数量</p>
                    <p className="text-white text-lg font-mono">{selectedOrderData.quantity} <span className="text-sm text-[#86909C]">件</span></p>
                  </div>
                  <div>
                    <p className="text-[#86909C] text-xs mb-1">交货日期</p>
                    <p className="text-white text-sm flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-[#86909C]" />
                      {selectedOrderData.deliveryDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#86909C] text-xs mb-1">客户</p>
                    <p className="text-white text-sm flex items-center gap-1">
                      <User className="w-4 h-4 text-[#86909C]" />
                      {selectedOrderData.customerName || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#86909C] text-xs mb-1">完成进度</p>
                    <p className="text-white text-lg font-mono">
                      {getWorkOrderProgress(selectedOrder)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#165DFF]" />
                  工序进度
                </h3>

                <div className="space-y-1">
                  {selectedTasks.map((task, index) => (
                    <div key={task.id} className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          task.status === 'completed' ? 'bg-[#00B42A]/20' :
                          task.status === 'in_progress' ? 'bg-[#165DFF]/20' :
                          'bg-[#272E3B]'
                        }`}>
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-[#00B42A]" />
                          ) : task.status === 'in_progress' ? (
                            <div className="w-3 h-3 rounded-full bg-[#165DFF] animate-pulse" />
                          ) : (
                            <span className="text-[#86909C] text-xs font-medium">{task.seq}</span>
                          )}
                        </div>
                        {index < selectedTasks.length - 1 && (
                          <div className={`flex-1 w-0.5 ${
                            task.status === 'completed' ? 'bg-[#00B42A]/30' : 'bg-[#2D3340]'
                          }`} style={{ minHeight: '40px' }} />
                        )}
                      </div>

                      <div className={`flex-1 pb-5 ${
                        task.status === 'pending' ? 'opacity-60' : ''
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{task.processName}</span>
                            <StatusBadge status={task.status} />
                          </div>
                          <span className="text-[#86909C] text-xs">{task.workstationName}</span>
                        </div>

                        {task.status !== 'pending' && (
                          <div className="flex items-center gap-4 text-xs text-[#86909C] mb-2">
                            {task.startTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                开始: {new Date(task.startTime).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            {task.endTime && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                完成: {new Date(task.endTime).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        )}

                        {task.status !== 'pending' && (
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-[#C9CDD4]">
                              产量: <span className="text-white font-mono">{task.actualQty}/{task.plannedQty}</span> 件
                            </span>
                            {task.status === 'completed' && (
                              <>
                                <span className="text-[#00B42A]">
                                  合格: {task.qualifiedQty}
                                </span>
                                {task.defectQty > 0 && (
                                  <span className="text-[#F53F3F]">
                                    不良: {task.defectQty}
                                  </span>
                                )}
                              </>
                            )}
                            {task.operator && (
                              <span className="text-[#86909C]">
                                <User className="w-3 h-3 inline mr-1" />
                                {task.operator}
                              </span>
                            )}
                          </div>
                        )}

                        {task.status === 'in_progress' && (
                          <div className="mt-2">
                            <div className="h-1.5 bg-[#272E3B] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#165DFF] to-[#0E42B3] rounded-full transition-all duration-500"
                                style={{ width: `${(task.actualQty / task.plannedQty) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 bg-[#272E3B]/30 border-t border-[#2D3340] rounded-b-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#86909C]">
                    <Factory className="w-4 h-4 inline mr-1.5" />
                    {selectedOrderData.estimatedCompletionDate 
                      ? `预计完成: ${selectedOrderData.estimatedCompletionDate}`
                      : '尚未排程'}
                  </div>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="text-[#165DFF] text-sm hover:underline flex items-center gap-1"
                  >
                    查看排程详情
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] py-20 text-center">
              <Package className="w-16 h-16 mx-auto text-[#2D3340] mb-4" />
              <p className="text-[#86909C]">请选择一个订单查看详情</p>
            </div>
          )}
        </div>
      </div>

      {showScheduleModal && selectedOrderData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] w-[680px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D3340] sticky top-0 bg-[#1D2129] z-10">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-[#165DFF]" />
                排程详情 · {selectedOrderData.orderNo}
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-[#86909C] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#272E3B] rounded-lg p-3">
                  <p className="text-[#86909C] text-xs">计划投产</p>
                  <p className="text-white text-sm font-mono mt-1">
                    {orderSchedule && orderSchedule.tasks.length > 0
                      ? orderSchedule.tasks[0].plannedStart.split('T')[0]
                      : selectedOrderData.scheduledStartDate || '未排程'}
                  </p>
                </div>
                <div className="bg-[#272E3B] rounded-lg p-3">
                  <p className="text-[#86909C] text-xs">预计完工</p>
                  <p className="text-white text-sm font-mono mt-1">
                    {estimatedVsDeliveryRisk?.estimatedDateStr || selectedOrderData.estimatedCompletionDate || '未计算'}
                  </p>
                </div>
                <div className="bg-[#272E3B] rounded-lg p-3">
                  <p className="text-[#86909C] text-xs">交货日期</p>
                  <p className="text-white text-sm font-mono mt-1">
                    {selectedOrderData.deliveryDate}
                  </p>
                </div>
              </div>

              {estimatedVsDeliveryRisk && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                  estimatedVsDeliveryRisk.isAtRisk
                    ? 'bg-[#F53F3F]/10 border-[#F53F3F]/30'
                    : 'bg-[#00B42A]/10 border-[#00B42A]/30'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    estimatedVsDeliveryRisk.isAtRisk ? 'text-[#F53F3F]' : 'text-[#00B42A]'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      estimatedVsDeliveryRisk.isAtRisk ? 'text-[#F53F3F]' : 'text-[#00B42A]'
                    }`}>
                      {estimatedVsDeliveryRisk.isAtRisk
                        ? `交期风险：预计完工日晚于交货期 ${estimatedVsDeliveryRisk.delayDays} 天`
                        : `交期正常：预计完工早于交货期 ${estimatedVsDeliveryRisk.safeDays} 天`}
                    </p>
                    <p className="text-[#86909C] text-xs mt-0.5">
                      预计完工 {estimatedVsDeliveryRisk.estimatedDateStr} · 交货日期 {selectedOrderData.deliveryDate}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#165DFF]" />
                  各工序计划时间
                </h4>
                {orderSchedule && orderSchedule.tasks.length > 0 ? (
                  <div className="space-y-2">
                    {orderSchedule.tasks.map((task, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 bg-[#272E3B] rounded-lg p-3 border border-[#3D4455]"
                      >
                        <div className="w-7 h-7 rounded-full bg-[#165DFF]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#165DFF] text-xs font-bold">{task.seq}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-medium">{task.processName}</span>
                            <span className="text-[#86909C] text-xs">· {task.workstationName}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-[#86909C]">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(task.plannedStart).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span>→</span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {new Date(task.plannedEnd).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-white text-sm font-mono">
                            {Math.round(task.duration / 60 * 10) / 10}h
                          </p>
                          <p className="text-[#86909C] text-[10px]">工时</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-[#86909C] text-sm bg-[#272E3B] rounded-lg">
                    该订单暂无排程数据，请前往生产排程页面进行排程
                  </div>
                )}
              </div>

              {orderBottlenecks.length > 0 && (
                <div>
                  <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#FF7D00]" />
                    相关工序瓶颈提示
                  </h4>
                  <div className="space-y-2">
                    {orderBottlenecks.map((bottle, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${
                          bottle.isBottleneck
                            ? 'bg-[#F53F3F]/10 border-[#F53F3F]/30'
                            : 'bg-[#272E3B] border-[#3D4455]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm">{bottle.workstationType}</span>
                          {bottle.isBottleneck && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F53F3F]/20 text-[#F53F3F]">
                              瓶颈
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className={`text-sm font-mono ${
                              bottle.isBottleneck ? 'text-[#F53F3F]' : 'text-white'
                            }`}>
                              {bottle.workload}%
                            </span>
                            <span className="text-[#86909C] text-xs ml-1">负载</span>
                          </div>
                          <div className="text-right">
                            <span className="text-white text-sm font-mono">{bottle.affectedOrders}</span>
                            <span className="text-[#86909C] text-xs ml-1">影响订单</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-[#2D3340] flex justify-end">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-[#165DFF] hover:bg-[#0E42B3] text-white text-sm rounded transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
