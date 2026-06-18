import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { AlertTriangle, Plus, Filter, Clock, User, MessageSquare, CheckCircle, X } from 'lucide-react';
import type { ExceptionStatus, ExceptionType } from '@/types';

export function ExceptionsPage() {
  const { exceptions, updateException, addException } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<ExceptionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ExceptionType | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedException, setSelectedException] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [newException, setNewException] = useState({
    workOrderNo: '',
    processName: '',
    type: 'quality' as ExceptionType,
    description: '',
    workOrderId: '',
  });

  const filteredExceptions = exceptions.filter(e => {
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchType = typeFilter === 'all' || e.type === typeFilter;
    return matchStatus && matchType;
  });

  const handleAddException = () => {
    if (!newException.description) return;
    addException({
      workOrderId: newException.workOrderId,
      workOrderNo: newException.workOrderNo || 'WO-UNKNOWN',
      processName: newException.processName || '未指定',
      type: newException.type,
      description: newException.description,
    });
    setShowAddModal(false);
    setNewException({
      workOrderNo: '',
      processName: '',
      type: 'quality',
      description: '',
      workOrderId: '',
    });
  };

  const handleResolve = () => {
    if (selectedException && resolveNote) {
      updateException(selectedException, {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        resolveNote,
      });
      setShowDetailModal(false);
      setSelectedException(null);
      setResolveNote('');
    }
  };

  const handleStartHandling = (id: string) => {
    updateException(id, { status: 'handling', handler: '当前处理员' });
  };

  const openDetail = (id: string) => {
    setSelectedException(id);
    setShowDetailModal(true);
  };

  const selectedItem = exceptions.find(e => e.id === selectedException);

  const stats = {
    total: exceptions.length,
    pending: exceptions.filter(e => e.status === 'reported').length,
    handling: exceptions.filter(e => e.status === 'handling').length,
    resolved: exceptions.filter(e => e.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">异常管理</h1>
          <p className="text-[#86909C] text-sm mt-1">设备停机与质量问题追踪</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#F53F3F] hover:bg-[#B32929] text-white text-sm rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          上报异常
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-[#86909C]" />
            <span className="text-[#86909C] text-sm">异常总数</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">{stats.total}</p>
        </div>
        <div className="bg-[#1D2129] rounded-lg border border-[#F53F3F]/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-[#F53F3F]" />
            <span className="text-[#F53F3F] text-sm">待处理</span>
          </div>
          <p className="text-2xl font-bold text-[#F53F3F] font-mono">{stats.pending}</p>
        </div>
        <div className="bg-[#1D2129] rounded-lg border border-[#FF7D00]/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-[#FF7D00]" />
            <span className="text-[#FF7D00] text-sm">处理中</span>
          </div>
          <p className="text-2xl font-bold text-[#FF7D00] font-mono">{stats.handling}</p>
        </div>
        <div className="bg-[#1D2129] rounded-lg border border-[#00B42A]/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-[#00B42A]" />
            <span className="text-[#00B42A] text-sm">已解决</span>
          </div>
          <p className="text-2xl font-bold text-[#00B42A] font-mono">{stats.resolved}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-[#1D2129] rounded-lg border border-[#2D3340] p-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#86909C]" />
          <span className="text-[#86909C] text-sm">状态:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ExceptionStatus | 'all')}
            className="h-8 bg-[#272E3B] border border-[#3D4455] rounded px-3 text-sm text-white focus:outline-none focus:border-[#165DFF]"
          >
            <option value="all">全部</option>
            <option value="reported">已上报</option>
            <option value="handling">处理中</option>
            <option value="resolved">已解决</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#86909C] text-sm">类型:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ExceptionType | 'all')}
            className="h-8 bg-[#272E3B] border border-[#3D4455] rounded px-3 text-sm text-white focus:outline-none focus:border-[#165DFF]"
          >
            <option value="all">全部</option>
            <option value="downtime">设备停机</option>
            <option value="quality">质量问题</option>
            <option value="material">物料问题</option>
            <option value="other">其他</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredExceptions.map(exception => (
          <div
            key={exception.id}
            onClick={() => openDetail(exception.id)}
            className="bg-[#1D2129] rounded-lg border border-[#2D3340] p-4 hover:border-[#3D4455] transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  exception.type === 'downtime' ? 'bg-[#F53F3F]/20' :
                  exception.type === 'quality' ? 'bg-[#FF7D00]/20' :
                  exception.type === 'material' ? 'bg-[#722ED1]/20' :
                  'bg-[#86909C]/20'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${
                    exception.type === 'downtime' ? 'text-[#F53F3F]' :
                    exception.type === 'quality' ? 'text-[#FF7D00]' :
                    exception.type === 'material' ? 'text-[#722ED1]' :
                    'text-[#86909C]'
                  }`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={exception.type} />
                    <StatusBadge status={exception.status} />
                    <span className="text-[#86909C] text-xs">{exception.workOrderNo}</span>
                  </div>
                  <p className="text-white text-sm">{exception.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[#86909C]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(exception.reportedAt).toLocaleString('zh-CN')}
                    </span>
                    <span>工序: {exception.processName}</span>
                    {exception.downtimeMinutes && (
                      <span className="text-[#F53F3F]">停机 {exception.downtimeMinutes} 分钟</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                {exception.handler && (
                  <p className="text-[#C9CDD4] text-xs flex items-center gap-1 justify-end">
                    <User className="w-3 h-3" />
                    {exception.handler}
                  </p>
                )}
                {exception.status === 'reported' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartHandling(exception.id);
                    }}
                    className="mt-2 px-3 py-1 bg-[#FF7D00]/20 hover:bg-[#FF7D00]/30 text-[#FF7D00] text-xs rounded transition-colors"
                  >
                    开始处理
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredExceptions.length === 0 && (
          <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] py-16 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-[#00B42A] mb-3" />
            <p className="text-[#86909C]">暂无异常记录</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] w-[480px]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D3340]">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#F53F3F]" />
                上报异常
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#86909C] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#C9CDD4] mb-1.5">工单号</label>
                  <input
                    type="text"
                    value={newException.workOrderNo}
                    onChange={(e) => setNewException({ ...newException, workOrderNo: e.target.value })}
                    placeholder="如: WO202501001"
                    className="w-full h-10 bg-[#272E3B] border border-[#3D4455] rounded px-3 text-sm text-white placeholder-[#86909C] focus:outline-none focus:border-[#165DFF]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#C9CDD4] mb-1.5">工序</label>
                  <input
                    type="text"
                    value={newException.processName}
                    onChange={(e) => setNewException({ ...newException, processName: e.target.value })}
                    placeholder="如: 精车"
                    className="w-full h-10 bg-[#272E3B] border border-[#3D4455] rounded px-3 text-sm text-white placeholder-[#86909C] focus:outline-none focus:border-[#165DFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#C9CDD4] mb-1.5">异常类型</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'quality', label: '质量问题' },
                    { value: 'downtime', label: '设备停机' },
                    { value: 'material', label: '物料问题' },
                    { value: 'other', label: '其他' },
                  ].map(item => (
                    <button
                      key={item.value}
                      onClick={() => setNewException({ ...newException, type: item.value as ExceptionType })}
                      className={`py-2 px-2 text-xs rounded border transition-colors ${
                        newException.type === item.value
                          ? 'bg-[#F53F3F]/15 border-[#F53F3F] text-[#F53F3F]'
                          : 'bg-[#272E3B] border-[#3D4455] text-[#C9CDD4] hover:border-[#86909C]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#C9CDD4] mb-1.5">问题描述</label>
                <textarea
                  value={newException.description}
                  onChange={(e) => setNewException({ ...newException, description: e.target.value })}
                  placeholder="请详细描述异常情况..."
                  rows={4}
                  className="w-full bg-[#272E3B] border border-[#3D4455] rounded px-3 py-2 text-sm text-white placeholder-[#86909C] focus:outline-none focus:border-[#165DFF] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#2D3340]">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-[#C9CDD4] hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddException}
                  className="px-4 py-2 bg-[#F53F3F] hover:bg-[#B32929] text-white text-sm rounded transition-colors"
                >
                  提交上报
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] w-[520px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D3340]">
              <h3 className="font-semibold text-white">异常详情</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-[#86909C] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedItem.type} />
                <StatusBadge status={selectedItem.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#86909C]">工单</span>
                  <p className="text-white mt-0.5 font-mono">{selectedItem.workOrderNo}</p>
                </div>
                <div>
                  <span className="text-[#86909C]">工序</span>
                  <p className="text-white mt-0.5">{selectedItem.processName}</p>
                </div>
                <div>
                  <span className="text-[#86909C]">上报时间</span>
                  <p className="text-white mt-0.5">{new Date(selectedItem.reportedAt).toLocaleString('zh-CN')}</p>
                </div>
                <div>
                  <span className="text-[#86909C]">处理人</span>
                  <p className="text-white mt-0.5">{selectedItem.handler || '未分配'}</p>
                </div>
              </div>

              <div>
                <span className="text-[#86909C] text-sm">问题描述</span>
                <div className="mt-1 p-3 bg-[#272E3B] rounded text-white text-sm">
                  {selectedItem.description}
                </div>
              </div>

              {selectedItem.resolveNote && (
                <div>
                  <span className="text-[#86909C] text-sm flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    处理记录
                  </span>
                  <div className="mt-1 p-3 bg-[#00B42A]/10 border border-[#00B42A]/30 rounded text-white text-sm">
                    {selectedItem.resolveNote}
                  </div>
                </div>
              )}

              {selectedItem.status === 'handling' && (
                <div>
                  <label className="block text-sm text-[#C9CDD4] mb-1.5">处理结果</label>
                  <textarea
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    placeholder="请输入处理结果和说明..."
                    rows={3}
                    className="w-full bg-[#272E3B] border border-[#3D4455] rounded px-3 py-2 text-sm text-white placeholder-[#86909C] focus:outline-none focus:border-[#00B42A] resize-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-[#2D3340]">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-sm text-[#C9CDD4] hover:text-white transition-colors"
                >
                  关闭
                </button>
                {selectedItem.status === 'handling' && (
                  <button
                    onClick={handleResolve}
                    className="px-4 py-2 bg-[#00B42A] hover:bg-[#007A29] text-white text-sm rounded transition-colors"
                  >
                    标记已解决
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
