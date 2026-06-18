import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { Package, Plus, CheckCircle, Truck, Search, Calendar, User, X } from 'lucide-react';

export function WarehousePage() {
  const { workOrders, warehouseEntries, addWarehouseEntry, processTasks, getWorkOrderProgress } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entryData, setEntryData] = useState({
    workOrderId: '',
    quantity: 0,
    operator: '',
    remark: '',
  });

  const completedOrders = workOrders.filter(o => o.status === 'completed');
  const warehousedOrders = workOrders.filter(o => o.status === 'warehoused');

  const filteredEntries = warehouseEntries.filter(e =>
    e.workOrderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.productName.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = workOrders.find(o => o.id === entryData.workOrderId);
    if (!order || !entryData.operator) return;

    addWarehouseEntry({
      workOrderId: entryData.workOrderId,
      workOrderNo: order.orderNo,
      productName: order.productName,
      productModel: order.productModel,
      quantity: entryData.quantity || order.quantity,
      operator: entryData.operator,
      remark: entryData.remark,
    });

    setShowModal(false);
    setEntryData({ workOrderId: '', quantity: 0, operator: '', remark: '' });
  };

  const handleSelectOrder = (orderId: string) => {
    const order = workOrders.find(o => o.id === orderId);
    setEntryData({
      workOrderId: orderId,
      quantity: order?.quantity || 0,
      operator: '',
      remark: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">成品入库</h1>
          <p className="text-[#86909C] text-sm mt-1">成品入库管理与发货安排</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#722ED1] hover:bg-[#531D9E] text-white text-sm rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          入库登记
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-[#FF7D00]" />
            <span className="text-[#FF7D00] text-sm">待入库</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{completedOrders.length}</p>
          <p className="text-[#86909C] text-xs mt-1">生产完成待入库</p>
        </div>
        <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-[#722ED1]" />
            <span className="text-[#722ED1] text-sm">已入库</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{warehousedOrders.length}</p>
          <p className="text-[#86909C] text-xs mt-1">等待发货</p>
        </div>
        <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-5 h-5 text-[#00B42A]" />
            <span className="text-[#00B42A] text-sm">已发货</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {warehouseEntries.filter(e => e.shipped).length}
          </p>
          <p className="text-[#86909C] text-xs mt-1">本月已发货订单</p>
        </div>
        <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-[#165DFF]" />
            <span className="text-[#165DFF] text-sm">库存总数</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {warehouseEntries.reduce((sum, e) => sum + e.quantity, 0)}
          </p>
          <p className="text-[#86909C] text-xs mt-1">当前仓库成品</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#1D2129] rounded-lg border border-[#2D3340]">
          <div className="px-5 py-4 border-b border-[#2D3340]">
            <h3 className="font-semibold text-white">待入库订单</h3>
            <p className="text-[#86909C] text-xs mt-0.5">生产完成，等待入库登记</p>
          </div>
          <div className="p-4 space-y-3">
            {completedOrders.map(order => {
              const tasks = processTasks.filter(t => t.workOrderId === order.id);
              const totalQualified = tasks.reduce((sum, t) => sum + t.qualifiedQty, 0);
              const totalDefect = tasks.reduce((sum, t) => sum + t.defectQty, 0);
              
              return (
                <div
                  key={order.id}
                  className="bg-[#272E3B] rounded-lg p-4 border border-[#3D4455]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-medium font-mono">{order.orderNo}</p>
                      <p className="text-[#86909C] text-xs">{order.productName}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div>
                      <span className="text-[#86909C]">计划</span>
                      <p className="text-white font-mono">{order.quantity}件</p>
                    </div>
                    <div>
                      <span className="text-[#86909C]">合格</span>
                      <p className="text-[#00B42A] font-mono">{totalQualified}件</p>
                    </div>
                    <div>
                      <span className="text-[#86909C]">不良</span>
                      <p className="text-[#F53F3F] font-mono">{totalDefect}件</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleSelectOrder(order.id);
                      setShowModal(true);
                    }}
                    className="w-full py-2 bg-[#722ED1] hover:bg-[#531D9E] text-white text-sm rounded transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Package className="w-4 h-4" />
                    办理入库
                  </button>
                </div>
              );
            })}
            {completedOrders.length === 0 && (
              <div className="py-8 text-center text-[#86909C] text-sm">
                暂无待入库订单
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#1D2129] rounded-lg border border-[#2D3340]">
          <div className="px-5 py-4 border-b border-[#2D3340]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">入库记录</h3>
                <p className="text-[#86909C] text-xs mt-0.5">最近入库明细</p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#86909C] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-40 h-7 bg-[#272E3B] border border-[#3D4455] rounded pl-7 pr-2 text-xs text-white placeholder-[#86909C] focus:outline-none focus:border-[#165DFF]"
                />
              </div>
            </div>
          </div>
          <div className="divide-y divide-[#2D3340]">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="p-4 hover:bg-[#272E3B]/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium font-mono text-sm">{entry.workOrderNo}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        entry.shipped 
                          ? 'bg-[#00B42A]/15 text-[#00B42A]' 
                          : 'bg-[#722ED1]/15 text-[#722ED1]'
                      }`}>
                        {entry.shipped ? '已发货' : '库存中'}
                      </span>
                    </div>
                    <p className="text-[#86909C] text-xs mt-0.5">{entry.productName}</p>
                  </div>
                  <span className="text-white font-mono text-sm">{entry.quantity}件</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#86909C]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(entry.entryTime).toLocaleDateString('zh-CN')}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {entry.operator}
                  </span>
                  {entry.shipped && entry.shippedAt && (
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      {new Date(entry.shippedAt).toLocaleDateString('zh-CN')}发货
                    </span>
                  )}
                </div>
                {entry.remark && (
                  <p className="text-[#86909C] text-xs mt-2">{entry.remark}</p>
                )}
              </div>
            ))}
            {filteredEntries.length === 0 && (
              <div className="py-8 text-center text-[#86909C] text-sm">
                暂无入库记录
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] w-[480px]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D3340]">
              <h3 className="font-semibold text-white">成品入库登记</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#86909C] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-[#C9CDD4] mb-1.5">选择工单 <span className="text-[#F53F3F]">*</span></label>
                <select
                  value={entryData.workOrderId}
                  onChange={(e) => handleSelectOrder(e.target.value)}
                  className="w-full h-10 bg-[#272E3B] border border-[#3D4455] rounded px-3 text-sm text-white focus:outline-none focus:border-[#165DFF]"
                  required
                >
                  <option value="">请选择生产完成的工单</option>
                  {completedOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.orderNo} - {o.productName} ({o.quantity}件)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#C9CDD4] mb-1.5">入库数量 <span className="text-[#F53F3F]">*</span></label>
                <input
                  type="number"
                  value={entryData.quantity}
                  onChange={(e) => setEntryData({ ...entryData, quantity: Number(e.target.value) })}
                  className="w-full h-10 bg-[#272E3B] border border-[#3D4455] rounded px-3 text-sm text-white focus:outline-none focus:border-[#165DFF]"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[#C9CDD4] mb-1.5">经办人 <span className="text-[#F53F3F]">*</span></label>
                <input
                  type="text"
                  value={entryData.operator}
                  onChange={(e) => setEntryData({ ...entryData, operator: e.target.value })}
                  placeholder="请输入经办人姓名"
                  className="w-full h-10 bg-[#272E3B] border border-[#3D4455] rounded px-3 text-sm text-white placeholder-[#86909C] focus:outline-none focus:border-[#165DFF]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[#C9CDD4] mb-1.5">备注</label>
                <textarea
                  value={entryData.remark}
                  onChange={(e) => setEntryData({ ...entryData, remark: e.target.value })}
                  placeholder="质量检验结果、特殊说明等..."
                  rows={3}
                  className="w-full bg-[#272E3B] border border-[#3D4455] rounded px-3 py-2 text-sm text-white placeholder-[#86909C] focus:outline-none focus:border-[#165DFF] resize-none"
                />
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
                  className="px-4 py-2 bg-[#722ED1] hover:bg-[#531D9E] text-white text-sm rounded transition-colors"
                >
                  确认入库
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
