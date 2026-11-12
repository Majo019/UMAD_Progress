import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { RequireAdmin, RequireAuth, RequireUser } from './context';
import PomodoroView from './views/Pomodoro/PomodoroView';

// 4.7 · Pablo Farid Montoro
import TasksView from './views/Tasks/TasksView';
import FriendsView from './views/Friends/FriendsView';
import ProfileView from './views/Profile/ProfileView';

// 4.2 · Zahid Serna — Vistas Auth
import LoginView from './views/Auth/LoginView';
import RegisterView from './views/Auth/RegisterView';
import ForgotPasswordView from './views/Auth/ForgotPasswordView';
import ResetPasswordView from './views/Auth/ResetPasswordView';

// Temporales — se reemplazan por el trabajo del equipo
import DashboardView from './views/Dashboard/DashboardView';

import TasksHistoryView from './views/TasksHistory/TasksHistoryView';

// Panel de administración (rol admin)
import AdminLayout from './views/Admin/AdminLayout';
import AdminDashboardView from './views/Admin/AdminDashboardView';
import AdminUsersView from './views/Admin/AdminUsersView';
import AdminUserDetailView from './views/Admin/AdminUserDetailView';
import AdminTasksView from './views/Admin/AdminTasksView';
import AdminProfileView from './views/Admin/AdminProfileView';

export default function App() {
  return (
    <Routes>
      {/* 4.2 Vistas Auth · Zahid Serna */}
      <Route path="/login" element={<LoginView />} />
      <Route path="/register" element={<RegisterView />} />
      <Route path="/forgot-password" element={<ForgotPasswordView />} />
      <Route path="/reset-password" element={<ResetPasswordView />} />

      {/* Panel de administración · solo rol admin */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboardView />} />
        <Route path="usuarios" element={<AdminUsersView />} />
        <Route path="usuarios/:id" element={<AdminUserDetailView />} />
        <Route path="tareas" element={<AdminTasksView />} />
        <Route path="perfil" element={<AdminProfileView />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      {/* App del alumno · solo rol user (los admin se redirigen a /admin) */}
      <Route
        element={
          <RequireAuth>
            <RequireUser>
              <AppLayout />
            </RequireUser>
          </RequireAuth>
        }
      >
        {/* 4.3 Dashboard & Lista Tareas · Moisés Medina */}
        <Route index element={<DashboardView />} />

        {/* 4.6 Módulo Pomodoro Timer · Moisés Medina */}
        <Route path="pomodoro" element={<PomodoroView />} />
        <Route path="tareas" element={<TasksView />} />
        <Route path="amigos" element={<FriendsView />} />
        <Route path="perfil" element={<ProfileView />} />
        <Route
          path="tareas-pasadas"
          element={<TasksHistoryView />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}