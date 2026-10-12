import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { RequireAuth } from './context';
import PomodoroView from './views/Pomodoro/PomodoroView';

// 4.7 · Pablo Farid Montoro
import CalendarView from './views/Calendar/CalendarView';
import FriendsView from './views/Friends/FriendsView';
import ProfileView from './views/Profile/ProfileView';

// 4.2 · Zahid Serna — Vistas Auth
import LoginView from './views/Auth/LoginView';
import RegisterView from './views/Auth/RegisterView';
import ForgotPasswordView from './views/Auth/ForgotPasswordView';
import ResetPasswordView from './views/Auth/ResetPasswordView';

// Temporales — se reemplazan por el trabajo del equipo
import PlaceholderView from './views/Placeholder/PlaceholderView';
import DashboardView from './views/Dashboard/DashboardView';

export default function App() {
  return (
    <Routes>
      {/* 4.2 Vistas Auth · Zahid Serna */}
      <Route path="/login" element={<LoginView />} />
      <Route path="/register" element={<RegisterView />} />
      <Route path="/forgot-password" element={<ForgotPasswordView />} />
      <Route path="/reset-password" element={<ResetPasswordView />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        {/* 4.3 Dashboard & Lista Tareas · Moisés Medina */}
        <Route index element={<DashboardView />} />

        {/* 4.6 Módulo Pomodoro Timer · Moisés Medina */}
        <Route path="pomodoro" element={<PomodoroView />} />
        <Route path="calendario" element={<CalendarView />} />
        <Route path="amigos" element={<FriendsView />} />
        <Route path="perfil" element={<ProfileView />} />
        <Route
          path="tareas-pasadas"
          element={<PlaceholderView title="Tareas pasadas" task="Historial de tareas" owner="Moisés Medina (TasksContext)" />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}