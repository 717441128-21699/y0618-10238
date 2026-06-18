import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  CalendarClock,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  Zap,
  X,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Gauge,
  Factory,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import type { DeliveryRiskInfo, RescheduleImpact } from '@/types';

export function SchedulingPage() {
  const scheduleVersion = useAppStore(s => s.scheduleVersion);
  const lastImpacts = useAppStore(s => s.lastRescheduleImpacts);
  const clearLastImpacts = useAppStore(s => s.clearLastImpacts);

  const {
    getScheduleResults,
    getBottlenecks,
    workOrders,
    workstations,
    rescheduleAll,
    rescheduleAllWithImpact,
    getDeliveryRisks,
  } = useAppStore();

  const [daysRange, setDaysRange] = useState(7);
  const [startOffset, setStartOffset] = useState(0);
  const [rescheduleMessage, setRescheduleMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [showImpactPanel, setShowImpactPanel] = useState(true);

  const schedules = useMemo(() => getScheduleResults(), [getScheduleResults, scheduleVersion]);
  const bottlenecks = useMemo(() => getBottlenecks(), [getBottlenecks, scheduleVersion]);
  const deliveryRisks = useMemo(() => getDeliveryRisks(), [getDeliveryRisks, scheduleVersion]);

  const impactedOrders = lastImpacts.filter(i => !i.isNewOrder);
  const newOrders = lastImpacts.filter(i => i.isNewOrder);
  const delayedOrders = impactedOrders.filter(i => i.delayDays > 0);
  const advancedOrders = impactedOrders.filter(i => i.delayDays < 0);

  const handleReschedule = (withImpact = true) => {
    setIsRescheduling(true);
    let text = '';
    if (withImpact) {
      const { count, impacts } = rescheduleAllWithImpact();
      const delayed = impacts.filter(i => !i.isNewOrder && i.delayDays > 0).length;
      const advanced = impacts.filter(i => !i.isNewOrder && i.delayDays < 0).length;
      const added = impacts.filter(i => i.isNewOrder).length;
      const parts = [`共重新计算 ${count} 个在制订单`];
      if (added > 0) parts.push(`${added} 个新订单纳入排程`);
      if (delayed > 0) parts.push(`${delayed} 个订单预计交期延后`);
      if (advanced > 0) parts.push(`${advanced} 个订单预计交期提前`);
      text = parts.join('；');
      setShowImpactPanel(true);
    } else {
      const affectedCount = rescheduleAll();
      text = `已完成重新排程：共重新计算 ${affectedCount} 个在制订单的计划时间与工序分配`;
    }
    setIsRescheduling(false);
    setRescheduleMessage({ type: 'success', text });
    setTimeout(() => setRescheduleMessage(null), 8000);
  };

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + startOffset);
  startDate.setHours(0, 0, 0, 0);

  const days = Array.from({ length: daysRange }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const getTaskPosition = (task: { plannedStart: string; plannedEnd: string }) => {
    const start = new Date(task.plannedStart);
    const end = new Date(task.plannedEnd);
    const totalMs = daysRange * 24 * 60 * 60 * 1000;
    const startOffsetMs = start.getTime() - startDate.getTime();
    const durationMs = end.getTime() - start.getTime();
    
    const left = Math.max(0, (startOffsetMs / totalMs) * 100);
    const width = Math.max(2, (durationMs / totalMs) * 100);
    
    return { left: `${left}%`, width: `${width}%` };
  };

  const processColors: Record<string, string> = {
    '下料': 'from-[#165DFF] to-[#0E42B3]',
    '粗车': 'from-[#00B42A] to-[#007A29]',
    '精车': 'from-[#722ED1] to-[#531D9E]',
    '磨削': 'from-[#FF7D00] to-[#B35800]',
    '检测': 'from-[#0FC6C2] to-[#0A8A87]',
    '包装': 'from-[#86909C] to-[#4E5969]',
    '锻造': 'from-[#F53F3F] to-[#B32929]',
    '滚齿': 'from-[#FFC72C] to-[#B38B1E]',
    '热处理': 'from-[#FF5722] to-[#B33D14]',
    '冲压': 'from-[#00C48C] to-[#008A62]',
    '焊接': 'from-[#9C27B0] to-[#6D1B7D]',
    '喷涂': 'from-[#2196F3] to-[#1464B0]',
    '烘干': 'from-[#FF9800] to-[#B36A00]',
    '钻孔': 'from-[#607D8B] to-[#425A64]',
  };

  const activeSchedules = schedules.filter(s => {
    const hasTasks = s.tasks.length > 0;
    return hasTasks;
  });

  const totalRiskDays = deliveryRisks.reduce((s, r) => s + r.delayDays, 0);

  const riskBadge = (risk: DeliveryRiskInfo) => {
    if (risk.delayDays >= 5) return 'bg-[#F53F3F]';
    if (risk.delayDays >= 3) return 'bg-[#FF7D00]';
    return 'bg-[#FFC72C] text-[#1D2129]';
  };

  const renderImpactBadge = (imp: RescheduleImpact) => {
    if (imp.isNewOrder)
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#165DFF]/20 text-[#165DFF]">新插单</span>;
    if (imp.delayDays > 0)
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F53F3F]/20 text-[#F53F3F]">延后 {imp.delayDays}天</span>;
    if (imp.delayDays < 0)
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00B42A]/20 text-[#00B42A]">提前 {Math.abs(imp.delayDays)}天</span>;
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#272E3B] text-[#86909C]">无变化</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">生产排程</h1>
          <p className="text-[#86909C] text-sm mt-1">智能排程 · 瓶颈分析 · 交期风险管理</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#1D2129] border border-[#2D3340] rounded p-1">
            {[3, 7, 14].map(days => (
              <button
                key={days}
                onClick={() => setDaysRange(days)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  daysRange === days
                    ? 'bg-[#165DFF] text-white'
                    : 'text-[#86909C] hover:text-white'
                }`}
              >
                {days}天
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStartOffset(o => o - 1)}
              className="w-8 h-8 bg-[#1D2129] border border-[#2D3340] rounded flex items-center justify-center hover:border-[#3D4455] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#C9CDD4]" />
            </button>
            <span className="text-white text-sm px-3 min-w-[140px] text-center">
              {startDate.toLocaleDateString('zh-CN')}
            </span>
            <button
              onClick={() => setStartOffset(o => o + 1)}
              className="w-8 h-8 bg-[#1D2129] border border-[#2D3340] rounded flex items-center justify-center hover:border-[#3D4455] transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#C9CDD4]" />
            </button>
          </div>
          <button
            onClick={() => handleReschedule(true)}
            disabled={isRescheduling}
            className="flex items-center gap-2 px-3 py-2 bg-[#165DFF] hover:bg-[#0E42B3] border border-[#165DFF] text-white text-sm rounded transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRescheduling ? 'animate-spin' : ''}`} />
            {isRescheduling ? '排程中...' : '重新排程'}
          </button>
        </div>
      </div>

      {rescheduleMessage && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
          rescheduleMessage.type === 'success'
            ? 'bg-[#00B42A]/10 border-[#00B42A]/30 text-[#00B42A]'
            : 'bg-[#165DFF]/10 border-[#165DFF]/30 text-[#165DFF]'
        }`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{rescheduleMessage.text}</span>
        </div>
      )}

      {/* 重排程影响对比面板 */}
      {lastImpacts.length > 0 && showImpactPanel && (
        <div className="bg-[#1D2129] rounded-lg border border-[#165DFF]/40 overflow-hidden">
          <div className="px-5 py-3 border-b border-[#2D3340] flex items-center justify-between bg-[#165DFF]/5">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#165DFF]" />
              <h3 className="font-semibold text-white text-sm">本次排程影响对比</h3>
              <div className="flex items-center gap-2 text-xs">
                {newOrders.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-[#165DFF]/20 text-[#165DFF]">
                    新插单 {newOrders.length}
                  </span>
                )}
                {delayedOrders.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-[#F53F3F]/20 text-[#F53F3F]">
                    延后 {delayedOrders.length}
                  </span>
                )}
                {advancedOrders.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-[#00B42A]/20 text-[#00B42A]">
                    提前 {advancedOrders.length}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => { clearLastImpacts(); setShowImpactPanel(false); }}
              className="text-[#86909C] hover:text-white"
              title="关闭面板"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {lastImpacts.map(imp => (
                <div
                  key={imp.workOrderId}
                  className={`bg-[#272E3B] rounded-lg p-3 border ${
                    imp.isNewOrder ? 'border-[#165DFF]/40' :
                    imp.delayDays > 0 ? 'border-[#F53F3F]/40' :
                    imp.delayDays < 0 ? 'border-[#00B42A]/40' : 'border-[#3D4455]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium font-mono">{imp.workOrderNo}</span>
                    {renderImpactBadge(imp)}
                  </div>
                  <p className="text-[#86909C] text-xs mt-1 truncate">{imp.productName}</p>
                  {(imp.oldEstimatedCompletion || imp.newEstimatedCompletion) && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-[#C9CDD4]">
                      <span className={`font-mono ${imp.isNewOrder ? 'text-[#86909C] line-through' : ''}`}>
                        {imp.oldEstimatedCompletion || '未排'}
                      </span>
                      <ArrowRight className="w-3 h-3 text-[#86909C]" />
                      <span className="font-mono text-white">
                        {imp.newEstimatedCompletion || '未排'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 瓶颈卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {bottlenecks.slice(0, 4).map((bottle, index) => (
          <div
            key={index}
            className={`bg-[#1D2129] rounded-lg border p-4 transition-colors ${
              bottle.isBottleneck ? 'border-[#F53F3F]/50' : 'border-[#2D3340]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gauge className={`w-4 h-4 ${bottle.isBottleneck ? 'text-[#F53F3F]' : 'text-[#00B42A]'}`} />
                <span className="text-white text-sm font-medium">{bottle.workstationType}</span>
              </div>
              {bottle.isBottleneck && (
                <span className="flex items-center gap-1 text-[#F53F3F] text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  瓶颈
                </span>
              )}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-2xl font-bold text-white font-mono">{bottle.workload}%</span>
                <p className="text-[#86909C] text-xs mt-1">负载率</p>
              </div>
              <div className="text-right">
                <span className="text-white text-sm font-mono">{bottle.affectedOrders}</span>
                <p className="text-[#86909C] text-xs">影响订单</p>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-[#2D3340] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  bottle.isBottleneck ? 'bg-[#F53F3F]' : 'bg-[#00B42A]'
                }`}
                style={{ width: `${Math.min(bottle.workload, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 交期风险面板 */}
      <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2D3340] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${deliveryRisks.length > 0 ? 'text-[#F53F3F]' : 'text-[#00B42A]'}`} />
            <h3 className="font-semibold text-white">交期风险面板</h3>
            {deliveryRisks.length > 0 ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-[#F53F3F]/20 text-[#F53F3F]">
                  延期 {deliveryRisks.length} 单
                </span>
                <span className="px-2 py-0.5 rounded bg-[#FF7D00]/20 text-[#FF7D00]">
                  合计延后 {totalRiskDays} 天
                </span>
              </div>
            ) : (
              <span className="flex items-center gap-1 text-[#00B42A] text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                暂无延期订单
              </span>
            )}
          </div>
        </div>

        <div>
          {deliveryRisks.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-[#00B42A]/60 mb-3" />
              <p className="text-[#86909C] text-sm">所有在制订单交期正常</p>
            </div>
          ) : (
            <div className="divide-y divide-[#2D3340]">
              {deliveryRisks.map(risk => {
                const isExpanded = expandedRisk === risk.workOrderId;
                return (
                  <div key={risk.workOrderId} className="bg-[#272E3B]/10 hover:bg-[#272E3B]/30 transition-colors">
                    <button
                      className="w-full px-5 py-3.5 flex items-center gap-4 text-left"
                      onClick={() => setExpandedRisk(isExpanded ? null : risk.workOrderId)}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${riskBadge(risk)}`} />
                      <div className="min-w-0 flex-1 grid grid-cols-5 gap-3 items-center">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-medium font-mono truncate">{risk.workOrderNo}</span>
                            {risk.priority === 'high' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F53F3F]/20 text-[#F53F3F]">高优先</span>
                            )}
                          </div>
                          <p className="text-[#86909C] text-xs mt-0.5 truncate">{risk.productName}</p>
                        </div>
                        <div>
                          <p className="text-[#86909C] text-[11px]">交货日期</p>
                          <p className="text-white text-xs font-mono mt-0.5">{risk.deliveryDate}</p>
                        </div>
                        <div>
                          <p className="text-[#86909C] text-[11px]">预计完工</p>
                          <p className="text-[#FF7D00] text-xs font-mono mt-0.5">{risk.estimatedCompletion || '未计算'}</p>
                        </div>
                        <div>
                          <p className="text-[#86909C] text-[11px]">当前卡滞</p>
                          <p className="text-white text-xs mt-0.5">
                            {risk.stuckProcess
                              ? <span className="px-1.5 py-0.5 rounded bg-[#272E3B]">{risk.stuckProcess}</span>
                              : <span className="text-[#86909C]">—</span>
                            }
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-right">
                            <p className="text-[#86909C] text-[11px]">预计延期</p>
                            <p className="text-[#F53F3F] text-sm font-bold font-mono mt-0.5">
                              {risk.delayDays} 天
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[#86909C] flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#86909C] flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-4 pl-14">
                        <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4 text-[#FFC72C]" />
                            <p className="text-white text-sm font-medium">处理建议</p>
                          </div>
                          <ul className="space-y-2">
                            {risk.suggestions.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-[#C9CDD4]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FFC72C] mt-1.5 flex-shrink-0" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 甘特图 */}
      <div className="bg-[#1D2129] rounded-lg border border-[#2D3340]">
        <div className="px-5 py-4 border-b border-[#2D3340] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-[#165DFF]" />
            <h3 className="font-semibold text-white">排程甘特图</h3>
          </div>
          <div className="text-[#86909C] text-sm">
            共 {activeSchedules.length} 个排程中订单
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="flex border-b border-[#2D3340]">
              <div className="w-48 flex-shrink-0 px-4 py-3 text-[#86909C] text-xs font-medium border-r border-[#2D3340]">
                订单 / 工序
              </div>
              <div className="flex-1 flex">
                {days.map((day, i) => {
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={i}
                      className={`flex-1 py-3 text-center text-xs font-medium border-r border-[#2D3340] ${
                        isToday ? 'bg-[#165DFF]/10 text-[#165DFF]' :
                        isWeekend ? 'text-[#86909C]' : 'text-[#C9CDD4]'
                      }`}
                    >
                      {day.getMonth() + 1}/{day.getDate()}
                      <span className="text-[10px] ml-1">
                        {['日', '一', '二', '三', '四', '五', '六'][day.getDay()]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="divide-y divide-[#2D3340]">
              {activeSchedules.map(schedule => {
                const order = workOrders.find(o => o.id === schedule.workOrderId);
                return (
                  <div key={schedule.workOrderId} className="group">
                    <div className="flex bg-[#272E3B]/30 hover:bg-[#272E3B]/50 transition-colors">
                      <div className="w-48 flex-shrink-0 px-4 py-2.5 border-r border-[#2D3340]">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium font-mono">
                            {schedule.workOrderNo}
                          </span>
                          {order && <StatusBadge status={order.status} size="sm" />}
                        </div>
                        <p className="text-[#86909C] text-xs mt-0.5 truncate">
                          {schedule.productName}
                        </p>
                        {order?.estimatedCompletionDate && (
                          <p className="text-[10px] text-[#86909C] mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            预计完工 {order.estimatedCompletionDate}
                          </p>
                        )}
                      </div>
                      <div className="flex-1 relative py-2 px-2">
                        <div className="relative h-6">
                          {schedule.tasks.map((task, idx) => {
                            const pos = getTaskPosition(task);
                            const color = processColors[task.processName] || 'from-[#86909C] to-[#4E5969]';
                            const leftNum = parseFloat(pos.left);
                            const widthNum = parseFloat(pos.width);
                            
                            if (leftNum > 100 || leftNum + widthNum < 0) return null;
                            
                            return (
                              <div
                                key={idx}
                                className={`absolute top-0 h-6 rounded bg-gradient-to-r ${color} cursor-pointer hover:opacity-90 transition-opacity flex items-center px-1.5 overflow-hidden`}
                                style={{
                                  left: pos.left,
                                  width: pos.width,
                                  minWidth: widthNum < 5 ? 'auto' : undefined,
                                }}
                                title={`${task.processName} - ${task.workstationName}`}
                              >
                                {widthNum >= 8 && (
                                  <span className="text-white text-[10px] truncate font-medium">
                                    {task.processName}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#1D2129] rounded-lg border border-[#2D3340]">
          <div className="px-5 py-4 border-b border-[#2D3340] flex items-center gap-2">
            <Factory className="w-5 h-5 text-[#165DFF]" />
            <h3 className="font-semibold text-white">设备状态一览</h3>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {workstations.map(ws => (
              <div
                key={ws.id}
                className="bg-[#272E3B] rounded-lg p-3 border border-[#3D4455]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">{ws.name}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    ws.status === 'running' ? 'bg-[#00B42A]' :
                    ws.status === 'idle' ? 'bg-[#86909C]' :
                    ws.status === 'maintenance' ? 'bg-[#FF7D00]' : 'bg-[#F53F3F]'
                  }`} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#86909C]">{ws.type}</span>
                  <span className="text-[#C9CDD4]">{ws.capacityPerHour}件/时</span>
                </div>
                <StatusBadge status={ws.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1D2129] rounded-lg border border-[#2D3340]">
          <div className="px-5 py-4 border-b border-[#2D3340] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00B42A]" />
            <h3 className="font-semibold text-white">排程说明</h3>
          </div>
          <div className="p-5 space-y-4 text-sm text-[#C9CDD4]">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#165DFF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#165DFF] text-xs font-bold">1</span>
              </div>
              <div>
                <p className="text-white font-medium">智能排程算法</p>
                <p className="text-[#86909C] text-xs mt-1">
                  按交货期优先级排序，计算机台负载队列，推算最早可投产时间
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#00B42A]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#00B42A] text-xs font-bold">2</span>
              </div>
              <div>
                <p className="text-white font-medium">瓶颈识别</p>
                <p className="text-[#86909C] text-xs mt-1">
                  负载率超过85%的工序自动标记为产能瓶颈，提示关注
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#FF7D00]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#FF7D00] text-xs font-bold">3</span>
              </div>
              <div>
                <p className="text-white font-medium">插单对比</p>
                <p className="text-[#86909C] text-xs mt-1">
                  新建高优先级工单后点击重新排程，可查看受挤压订单及交期影响
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#F53F3F]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#F53F3F] text-xs font-bold">4</span>
              </div>
              <div>
                <p className="text-white font-medium">交期风险管理</p>
                <p className="text-[#86909C] text-xs mt-1">
                  自动识别延期订单，定位卡滞工序，提供优先处理建议
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
