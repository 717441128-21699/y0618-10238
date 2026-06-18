import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { StatusBadge } from '@/components/StatusBadge';
import { ScanLine, Play, CheckCircle, Clock, User, Package, AlertTriangle, X } from 'lucide-react';

export function ReportingPage() {
  const { processTasks, workstations, startProcessTask, completeProcessTask, addException } = useAppStore();
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [completionData, setCompletionData] = useState({
    actualQty: 0,
    qualifiedQty: 0,
    defectQty: 0,
  });
  const [exceptionData, setExceptionData] = useState({
    type: 'quality' as 'downtime' | 'quality' | 'material' | 'other',
    description: '',
  });
  const [scanInput, setScanInput] = useState('');
  const [operatorName, setOperatorName] = useState('');

  const pendingTasks = processTasks.filter(t => t.status === 'pending');
  const inProgressTasks = processTasks.filter(t => t.status === 'in_progress');
  const completedTasks = processTasks.filter(t => t.status === 'completed').slice(0, 10);

  const handleStartTask = (taskId: string) => {
    if (!operatorName) {
      alert('请先输入操作工姓名');
      return;
    }
    startProcessTask(taskId, operatorName);
  };

  const handleCompleteTask = (taskId: string) => {
    const task = processTasks.find(t => t.id === taskId);
    if (task) {
      setCompletionData({
        actualQty: task.plannedQty,
        qualifiedQty: task.plannedQty,
        defectQty: 0,
      });
      setSelectedTask(taskId);
      setShowCompleteModal(true);
    }
  };

  const submitCompletion = () => {
    if (selectedTask) {
      completeProcessTask(
        selectedTask,
        completionData.actualQty,
        completionData.qualifiedQty,
        completionData.defectQty
      );
      setShowCompleteModal(false);
      setSelectedTask(null);
    }
  };

  const handleReportException = (taskId: string) => {
    setSelectedTask(taskId);
    setShowExceptionModal(true);
  };

  const submitException = () => {
    const task = processTasks.find(t => t.id === selectedTask);
    if (task && exceptionData.description) {
      addException({
        workOrderId: task.workOrderId,
        workOrderNo: task.workOrderNo,
        processName: task.processName,
        type: exceptionData.type,
        description: exceptionData.description,
        handler: '',
      });
      setShowExceptionModal(false);
      setSelectedTask(null);
      setExceptionData({ type: 'quality', description: '' });
    }
  };

  const TaskCard = ({ task, type }: { task: typeof processTasks[0]; type: 'pending' | 'progress' | 'done' }) => (
    <div className={`bg-[#272E3B] rounded-lg border p-4 transition-all ${
      type === 'progress' ? 'border-[#00B42A]/50 shadow-lg shadow-[#00B42A]/10' : 'border-[#3D4455]'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{task.processName}</span>
            <StatusBadge status={task.status} />
          </div>
          <p className="text-[#86909C] text-xs mt-0.5">{task.workOrderNo}</p>
        </div>
        {type === 'progress' && (
          <div className="w-2 h-2 rounded-full bg-[#00B42A] animate-pulse" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div className="flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-[#86909C]" />
          <span className="text-[#86909C]">计划:</span>
          <span className="text-white font-mono">{task.plannedQty}件</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#86909C]" />
          <span className="text-[#86909C]">工位:</span>
          <span className="text-white">{task.workstationName}</span>
        </div>
      </div>

      {type === 'progress' && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#86909C]">已完成</span>
            <span className="text-white font-mono">{task.actualQty}/{task.plannedQty}</span>
          </div>
          <div className="h-2 bg-[#1D2129] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00B42A] to-[#007A29] rounded-full transition-all duration-500"
              style={{ width: `${(task.actualQty / task.plannedQty) * 100}%` }}
            />
          </div>
          {task.operator && (
            <p className="text-[#86909C] text-xs mt-2 flex items-center gap-1">
              <User className="w-3 h-3" />
              操作工: {task.operator}
            </p>
          )}
        </div>
      )}

      {type === 'done' && (
        <div className="flex items-center justify-between text-xs text-[#86909C]">
          <span>合格: {task.qualifiedQty}件</span>
          <span className={task.defectQty > 0 ? 'text-[#F53F3F]' : ''}>
            不良: {task.defectQty}件
          </span>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        {type === 'pending' && (
          <button
            onClick={() => handleStartTask(task.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#165DFF] hover:bg-[#0E42B3] text-white text-sm rounded transition-colors"
          >
            <Play className="w-4 h-4" />
            开始生产
          </button>
        )}
        {type === 'progress' && (
          <>
            <button
              onClick={() => handleCompleteTask(task.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#00B42A] hover:bg-[#007A29] text-white text-sm rounded transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              报工完成
            </button>
            <button
              onClick={() => handleReportException(task.id)}
              className="px-3 py-2 bg-[#F53F3F]/15 hover:bg-[#F53F3F]/25 text-[#F53F3F] text-sm rounded transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">生产报工</h1>
          <p className="text-[#86909C] text-sm mt-1">扫码报工与工序进度管理</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#86909C]" />
            <input
              type="text"
              placeholder="操作工姓名"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              className="w-32 h-9 bg-[#1D2129] border border-[#2D3340] rounded px-3 text-sm text-white placeholder-[#86909C] focus:outline-none focus:border-[#165DFF]"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <ScanLine className="w-5 h-5 text-[#165DFF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="扫描工单二维码或输入工单号..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="w-full h-12 bg-[#272E3B] border-2 border-[#3D4455] rounded-lg pl-12 pr-4 text-white placeholder-[#86909C] focus:outline-none focus:border-[#165DFF] text-lg transition-colors"
            />
          </div>
          <button className="h-12 px-6 bg-[#165DFF] hover:bg-[#0E42B3] text-white rounded-lg transition-colors flex items-center gap-2">
            <ScanLine className="w-5 h-5" />
            扫码查询
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#86909C]" />
            <h3 className="font-semibold text-white">待开工</h3>
            <span className="text-[#86909C] text-sm">({pendingTasks.length})</span>
          </div>
          <div className="space-y-3">
            {pendingTasks.slice(0, 8).map(task => (
              <TaskCard key={task.id} task={task} type="pending" />
            ))}
            {pendingTasks.length === 0 && (
              <div className="py-8 text-center text-[#86909C] text-sm">
                暂无待开工任务
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#00B42A] animate-pulse" />
            <h3 className="font-semibold text-white">生产中</h3>
            <span className="text-[#86909C] text-sm">({inProgressTasks.length})</span>
          </div>
          <div className="space-y-3">
            {inProgressTasks.map(task => (
              <TaskCard key={task.id} task={task} type="progress" />
            ))}
            {inProgressTasks.length === 0 && (
              <div className="py-8 text-center text-[#86909C] text-sm">
                暂无生产中任务
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[#00B42A]" />
            <h3 className="font-semibold text-white">今日完成</h3>
            <span className="text-[#86909C] text-sm">({completedTasks.length})</span>
          </div>
          <div className="space-y-3">
            {completedTasks.map(task => (
              <TaskCard key={task.id} task={task} type="done" />
            ))}
            {completedTasks.length === 0 && (
              <div className="py-8 text-center text-[#86909C] text-sm">
                暂无完成任务
              </div>
            )}
          </div>
        </div>
      </div>

      {showCompleteModal && selectedTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] w-[420px]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D3340]">
              <h3 className="font-semibold text-white">工序报工</h3>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-[#86909C] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#86909C]">工单</span>
                  <p className="text-white font-mono mt-0.5">
                    {processTasks.find(t => t.id === selectedTask)?.workOrderNo}
                  </p>
                </div>
                <div>
                  <span className="text-[#86909C]">工序</span>
                  <p className="text-white mt-0.5">
                    {processTasks.find(t => t.id === selectedTask)?.processName}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#C9CDD4] mb-1.5">实际产量</label>
                <input
                  type="number"
                  value={completionData.actualQty}
                  onChange={(e) => setCompletionData({ ...completionData, actualQty: Number(e.target.value) })}
                  className="w-full h-10 bg-[#272E3B] border border-[#3D4455] rounded px-3 text-sm text-white focus:outline-none focus:border-[#165DFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#C9CDD4] mb-1.5">
                    合格数 <span className="text-[#00B42A]">✓</span>
                  </label>
                  <input
                    type="number"
                    value={completionData.qualifiedQty}
                    onChange={(e) => setCompletionData({ ...completionData, qualifiedQty: Number(e.target.value) })}
                    className="w-full h-10 bg-[#272E3B] border border-[#3D4455] rounded px-3 text-sm text-white focus:outline-none focus:border-[#00B42A]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#C9CDD4] mb-1.5">
                    不良数 <span className="text-[#F53F3F]">!</span>
                  </label>
                  <input
                    type="number"
                    value={completionData.defectQty}
                    onChange={(e) => setCompletionData({ ...completionData, defectQty: Number(e.target.value) })}
                    className="w-full h-10 bg-[#272E3B] border border-[#3D4455] rounded px-3 text-sm text-white focus:outline-none focus:border-[#F53F3F]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#2D3340]">
                <button
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 text-sm text-[#C9CDD4] hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={submitCompletion}
                  className="px-4 py-2 bg-[#00B42A] hover:bg-[#007A29] text-white text-sm rounded transition-colors"
                >
                  确认报工
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExceptionModal && selectedTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1D2129] rounded-lg border border-[#2D3340] w-[420px]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D3340]">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#F53F3F]" />
                异常上报
              </h3>
              <button
                onClick={() => setShowExceptionModal(false)}
                className="text-[#86909C] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-[#C9CDD4] mb-1.5">异常类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'quality', label: '质量问题' },
                    { value: 'downtime', label: '设备停机' },
                    { value: 'material', label: '物料问题' },
                    { value: 'other', label: '其他' },
                  ].map(item => (
                    <button
                      key={item.value}
                      onClick={() => setExceptionData({ ...exceptionData, type: item.value as any })}
                      className={`py-2 px-3 text-sm rounded border transition-colors ${
                        exceptionData.type === item.value
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
                  value={exceptionData.description}
                  onChange={(e) => setExceptionData({ ...exceptionData, description: e.target.value })}
                  placeholder="请详细描述异常情况..."
                  rows={4}
                  className="w-full bg-[#272E3B] border border-[#3D4455] rounded px-3 py-2 text-sm text-white placeholder-[#86909C] focus:outline-none focus:border-[#165DFF] resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#2D3340]">
                <button
                  onClick={() => setShowExceptionModal(false)}
                  className="px-4 py-2 text-sm text-[#C9CDD4] hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={submitException}
                  className="px-4 py-2 bg-[#F53F3F] hover:bg-[#B32929] text-white text-sm rounded transition-colors"
                >
                  提交上报
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
