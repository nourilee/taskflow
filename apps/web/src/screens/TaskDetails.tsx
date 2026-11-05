import { ApiClientError, errorMessage, isNotFound } from '@taskflow/api-client';
import {
  formatDate,
  isOverdue,
  nextStatuses,
  STATUS_ACTIONS,
  statusSlug,
  type TaskStatus,
} from '@taskflow/shared';
import {
  ArrowLeft,
  CircleCheck,
  Pencil,
  Play,
  RotateCcw,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { OverdueBadge, PriorityIndicator, StatusBadge } from '../components/badges';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadError, Loading, TaskNotFound } from '../components/states';
import { useServices } from '../lib/app-context';
import { useLoad } from '../lib/use-load';

const ACTION_ICONS: Record<TaskStatus, LucideIcon> = {
  PENDING: RotateCcw,
  IN_PROGRESS: Play,
  COMPLETED: CircleCheck,
};

export function TaskDetails() {
  const { taskId = '' } = useParams();
  const { api, today } = useServices();
  const navigate = useNavigate();
  const load = useCallback(() => api.getTask(taskId), [api, taskId]);
  const { data: task, error, retry, setData } = useLoad(load);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<unknown>();
  const [confirming, setConfirming] = useState(false);

  if (isNotFound(error)) {
    return <TaskNotFound />;
  }
  if (error !== undefined) {
    return <LoadError error={error} onRetry={retry} />;
  }
  if (!task || task.id !== taskId) {
    return <Loading label="Loading task" />;
  }

  async function changeStatus(status: TaskStatus) {
    setBusy(true);
    setActionError(undefined);
    try {
      setData(await api.changeTaskStatus(taskId, status));
    } catch (failure) {
      setActionError(failure);
      if (failure instanceof ApiClientError && failure.code === 'INVALID_STATUS_TRANSITION') {
        retry();
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteTask() {
    setBusy(true);
    setActionError(undefined);
    try {
      await api.deleteTask(taskId);
      await navigate('/');
    } catch (failure) {
      setActionError(failure);
      setConfirming(false);
      setBusy(false);
    }
  }

  return (
    <article className="details">
      <Link className="back" to="/" data-testid="back-to-dashboard">
        <ArrowLeft aria-hidden size={16} />
        Back to dashboard
      </Link>
      <div className="details-head">
        <h1 data-testid="task-title">{task.title}</h1>
        {isOverdue(task, today()) && <OverdueBadge testId={`task-overdue-${task.id}`} />}
      </div>

      <dl className="fields">
        <div>
          <dt>Status</dt>
          <dd>
            <StatusBadge status={task.status} testId="task-status" />
          </dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd>
            <PriorityIndicator priority={task.priority} testId="task-priority" />
          </dd>
        </div>
        <div>
          <dt>Due date</dt>
          <dd data-testid="task-due-date">
            {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
          </dd>
        </div>
        <div className="fields-wide">
          <dt>Description</dt>
          <dd data-testid="task-description">{task.description || 'No description'}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd data-testid="task-created-at">{new Date(task.createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd data-testid="task-updated-at">{new Date(task.updatedAt).toLocaleString()}</dd>
        </div>
      </dl>

      {actionError !== undefined && (
        <p className="form-error" role="alert" data-testid="action-error">
          {errorMessage(actionError)}
        </p>
      )}

      <div className="actions">
        {nextStatuses(task.status).map((status) => {
          const Icon = ACTION_ICONS[status];
          return (
            <button
              key={status}
              type="button"
              className="button"
              disabled={busy}
              onClick={() => void changeStatus(status)}
              data-testid={`status-action-${statusSlug(status)}`}
            >
              <Icon aria-hidden size={18} />
              {STATUS_ACTIONS[status]}
            </button>
          );
        })}
        <Link className="button button-quiet" to={`/tasks/${task.id}/edit`} data-testid="edit-task">
          <Pencil aria-hidden size={18} />
          Edit task
        </Link>
        <button
          type="button"
          className="button button-quiet button-danger-text"
          disabled={busy}
          onClick={() => setConfirming(true)}
          data-testid="delete-task"
        >
          <Trash2 aria-hidden size={18} />
          Delete task
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Delete this task?"
        confirmLabel="Delete task"
        busy={busy}
        onConfirm={() => void deleteTask()}
        onCancel={() => setConfirming(false)}
      >
        <p>This permanently deletes “{task.title}”.</p>
      </ConfirmDialog>
    </article>
  );
}
