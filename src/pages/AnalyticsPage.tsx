import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Target,
  Activity,
  Clock,
  BarChart3,
  Package,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export function AnalyticsPage() {
  const {
    getDashboardMetrics,
    workOrders,
    processTasks,
    workstations,
    exceptions,
    getWorkOrderProgress,
  } = useAppStore();

  const metrics = getDashboardMetrics();

  const dailyOutputData = useMemo(() => {
    const days = 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
      const baseOutput = 200 + Math.floor(Math.random() * 150);
      data.push({
        date: dateStr,
        计划产量: 300,
        实际产量: baseOutput,
        合格数: Math.floor(baseOutput * 0.97),
      });
    }
    return data;
  }, []);

  const passRateData = useMemo(() => {
    const processes = ['下料', '粗车', '精车', '磨削', '检测', '包装'];
    return processes.map(p => {
      const tasks = processTasks.filter(t => t.processName === p && t.status === 'completed');
      const totalQty = tasks.reduce((sum, t) => sum + t.actualQty, 0);
      const qualifiedQty = tasks.reduce((sum, t) => sum + t.qualifiedQty, 0);
      const rate = totalQty > 0 ? Math.round((qualifiedQty / totalQty) * 1000) / 10 : 96 + Math.random() * 3;
      return {
        name: p,
        合格率: Math.round(rate * 10) / 10,
      };
    });
  }, [processTasks]);

  const workstationUtilData = useMemo(() => {
    const runningWs = workstations.filter(w => w.status !== 'down');
    return runningWs.map(ws => {
      const utilization = ws.status === 'running' 
        ? 60 + Math.floor(Math.random() * 35) 
        : ws.status === 'maintenance' 
        ? 0 
        : 10 + Math.floor(Math.random() * 30);
      return {
        name: ws.name,
        利用率: utilization,
      };
    }).sort((a, b) => b.利用率 - a.利用率);
  }, [workstations]);

  const orderStatusData = useMemo(() => {
    const statuses = [
      { name: '待排程', value: workOrders.filter(o => o.status === 'pending').length, color: '#FF7D00' },
      { name: '已排程', value: workOrders.filter(o => o.status === 'scheduled').length, color: '#165DFF' },
      { name: '生产中', value: workOrders.filter(o => o.status === 'producing').length, color: '#00B42A' },
      { name: '已完成', value: workOrders.filter(o => o.status === 'completed').length, color: '#722ED1' },
      { name: '已入库', value: workOrders.filter(o => o.status === 'warehoused').length, color: '#0FC6C2' },
    ];
    return statuses.filter(s => s.value > 0);
  }, [workOrders]);

  const onTimeDeliveryData = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
    return months.map(m => ({
      month: m,
      准时交货率: 90 + Math.floor(Math.random() * 9),
      订单数: 15 + Math.floor(Math.random() * 20),
    }));
  }, []);

  const exceptionTypeData = useMemo(() => {
    const types = [
      { name: '质量问题', value: exceptions.filter(e => e.type === 'quality').length, color: '#FF7D00' },
      { name: '设备停机', value: exceptions.filter(e => e.type === 'downtime').length, color: '#F53F3F' },
      { name: '物料问题', value: exceptions.filter(e => e.type === 'material').length, color: '#722ED1' },
      { name: '其他', value: exceptions.filter(e => e.type === 'other').length, color: '#86909C' },
    ];
    return types.filter(t => t.value > 0);
  }, [exceptions]);

  const metricCards = [
    { label: '设备利用率', value: `${metrics.equipmentUtilization}%`, icon: Activity, color: '#165DFF', trend: '+2.3%', trendUp: true },
    { label: '工序合格率', value: `${metrics.overallPassRate}%`, icon: Target, color: '#00B42A', trend: '+0.8%', trendUp: true },
    { label: '准时交货率', value: `${metrics.onTimeDeliveryRate}%`, icon: Clock, color: '#722ED1', trend: '+1.5%', trendUp: true },
    { label: '异常次数', value: exceptions.length, icon: AlertTriangle, color: '#F53F3F', trend: '本月', trendUp: false },
  ];

  const customTooltipStyle = {
    backgroundColor: '#1D2129',
    border: '1px solid #2D3340',
    borderRadius: '8px',
    color: '#fff',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">数据看板</h1>
          <p className="text-[#86909C] text-sm mt-1">核心生产指标与数据分析</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-9 bg-[#1D2129] border border-[#2D3340] rounded px-3 text-sm text-white focus:outline-none">
            <option>本月</option>
            <option>上月</option>
            <option>本季度</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-[#1D2129] rounded-lg border border-[#2D3340] p-5 hover:border-[#3D4455] transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
                  <Icon className="w-6 h-6" style={{ color: card.color }} />
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  card.trendUp ? 'bg-[#00B42A]/15 text-[#00B42A]' : 'bg-[#86909C]/15 text-[#86909C]'
                }`}>
                  {card.trend}
                </span>
              </div>
              <p className="text-[#86909C] text-sm">{card.label}</p>
              <p className="text-3xl font-bold text-white font-mono mt-1">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-[#1D2129] rounded-lg border border-[#2D3340] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#165DFF]" />
              周产量趋势
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyOutputData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3340" />
                <XAxis dataKey="date" stroke="#86909C" fontSize={12} />
                <YAxis stroke="#86909C" fontSize={12} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="计划产量" fill="#2D3340" radius={[4, 4, 0, 0]} />
                <Bar dataKey="实际产量" fill="#165DFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#722ED1]" />
            订单状态分布
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {orderStatusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[#C9CDD4] text-xs">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#00B42A]" />
            各工序合格率
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={passRateData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3340" />
                <XAxis type="number" domain={[80, 100]} stroke="#86909C" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#86909C" fontSize={12} width={50} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="合格率" fill="#00B42A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#FF7D00]" />
            设备利用率排行
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workstationUtilData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3340" />
                <XAxis type="number" domain={[0, 100]} stroke="#86909C" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#86909C" fontSize={11} width={70} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="利用率" fill="#FF7D00" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-[#1D2129] rounded-lg border border-[#2D3340] p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#0FC6C2]" />
            准时交货率趋势
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={onTimeDeliveryData}>
                <defs>
                  <linearGradient id="colorOnTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0FC6C2" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0FC6C2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3340" />
                <XAxis dataKey="month" stroke="#86909C" fontSize={12} />
                <YAxis stroke="#86909C" fontSize={12} domain={[80, 100]} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="准时交货率"
                  stroke="#0FC6C2"
                  strokeWidth={2}
                  fill="url(#colorOnTime)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#F53F3F]" />
            异常类型分布
          </h3>
          <div className="h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={exceptionTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {exceptionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {exceptionTypeData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#C9CDD4]">{item.name}</span>
                </div>
                <span className="text-white font-mono">{item.value} 次</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
