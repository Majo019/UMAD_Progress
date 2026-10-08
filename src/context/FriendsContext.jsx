import { createContext, useCallback, useContext, useMemo } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { useAuth } from './AuthContext';

/**
 * FriendsContext
 * Directorio de estudiantes recomendados y lista de amigos.
 * "Gustos en común" se calcula cruzando intereses con los del usuario actual.
 */

const PEOPLE = [
  { id: 'p1', name: 'Sofía C.', career: 'Diseño Gráfico', interests: ['Diseño', 'Lectura', 'Ilustración'] },
  { id: 'p2', name: 'Mateo R.', career: 'Ing. Software', interests: ['Videojuegos', 'Programación', 'Anime'] },
  { id: 'p3', name: 'Alex V.', career: 'Comunicación', interests: ['Fotografía', 'Cine', 'Música'] },
  { id: 'p4', name: 'Valeria M.', career: 'Psicología', interests: ['Lectura', 'Yoga', 'Cine'] },
  { id: 'p5', name: 'Diego L.', career: 'Arquitectura', interests: ['Diseño', 'Fotografía', 'Ciclismo'] },
  { id: 'p6', name: 'Renata G.', career: 'Administración', interests: ['Finanzas', 'Running', 'Lectura'] },
  { id: 'p7', name: 'Iván P.', career: 'Ing. Mecatrónica', interests: ['Programación', 'Robótica', 'Videojuegos'] },
];

const FriendsContext = createContext(null);

export function FriendsProvider({ children }) {
  const { user } = useAuth();
  const [friendIds, setFriendIds] = usePersistentState('up:friends', []);

  const addFriend = useCallback(
    (id) => setFriendIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
    [setFriendIds],
  );
  const removeFriend = useCallback(
    (id) => setFriendIds((prev) => prev.filter((x) => x !== id)),
    [setFriendIds],
  );

  const value = useMemo(() => {
    const myInterests = new Set(user?.interests ?? []);
    const enriched = PEOPLE.map((p) => {
      const common = p.interests.filter((i) => myInterests.has(i));
      return { ...p, common: common.length ? common : p.interests.slice(0, 2), commonCount: common.length };
    });
    return {
      people: enriched,
      friends: enriched.filter((p) => friendIds.includes(p.id)),
      recommendations: enriched
        .filter((p) => !friendIds.includes(p.id))
        .sort((a, b) => b.commonCount - a.commonCount),
      isFriend: (id) => friendIds.includes(id),
      addFriend,
      removeFriend,
    };
  }, [user, friendIds, addFriend, removeFriend]);

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends debe usarse dentro de <FriendsProvider>');
  return ctx;
}
