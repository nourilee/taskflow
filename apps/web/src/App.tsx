import { APP_NAME } from '@taskflow/shared';
import { Link, Navigate, Route, Routes } from 'react-router';
import { Dashboard } from './screens/Dashboard';
import { TaskDetails } from './screens/TaskDetails';
import { TaskForm } from './screens/TaskForm';

export function App() {
  return (
    <>
      <header className="app-header">
        <Link to="/" className="brand" data-testid="app-title">
          {APP_NAME}
        </Link>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks/new" element={<TaskForm />} />
          <Route path="/tasks/:taskId" element={<TaskDetails />} />
          <Route path="/tasks/:taskId/edit" element={<TaskForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
