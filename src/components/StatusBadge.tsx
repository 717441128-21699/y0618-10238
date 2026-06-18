import { cn } from '@/lib/utils';

type StatusType = 
  | 'pending' | 'scheduled' | 'producing' | 'completed' | 'warehoused'
  | 'in_progress' 
  | 'running' | 'idle' | 'maintenance' | 'down'
  | 'reported' | 'handling' | 'resolved'
  | 'low' | 'medium' | 'high'
  | 'downtime' | 'quality' | 'material' | 'other';

const statusConfig: Record<StatusType, { label: string; className: string; dotClass: string }> = {
  pending: { label: '待排程', className: 'bg-[#FF7D00]/15 text-[#FF7D00]', dotClass: 'bg-[#FF7D00]' },
  scheduled: { label: '已排程', className: 'bg-[#165DFF]/15 text-[#165DFF]', dotClass: 'bg-[#165DFF]' },
  producing: { label: '生产中', className: 'bg-[#00B42A]/15 text-[#00B42A]', dotClass: 'bg-[#00B42A]' },
  completed: { label: '已完成', className: 'bg-[#00B42A]/15 text-[#00B42A]', dotClass: 'bg-[#00B42A]' },
  warehoused: { label: '已入库', className: 'bg-[#722ED1]/15 text-[#722ED1]', dotClass: 'bg-[#722ED1]' },
  in_progress: { label: '进行中', className: 'bg-[#00B42A]/15 text-[#00B42A]', dotClass: 'bg-[#00B42A]' },
  running: { label: '运行中', className: 'bg-[#00B42A]/15 text-[#00B42A]', dotClass: 'bg-[#00B42A]' },
  idle: { label: '空闲', className: 'bg-[#86909C]/20 text-[#C9CDD4]', dotClass: 'bg-[#86909C]' },
  maintenance: { label: '维保中', className: 'bg-[#FF7D00]/15 text-[#FF7D00]', dotClass: 'bg-[#FF7D00]' },
  down: { label: '故障', className: 'bg-[#F53F3F]/15 text-[#F53F3F]', dotClass: 'bg-[#F53F3F]' },
  reported: { label: '已上报', className: 'bg-[#F53F3F]/15 text-[#F53F3F]', dotClass: 'bg-[#F53F3F]' },
  handling: { label: '处理中', className: 'bg-[#FF7D00]/15 text-[#FF7D00]', dotClass: 'bg-[#FF7D00]' },
  resolved: { label: '已解决', className: 'bg-[#00B42A]/15 text-[#00B42A]', dotClass: 'bg-[#00B42A]' },
  low: { label: '低', className: 'bg-[#86909C]/20 text-[#C9CDD4]', dotClass: 'bg-[#86909C]' },
  medium: { label: '中', className: 'bg-[#FF7D00]/15 text-[#FF7D00]', dotClass: 'bg-[#FF7D00]' },
  high: { label: '高', className: 'bg-[#F53F3F]/15 text-[#F53F3F]', dotClass: 'bg-[#F53F3F]' },
  downtime: { label: '设备停机', className: 'bg-[#F53F3F]/15 text-[#F53F3F]', dotClass: 'bg-[#F53F3F]' },
  quality: { label: '质量问题', className: 'bg-[#FF7D00]/15 text-[#FF7D00]', dotClass: 'bg-[#FF7D00]' },
  material: { label: '物料问题', className: 'bg-[#722ED1]/15 text-[#722ED1]', dotClass: 'bg-[#722ED1]' },
  other: { label: '其他', className: 'bg-[#86909C]/20 text-[#C9CDD4]', dotClass: 'bg-[#86909C]' },
};

interface StatusBadgeProps {
  status: StatusType;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, showDot = true, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-medium',
      size === 'sm' ? 'text-[11px]' : 'text-xs',
      config.className
    )}>
      {showDot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          config.dotClass,
          (status === 'producing' || status === 'running' || status === 'in_progress') && 'animate-pulse'
        )} />
      )}
      {config.label}
    </span>
  );
}

export function getStatusLabel(status: StatusType): string {
  return statusConfig[status]?.label || status;
}
