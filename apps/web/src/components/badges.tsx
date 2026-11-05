import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  statusSlug,
  type TaskPriority,
  type TaskStatus,
} from '@taskflow/shared';
import {
  ChevronDown,
  ChevronsUp,
  Circle,
  CircleCheck,
  CircleDashed,
  Minus,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';

export const STATUS_ICONS: Record<TaskStatus, LucideIcon> = {
  PENDING: Circle,
  IN_PROGRESS: CircleDashed,
  COMPLETED: CircleCheck,
};

const PRIORITY_ICONS: Record<TaskPriority, LucideIcon> = {
  LOW: ChevronDown,
  MEDIUM: Minus,
  HIGH: ChevronsUp,
};

export function StatusBadge({ status, testId }: { status: TaskStatus; testId?: string }) {
  const Icon = STATUS_ICONS[status];
  return (
    <span className={`badge badge-${statusSlug(status)}`} data-testid={testId}>
      <Icon aria-hidden size={14} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityIndicator({
  priority,
  suffix,
  testId,
}: {
  priority: TaskPriority;
  suffix?: string;
  testId?: string;
}) {
  const Icon = PRIORITY_ICONS[priority];
  return (
    <span className={`priority priority-${priority.toLowerCase()}`} data-testid={testId}>
      <Icon aria-hidden size={16} />
      {PRIORITY_LABELS[priority]}
      {suffix}
    </span>
  );
}

export function OverdueBadge({ testId }: { testId: string }) {
  return (
    <span className="badge badge-danger" data-testid={testId}>
      <TriangleAlert aria-hidden size={14} />
      Overdue
    </span>
  );
}
