import { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CalendarClock, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, TrendingUp, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

export function SchedulingPage() {
  const { computeSchedule, getBottlenecks, workOrders, workstations, rescheduleAll } = useAppStore();
  const [daysRange, setDaysRange] = useState(7);
  const [startOffset, setStartOffset] = useState(0);
  const [rescheduleMessage, setRescheduleMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const schedules = useMemo(() => computeSchedule(), [computeSchedule]);
  const bottlenecks = useMemo(() => getBottlenecks(), [getBottlenecks]);

  const handleReschedule = () => {
    setIsRescheduling(true);
    const affectedCount = rescheduleAll();
    setIsRescheduling(false);
    setRescheduleMessage({
      type: 'success',
      text: `已完成重新排程：共重新计算 ${affectedCount} 个在制订单的计划时间与工序分配`,
    });
    setTimeout(() => setRescheduleMessage(null), 6000);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">生产排程</h1>
          <p className="text-[#86909C] text-sm mt-1">智能排程与产能瓶颈分析</p>
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
            onClick={handleReschedule}
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

      <div className="grid grid-cols-4 gap-4">
        {bottlenecks.slice(0, 4).map((bottle, index) => (
          <div
            key={index}
            className={`bg-[#1D2129] rounded-lg border p-4 transition-colors ${
              bottle.isBottleneck ? 'border-[#F53F3F]/50' : 'border-[#2D3340]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-sm font-medium">{bottle.workstationType}</span>
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
          <div className="px-5 py-4 border-b border-[#2D3340]">
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
                <p className="text-white font-medium">动态调整</p>
                <p className="text-[#86909C] text-xs mt-1">
                  生产过程中实时根据实际进度重排，异常情况自动预警
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
