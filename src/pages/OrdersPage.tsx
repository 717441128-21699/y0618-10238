import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Plus, Search, Filter, MoreVertical, Trash2, Eye, Calendar, CalendarClock } from 'lucide-react';
import type { WorkOrderStatus } from '@/types';

export function OrdersPage() {
  const { workOrders, products, addWorkOrder, deleteWorkOrder, getWorkOrderProgress, scheduleWorkOrder } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'all'>('all');
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 100,
    deliveryDate: '',
    customerName: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  const filteredOrders = workOrders.filter(order => {
    const matchesSearch = order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productName.includes(searchTerm) ||
      order.customerName?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.deliveryDate) return;

    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    addWorkOrder({
      productId: formData.productId,
      productName: product.name,
      productModel: product.model,
      quantity: formData.quantity,
      deliveryDate: formData.deliveryDate,
      customerName: formData.customerName,
      priority: formData.priority,
    });

    setShowModal(false);
    setFormData({
      productId: '',
      quantity: 100,
      deliveryDate: '',
      customerName: '',
      priority: 'medium',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">订单管理</h1>
          <p className="text-[#86909C] text-sm mt-1">创建和管理生产工单</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#165DFF] hover:bg-[#0E42B3] text-white text-sm rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建工单
        </button>
      </div>

      <div className="flex items-center gap-4 bg-[#1D2129] rounded-lg border border-[#2D3340] p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#86909C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索订单号、产品名称、客户..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-[#272E3B] border border-[#3D4455] rounded pl-9 pr-4 text-sm text-white placeholder-[#86909C] focus:outline-none focus:border-[#165DFF] transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#86909C]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as WorkOrderStatus | 'all')}
            className="h-9 bg-[#272E3B] border border-[#3D4455] rounded px-3 text-sm text-white focus:outline-none focus:border-[#165DFF]"
          >
            <option value="all">全部状态</option>
            <option value="pending">待排程</option>
            <option value="scheduled">已排程</option>
            <option value="producing">生产中</option>
            <option value="completed">已完成</option>
            <option value="warehoused">已入库</option>
          </select>
        </div>
      </div>

      <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2D3340]">
              <th className="text-left px-5 py-3 text-[#86909C] text-xs font-medium">订单号</th>
              <th className="text-left px-5 py-3 text-[#86909C] text-xs font-medium">产品信息</th>
              <th className="text-left px-5 py-3 text-[#86909C] text-xs font-medium">数量</th>
              <th className="text-left px-5 py-3 text-[#86909C] text-xs font-medium">客户</th>
              <th className="text-left px-5 py-3 text-[#86909C] text-xs font-medium">交货期</th>
              <th className="text-left px-5 py-3 text-[#86909C] text-xs font-medium">进度</th>
              <th className="text-left px-5 py-3 text-[#86909C] text-xs font-medium">状态</th>
              <th className="text-left px-5 py-3 text-[#86909C] text-xs font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => {
              const progress = getWorkOrderProgress(order.id);
              return (
                <tr key={order.id} className="border-b border-[#2D3340] hover:bg-[#272E3B]/30 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-white text-sm font-medium font-mono">{order.orderNo}</span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-white text-sm">{order.productName}</p>
                    <p className="text-[#86909C] text-xs">{order.productModel}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-white text-sm font-mono">{order.quantity}</span>
                    <span className="text-[#86909C] text-xs ml-1">件</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-white text-sm">{order.customerName || '-'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#86909C]" />
                      <span className="text-white text-sm">{order.deliveryDate}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="w-24">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#86909C]"></span>
                        <span className="text-white font-mono">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-[#2D3340] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#165DFF] rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-[#272E3B] rounded transition-colors">
                        <Eye className="w-4 h-4 text-[#86909C]" />
                      </button>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => scheduleWorkOrder(order.id)}
                          className="p-1.5 hover:bg-[#165DFF]/15 rounded transition-colors"
                          title="安排生产"
                        >
                          <CalendarClock className="w-4 h-4 text-[#165DFF]" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteWorkOrder(order.id)}
                        className="p-1.5 hover:bg-[#F53F3F]/15 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-[#F53F3F]" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[#86909C] text-sm">暂无匹配的订单</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D3340]">
              <h3 className="font-semibold text-white">新建生产工单</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#86909C] hover:text-white transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-[#C9CDD4] mb-1.5">产品型号 <span className="text-[#F53F3F]">*</span></label>
                <select
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full h-10 bg-[#272E3B] border border-[#3D4455] rounded px-3 text-sm text-white focus:outline-none focus:border-[#165DFF]"
                  required
                >
                  <option value="">请选择产品</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.model} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#C9CDD4] mb-1.5">生产数量 <span className="text-[#F53F3F]">*</span></label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full h-10 bg-[#272E3B] border border-[#3D4455] rounded px-3 text-sm text-white focus:outline-none focus:border-[#165DFF]"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[#C9CDD4] mb-1.5">交货日期 <span className="text-[#F53F3F]">*</span></label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  className="w-full h-10 bg-[#272E3B] border border-[#3D4455] rounded px-3 text-sm text-white focus:outline-none focus:border-[#165DFF]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[#C9CDD4] mb-1.5">客户名称</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="请输入客户名称"
                  className="w-full h-10 bg-[#272E3B] border border-[#3D4455] rounded px-3 text-sm text-white placeholder-[#86909C] focus:outline-none focus:border-[#165DFF]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#C9CDD4] mb-1.5">优先级</label>
                <div className="flex gap-3">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={p}
                        checked={formData.priority === p}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                        className="accent-[#165DFF]"
                      />
                      <StatusBadge status={p} />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#2D3340]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-[#C9CDD4] hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#165DFF] hover:bg-[#0E42B3] text-white text-sm rounded transition-colors"
                >
                  创建工单
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
