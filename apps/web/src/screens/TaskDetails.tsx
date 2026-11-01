import { ApiClientError } from '@taskflow/api-client';
import { isOverdue, nextStatuses, type TaskStatus } from '@taskflow/shared';
import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadError, Loading, TaskNotFound } from '../components/states';
import { useServices } from '../lib/app-context';
import {
  errorMessage,
  formatDate,
  isNotFound,
  PRIORITY_LABELS,
  STATUS_ACTIONS,
  STATUS_LABELS,
  statusSlug,
} from '../lib/format';
import { useLoad } from '../lib/use-load';

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
    <article className={`details tone-${statusSlug(task.status)}`}>
      <Link className="back" to="/" data-testid="back-to-dashboard">
        Back to dashboard
      </Link>
      <h1 data-testid="task-title">{task.title}</h1>
      {isOverdue(task, today()) && (
        <p className="overdue" data-testid={`task-overdue-${task.id}`}>
          Overdue
        </p>
      )}

      <dl className="fields">
        <div>
          <dt>Status</dt>
          <dd data-testid="task-status">{STATUS_LABELS[task.status]}</dd>
        </div>
        <div>
          <dt>Priority</dt>
          <dd data-testid="task-priority">{PRIORITY_LABELS[task.priority]}</dd>
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
        {nextStatuses(task.status).map((status) => (
          <button
            key={status}
            type="button"
            className="button"
            disabled={busy}
            onClick={() => void changeStatus(status)}
            data-testid={`status-action-${statusSlug(status)}`}
          >
            {STATUS_ACTIONS[status]}
          </button>
        ))}
        <Link className="button button-quiet" to={`/tasks/${task.id}/edit`} data-testid="edit-task">
          Edit task
        </Link>
        <button
          type="button"
          className="button button-quiet button-danger-text"
          disabled={busy}
          onClick={() => setConfirming(true)}
          data-testid="delete-task"
        >
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
