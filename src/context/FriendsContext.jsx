import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { api, getAuthToken } from '../utils/api';

/**
 * FriendsContext
 * Conectado a la API de amigos del backend (/api/friends/...):
 * - amigos, recomendaciones, solicitudes recibidas y enviadas.
 * - "Gustos en común" se calcula cruzando intereses con los del usuario actual.
 */

const FriendsContext = createContext(null);

const normalize = (value) => String(value).trim().toLowerCase();

/** Agrega `common` y `commonCount` a una persona según los intereses del usuario actual. */
function withCommon(person, myInterests) {
  const interests = Array.isArray(person?.interests) ? person.interests : [];
  const common = interests.filter((i) => myInterests.has(normalize(i)));
  return {
    ...person,
    interests,
    common: common.length ? common : interests.slice(0, 2),
    commonCount: common.length,
  };
}

const asList = (data) => (Array.isArray(data) ? data : []);

export function FriendsProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [friends, setFriends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Los administradores no usan la sección de amigos
  const enabled = Boolean(isAuthenticated && user && user.role !== 'admin');

  const refresh = useCallback(async () => {
    if (!getAuthToken()) return;
    setLoading(true);
    setError(null);
    try {
      const [f, rec, req, sent] = await Promise.all([
        api.get('/api/friends/'),
        api.get('/api/friends/recommendations/'),
        api.get('/api/friends/requests/'),
        api.get('/api/friends/requests/sent/'),
      ]);
      setFriends(asList(f));
      setRecommendations(asList(rec));
      setRequests(asList(req));
      setSentRequests(asList(sent));
    } catch (err) {
      setError(err.message || 'No se pudo cargar la información de amigos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      refresh();
    } else {
      setFriends([]);
      setRecommendations([]);
      setRequests([]);
      setSentRequests([]);
      setError(null);
    }
  }, [enabled, user?.id, refresh]);

  /** Busca alumnos en el servidor. Devuelve [] si la consulta es muy corta. */
  const search = useCallback(async (query) => {
    const q = String(query ?? '').trim();
    if (q.length < 2) return [];
    const data = await api.get(`/api/friends/search/?q=${encodeURIComponent(q)}`);
    return asList(data);
  }, []);

  /** Envía una solicitud de amistad. Acepta un objeto persona o un id. */
  const sendRequest = useCallback(
    async (person) => {
      const userId = typeof person === 'object' ? person?.id : person;
      const res = await api.post('/api/friends/request/', { user_id: userId });
      await refresh();
      return res;
    },
    [refresh],
  );

  const acceptRequest = useCallback(
    async (requestId) => {
      const res = await api.post(`/api/friends/requests/${requestId}/accept/`, {});
      await refresh();
      return res;
    },
    [refresh],
  );

  const rejectRequest = useCallback(
    async (requestId) => {
      const res = await api.post(`/api/friends/requests/${requestId}/reject/`, {});
      await refresh();
      return res;
    },
    [refresh],
  );

  const cancelRequest = useCallback(
    async (requestId) => {
      await api.delete(`/api/friends/requests/${requestId}/cancel/`);
      await refresh();
    },
    [refresh],
  );

  const removeFriend = useCallback(
    async (userId) => {
      await api.delete(`/api/friends/${userId}/`);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(() => {
    const myInterests = new Set((user?.interests ?? []).map(normalize));
    const enrich = (p) => withCommon(p, myInterests);
    const friendIds = new Set(friends.map((p) => p.id));
    const sentIds = new Set(sentRequests.map((r) => r.to_user?.id));

    return {
      friends: friends.map(enrich),
      recommendations: recommendations.map(enrich),
      requests: requests.map((r) => ({ ...r, from_user: enrich(r.from_user) })),
      sentRequests: sentRequests.map((r) => ({ ...r, to_user: enrich(r.to_user) })),
      loading,
      error,
      enrich,
      isFriend: (id) => friendIds.has(id),
      hasSentRequest: (id) => sentIds.has(id),
      search,
      sendRequest,
      acceptRequest,
      rejectRequest,
      cancelRequest,
      removeFriend,
      refresh,
    };
  }, [
    user,
    friends,
    recommendations,
    requests,
    sentRequests,
    loading,
    error,
    search,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriend,
    refresh,
  ]);

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends debe usarse dentro de <FriendsProvider>');
  return ctx;
}
