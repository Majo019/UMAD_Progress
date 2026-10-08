import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { AvatarProvider } from './AvatarContext';
import { CalendarProvider } from './CalendarContext';
import { FriendsProvider } from './FriendsContext';
import { TasksProvider } from './TasksContext';

/**
 * Junta todos los providers en un solo lugar.
 * Si alguien del equipo crea un contexto nuevo (ej. TasksContext de Moisés),
 * se agrega aquí y queda disponible en toda la app.
 */
export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
<AvatarProvider>
  <TasksProvider>
    <CalendarProvider>
      <FriendsProvider>{children}</FriendsProvider>
    </CalendarProvider>
  </TasksProvider>
</AvatarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
