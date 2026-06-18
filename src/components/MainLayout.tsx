import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Bell, Search, Settings } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function MainLayout() {
  const { exceptions } = useAppStore();
  const pendingCount = exceptions.filter(e => e.status === 'reported' || e.status === 'handling').length;

  return (
    <div className="min-h-screen bg-[#0F1115] text-white">
      <Sidebar />
      
      <div className="ml-60">
        <header className="h-16 bg-[#1D2129] border-b border-[#2D3340] flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-[#86909C] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索订单、产品、设备..."
                className="w-80 h-9 bg-[#272E3B] border border-[#3D4455] rounded pl-9 pr-4 text-sm text-white placeholder-[#86909C] focus:outline-none focus:border-[#165DFF] transition-colors"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative w-9 h-9 rounded hover:bg-[#272E3B] flex items-center justify-center transition-colors">
              <Bell className="w-5 h-5 text-[#C9CDD4]" />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F53F3F] rounded-full text-[10px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <button className="w-9 h-9 rounded hover:bg-[#272E3B] flex items-center justify-center transition-colors">
              <Settings className="w-5 h-5 text-[#C9CDD4]" />
            </button>
          </div>
        </header>
        
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
