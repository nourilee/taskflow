import {
  formatDate,
  isOverdue,
  LIST_DEFAULT_LIMIT,
  PRIORITY_LABELS,
  STATUS_LABELS,
  statusSlug,
  taskStatusSchema,
  TASK_STATUSES,
  type Task,
  type TaskListResponse,
  type TaskStatus,
} from '@taskflow/shared';
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { LoadError, Loading, Notice } from '../components/states';
import { useServices } from '../lib/app-context';
import { useLoad } from '../lib/use-load';

const SEARCH_DELAY_MS = 300;
const SUMMARY_KEYS = {
  PENDING: 'pending',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
} as const;

function readFilters(params: URLSearchParams) {
  const page = Number(params.get('page'));
  return {
    status: taskStatusSchema.safeParse(params.get('status')).data,
    search: params.get('search') ?? '',
    order: params.get('order') === 'desc' ? ('desc' as const) : ('asc' as const),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

function StatusStrip({
  summary,
  active,
  onSelect,
}: {
  summary: TaskListResponse['summary'];
  active: TaskStatus | undefined;
  onSelect(status: TaskStatus | undefined): void;
}) {
  return (
    <div className="strip" role="group" aria-label="Filter by status">
      <button
        type="button"
        className="strip-all"
        aria-pressed={active === undefined}
        onClick={() => onSelect(undefined)}
        data-testid="status-filter-all"
      >
        <span className="strip-count" data-testid="dashboard-summary-all">
          {summary.all}
        </span>
        All
      </button>
      {TASK_STATUSES.map((status) => {
        const count = summary[SUMMARY_KEYS[status]];
        const slug = statusSlug(status);
        return (
          <button
            key={status}
            type="button"
            className={`strip-segment tone-${slug}`}
            style={{ flexGrow: Math.max(count, 1) }}
            aria-pressed={active === status}
            onClick={() => onSelect(status)}
            data-testid={`status-filter-${slug}`}
          >
            <span className="strip-count" data-testid={`dashboard-summary-${slug}`}>
              {count}
            </span>
            {STATUS_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
}

function TaskRow({ task, today }: { task: Task; today: string }) {
  const overdue = isOverdue(task, today);
  return (
    <li className={`task-row tone-${statusSlug(task.status)}`} data-testid={`task-card-${task.id}`}>
      <Link to={`/tasks/${task.id}`} className="task-link">
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          <span>{STATUS_LABELS[task.status]}</span>
          <span>{PRIORITY_LABELS[task.priority]} priority</span>
          <span>{task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}</span>
        </span>
      </Link>
      {overdue && (
        <span className="overdue" data-testid={`task-overdue-${task.id}`}>
          Overdue
        </span>
      )}
    </li>
  );
}

export function Dashboard() {
  const { api, today } = useServices();
  const [params, setParams] = useSearchParams();
  const { status, search, order, page } = readFilters(params);
  const [input, setInput] = useState(search);
  const [appliedSearch, setAppliedSearch] = useState(search);

  // Keep the box in step when the URL changes, such as with the back button.
  if (search !== appliedSearch) {
    setAppliedSearch(search);
    setInput(search);
  }

  const update = useCallback(
    (changes: Record<string, string | undefined>, options?: { replace: boolean }) => {
      setParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('page');
        for (const [key, value] of Object.entries(changes)) {
          if (value) {
            next.set(key, value);
          } else {
            next.delete(key);
          }
        }
        return next;
      }, options);
    },
    [setParams],
  );

  useEffect(() => {
    if (input === search) {
      return;
    }
    const timer = setTimeout(() => update({ search: input }, { replace: true }), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [input, search, update]);

  const load = useCallback(
    () =>
      api.listTasks({
        status,
        search: search.trim() || undefined,
        sort: 'dueDate',
        order,
        page,
        limit: LIST_DEFAULT_LIMIT,
      }),
    [api, status, search, order, page],
  );
  const { data, error, loading, retry } = useLoad(load);
  const lastPage = data ? Math.max(Math.ceil(data.total / data.limit), 1) : 1;

  return (
    <>
      <div className="screen-header">
        <h1>Tasks</h1>
        <Link className="button" to="/tasks/new" data-testid="create-task">
          Create task
        </Link>
      </div>

      {error !== undefined && <LoadError error={error} onRetry={retry} />}
      {error === undefined && !data && <Loading label="Loading tasks" />}

      {error === undefined && data && (
        <>
          <StatusStrip
            summary={data.summary}
            active={status}
            onSelect={(next) => update({ status: next })}
          />

          <div className="controls">
            <label className="field">
              <span>Search titles</span>
              <input
                type="search"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                data-testid="task-search"
              />
            </label>
            <label className="field">
              <span>Sort by due date</span>
              <select
                value={order}
                onChange={(event) => update({ order: event.target.value })}
                data-testid="task-sort"
              >
                <option value="asc">Soonest first</option>
                <option value="desc">Latest first</option>
              </select>
            </label>
          </div>

          {data.summary.all === 0 && (
            <Notice testId="empty-state">
              <h2>No tasks yet</h2>
              <p>Create your first task to get started.</p>
            </Notice>
          )}

          {data.summary.all > 0 && data.items.length === 0 && (
            <Notice testId="no-results">
              <h2>No matching tasks</h2>
              <p>Change your search or filter to see more tasks.</p>
              <button
                type="button"
                className="button button-quiet"
                onClick={() => setParams({})}
                data-testid="clear-filters"
              >
                Clear filters
              </button>
            </Notice>
          )}

          {data.items.length > 0 && (
            <ul className="task-list" aria-busy={loading} data-testid="task-list">
              {data.items.map((task) => (
                <TaskRow key={task.id} task={task} today={today()} />
              ))}
            </ul>
          )}

          {lastPage > 1 && (
            <nav className="pagination" aria-label="Task pages">
              <button
                type="button"
                className="button button-quiet"
                disabled={page <= 1}
                onClick={() => setParams(withPage(params, page - 1))}
                data-testid="previous-page"
              >
                Previous
              </button>
              <span data-testid="page-indicator">
                Page {page} of {lastPage}
              </span>
              <button
                type="button"
                className="button button-quiet"
                disabled={page >= lastPage}
                onClick={() => setParams(withPage(params, page + 1))}
                data-testid="next-page"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </>
  );
}

function withPage(params: URLSearchParams, page: number): URLSearchParams {
  const next = new URLSearchParams(params);
  next.set('page', String(page));
  return next;
}
