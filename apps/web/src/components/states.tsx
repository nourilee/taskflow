import { errorMessage } from '@taskflow/api-client';
import { CircleAlert, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

export function Loading({ label }: { label: string }) {
  return (
    <p role="status" className="notice notice-loading" data-testid="loading">
      <span className="spinner" aria-hidden />
      {label}
    </p>
  );
}

export function LoadError({ error, onRetry }: { error: unknown; onRetry(): void }) {
  return (
    <div className="notice" role="alert" data-testid="load-error">
      <CircleAlert aria-hidden className="notice-icon notice-icon-danger" size={28} />
      <p>{errorMessage(error)}</p>
      <button type="button" className="button" onClick={onRetry} data-testid="retry">
        Try again
      </button>
    </div>
  );
}

export function TaskNotFound() {
  return (
    <div className="notice" data-testid="task-not-found">
      <SearchX aria-hidden className="notice-icon" size={28} />
      <h1>Task not found</h1>
      <p>This task does not exist or was deleted.</p>
      <Link className="button" to="/" data-testid="back-to-dashboard">
        Back to dashboard
      </Link>
    </div>
  );
}

export function Notice({ testId, children }: { testId: string; children: ReactNode }) {
  return (
    <div className="notice" data-testid={testId}>
      {children}
    </div>
  );
}
