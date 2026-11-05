import { errorMessage, isNotFound, taskFieldErrors } from '@taskflow/api-client';
import {
  nextStatuses,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  validateTaskForm,
  type Task,
  type TaskField,
  type TaskFieldErrors,
  type TaskPriority,
  type TaskStatus,
} from '@taskflow/shared';
import { CircleAlert } from 'lucide-react';
import { useCallback, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { LoadError, Loading, TaskNotFound } from '../components/states';
import { useServices } from '../lib/app-context';
import { useLoad } from '../lib/use-load';

// The marker is hidden from assistive tech, so each field keeps its plain name.
// The title input already announces itself as required.
function FieldLabel({
  field,
  marker,
  children,
}: {
  field: TaskField;
  marker: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={`field-${field}`}>
      {children}
      <span className="field-marker" aria-hidden>
        {marker}
      </span>
    </label>
  );
}

function Form({ task }: { task?: Task }) {
  const { api, today } = useServices();
  const navigate = useNavigate();
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'MEDIUM');
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'PENDING');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [errors, setErrors] = useState<TaskFieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  const statusOptions = task ? [task.status, ...nextStatuses(task.status)] : TASK_STATUSES;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) {
      return;
    }

    const result = validateTaskForm(
      { title, description, priority, status, dueDate },
      today(),
      task,
    );
    setErrors(result.valid ? {} : result.errors);
    setFormError(undefined);
    if (!result.valid) {
      return;
    }

    submitting.current = true;
    setSaving(true);
    try {
      const saved = task
        ? await api.updateTask(task.id, result.data)
        : await api.createTask(result.data);
      await navigate(`/tasks/${saved.id}`);
    } catch (failure) {
      const fieldErrors = taskFieldErrors(failure);
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) {
        setFormError(errorMessage(failure));
      }
      submitting.current = false;
      setSaving(false);
    }
  }

  const fieldProps = (field: TaskField) => ({
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? `field-${field}-error` : undefined,
    'data-testid': `field-${field}`,
    id: `field-${field}`,
  });
  const fieldError = (field: TaskField) =>
    errors[field] && (
      <span
        className="field-error"
        id={`field-${field}-error`}
        data-testid={`field-${field}-error`}
      >
        <CircleAlert aria-hidden size={16} />
        {errors[field]}
      </span>
    );

  return (
    <form
      className="task-form"
      onSubmit={(event) => void save(event)}
      noValidate
      data-testid="task-form"
    >
      <div>
        <h1>{task ? 'Edit task' : 'Create task'}</h1>
        <p className="screen-description">Only the title is required.</p>
      </div>

      {formError && (
        <p className="form-error" role="alert" data-testid="form-error">
          {formError}
        </p>
      )}

      <div className="field">
        <FieldLabel field="title" marker="Required">
          Title
        </FieldLabel>
        <input
          {...fieldProps('title')}
          placeholder="What needs doing?"
          value={title}
          required
          onChange={(event) => setTitle(event.target.value)}
        />
        {fieldError('title')}
      </div>

      <div className="field">
        <FieldLabel field="description" marker="Optional">
          Description
        </FieldLabel>
        <textarea
          {...fieldProps('description')}
          rows={4}
          placeholder="Add any details that will help later"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        {fieldError('description')}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="field-priority">Priority</label>
          <select
            {...fieldProps('priority')}
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
          >
            {TASK_PRIORITIES.map((option) => (
              <option key={option} value={option}>
                {PRIORITY_LABELS[option]}
              </option>
            ))}
          </select>
          {fieldError('priority')}
        </div>

        <div className="field">
          <label htmlFor="field-status">Status</label>
          <select
            {...fieldProps('status')}
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {STATUS_LABELS[option]}
              </option>
            ))}
          </select>
          {fieldError('status')}
        </div>

        <div className="field">
          <FieldLabel field="dueDate" marker="Optional">
            Due date
          </FieldLabel>
          <input
            {...fieldProps('dueDate')}
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
          {fieldError('dueDate')}
        </div>
      </div>

      <div className="actions">
        <button type="submit" className="button" disabled={saving} data-testid="save-task">
          {saving && <span className="spinner spinner-small" aria-hidden />}
          {saving ? 'Saving' : task ? 'Save changes' : 'Create task'}
        </button>
        <Link
          className="button button-quiet"
          to={task ? `/tasks/${task.id}` : '/'}
          data-testid="cancel-form"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function EditTask({ taskId }: { taskId: string }) {
  const { api } = useServices();
  const load = useCallback(() => api.getTask(taskId), [api, taskId]);
  const { data: task, error, retry } = useLoad(load);

  if (isNotFound(error)) {
    return <TaskNotFound />;
  }
  if (error !== undefined) {
    return <LoadError error={error} onRetry={retry} />;
  }
  if (!task) {
    return <Loading label="Loading task" />;
  }
  return <Form key={task.id} task={task} />;
}

export function TaskForm() {
  const { taskId } = useParams();
  return taskId ? <EditTask taskId={taskId} /> : <Form />;
}
