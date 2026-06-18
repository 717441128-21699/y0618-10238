import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CalendarClock,
  ScanLine,
  AlertTriangle,
  TrendingUp,
  Package,
  BarChart3,
  Factory,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { path: '/orders', label: '订单管理', icon: FileText },
  { path: '/scheduling', label: '生产排程', icon: CalendarClock },
  { path: '/reporting', label: '生产报工', icon: ScanLine },
  { path: '/exceptions', label: '异常管理', icon: AlertTriangle },
  { path: '/tracking', label: '订单追踪', icon: TrendingUp },
  { path: '/warehouse', label: '成品入库', icon: Package },
  { path: '/analytics', label: '数据看板', icon: BarChart3 },
];

export function Sidebar() {
  return (
    <aside className="w-60 bg-[#1D2129] border-r border-[#2D3340] flex flex-col h-screen fixed left-0 top-0">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-[#2D3340]">
        <div className="w-9 h-9 bg-gradient-to-br from-[#165DFF] to-[#0E42B3] rounded flex items-center justify-center">
          <Factory className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-sm leading-tight">MES系统</h1>
          <p className="text-[#86909C] text-[10px]">生产执行管理</p>
        </div>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-5 py-2.5 mx-2 rounded text-sm transition-all duration-200',
                  isActive
                    ? 'bg-[#165DFF]/15 text-[#165DFF] border-l-2 border-[#165DFF]'
                    : 'text-[#C9CDD4] hover:bg-[#2D3340]/50 hover:text-white'
                )
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#2D3340]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00B42A] to-[#007A29] flex items-center justify-center text-white text-xs font-bold">
            张
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm truncate">张工程师</p>
            <p className="text-[#86909C] text-xs">生产计划员</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
