import { useAppStore } from '@/store/useAppStore';
import {
  Package,
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
  Target,
  Zap,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const {
    getDashboardMetrics,
    workOrders,
    exceptions,
    workstations,
    getWorkOrderProgress,
  } = useAppStore();

  const metrics = getDashboardMetrics();

  const urgentOrders = workOrders
    .filter(o => o.status === 'producing' || o.status === 'scheduled')
    .filter(o => {
      const delivery = new Date(o.deliveryDate);
      const now = new Date();
      const diffDays = (delivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 5;
    })
    .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
    .slice(0, 5);

  const pendingExceptions = exceptions
    .filter(e => e.status === 'reported' || e.status === 'handling')
    .slice(0, 5);

  const runningWorkstations = workstations
    .filter(w => w.status === 'running' || w.status === 'idle')
    .slice(0, 6);

  const metricCards = [
    {
      label: '今日产量',
      value: metrics.todayOutput,
      unit: '件',
      icon: Package,
      color: 'from-[#165DFF] to-[#0E42B3]',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      label: '运行设备',
      value: `${metrics.runningEquipment}/${metrics.totalEquipment}`,
      unit: '台',
      icon: Activity,
      color: 'from-[#00B42A] to-[#007A29]',
      trend: `${Math.round(metrics.equipmentUtilization)}%`,
      trendUp: true,
    },
    {
      label: '待处理异常',
      value: metrics.pendingExceptions,
      unit: '项',
      icon: AlertTriangle,
      color: 'from-[#F53F3F] to-[#B32929]',
      trend: '需关注',
      trendUp: false,
    },
    {
      label: '准时交货率',
      value: metrics.onTimeDeliveryRate,
      unit: '%',
      icon: Clock,
      color: 'from-[#722ED1] to-[#531D9E]',
      trend: '+2.3%',
      trendUp: true,
    },
    {
      label: '工序合格率',
      value: metrics.overallPassRate,
      unit: '%',
      icon: Target,
      color: 'from-[#FF7D00] to-[#B35800]',
      trend: '+0.8%',
      trendUp: true,
    },
    {
      label: '在制订单',
      value: metrics.producingOrders,
      unit: '单',
      icon: Zap,
      color: 'from-[#0FC6C2] to-[#0A8A87]',
      trend: '进行中',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">工作台</h1>
          <p className="text-[#86909C] text-sm mt-1">生产概览与核心指标</p>
        </div>
        <div className="text-right">
          <p className="text-[#86909C] text-xs">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-[#1D2129] rounded-lg border border-[#2D3340] p-4 hover:border-[#3D4455] transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  card.trendUp ? 'bg-[#00B42A]/15 text-[#00B42A]' : 'bg-[#F53F3F]/15 text-[#F53F3F]'
                }`}>
                  {card.trend}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-[#86909C] text-xs">{card.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-white font-mono">{card.value}</span>
                  <span className="text-[#86909C] text-xs">{card.unit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-[#1D2129] rounded-lg border border-[#2D3340]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D3340]">
            <h3 className="font-semibold text-white">紧急订单</h3>
            <Link to="/tracking" className="text-[#165DFF] text-sm hover:underline flex items-center gap-1">
              查看全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-2">
            {urgentOrders.map(order => {
              const progress = getWorkOrderProgress(order.id);
              const deliveryDate = new Date(order.deliveryDate);
              const now = new Date();
              const diffDays = Math.ceil((deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isRisk = diffDays <= 2 && progress < 80;

              return (
                <div
                  key={order.id}
                  className="flex items-center gap-4 p-3 hover:bg-[#272E3B]/50 rounded-lg transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{order.orderNo}</span>
                      <StatusBadge status={order.status} />
                      {isRisk && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F53F3F]/15 text-[#F53F3F]">
                          交付风险
                        </span>
                      )}
                    </div>
                    <p className="text-[#86909C] text-xs mt-0.5 truncate">
                      {order.productName} · {order.quantity}件 · {order.customerName}
                    </p>
                  </div>
                  <div className="w-32">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#86909C]">进度</span>
                      <span className="text-white font-mono">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-[#2D3340] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isRisk ? 'bg-[#F53F3F]' : 'bg-[#00B42A]'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right w-24">
                    <p className={`text-sm font-medium ${diffDays <= 2 ? 'text-[#F53F3F]' : 'text-white'}`}>
                      {diffDays}天后交货
                    </p>
                    <p className="text-[#86909C] text-xs">{order.deliveryDate}</p>
                  </div>
                </div>
              );
            })}
            {urgentOrders.length === 0 && (
              <div className="py-12 text-center text-[#86909C] text-sm">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-[#00B42A]" />
                <p>暂无紧急订单</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#1D2129] rounded-lg border border-[#2D3340]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D3340]">
            <h3 className="font-semibold text-white">待处理异常</h3>
            <Link to="/exceptions" className="text-[#165DFF] text-sm hover:underline flex items-center gap-1">
              全部
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-2 space-y-1">
            {pendingExceptions.map(exception => (
              <div
                key={exception.id}
                className="p-3 hover:bg-[#272E3B]/50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={exception.type} />
                  <span className="text-[#86909C] text-xs">{exception.workOrderNo}</span>
                </div>
                <p className="text-white text-sm line-clamp-2">{exception.description}</p>
                <p className="text-[#86909C] text-xs mt-1">{exception.processName}</p>
              </div>
            ))}
            {pendingExceptions.length === 0 && (
              <div className="py-12 text-center text-[#86909C] text-sm">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-[#00B42A]" />
                <p>暂无待处理异常</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#1D2129] rounded-lg border border-[#2D3340]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D3340]">
          <h3 className="font-semibold text-white">设备状态</h3>
          <Link to="/scheduling" className="text-[#165DFF] text-sm hover:underline flex items-center gap-1">
            查看详情
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="p-4 grid grid-cols-6 gap-3">
          {runningWorkstations.map(ws => (
            <div
              key={ws.id}
              className="bg-[#272E3B] rounded-lg p-3 border border-[#3D4455] hover:border-[#165DFF]/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  ws.status === 'running' ? 'bg-[#00B42A] animate-pulse' :
                  ws.status === 'idle' ? 'bg-[#86909C]' :
                  ws.status === 'maintenance' ? 'bg-[#FF7D00]' : 'bg-[#F53F3F]'
                }`} />
                <span className="text-white text-sm font-medium truncate">{ws.name}</span>
              </div>
              <p className="text-[#86909C] text-xs">{ws.type}</p>
              <p className="text-[#86909C] text-xs mt-1">
                产能: {ws.capacityPerHour}件/时
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
