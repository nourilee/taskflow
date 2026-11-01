import { APP_NAME } from '@taskflow/shared';
import { LayoutDashboard } from 'lucide-react';
import { Link, Navigate, NavLink, Route, Routes } from 'react-router';
import { Logo } from './components/Logo';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { Dashboard } from './screens/Dashboard';
import { TaskDetails } from './screens/TaskDetails';
import { TaskForm } from './screens/TaskForm';

export function App() {
  return (
    <div className="app-shell">
      <header className="sidebar">
        <Link to="/" className="brand" data-testid="app-title">
          <Logo />
          {APP_NAME}
        </Link>
        <nav className="sidebar-nav" aria-label="Main">
          <NavLink to="/" end className="nav-link" data-testid="nav-dashboard">
            <LayoutDashboard aria-hidden size={18} />
            <span className="nav-label">Dashboard</span>
          </NavLink>
        </nav>
        <ThemeSwitcher />
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
    </div>
  );
}
