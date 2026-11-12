import { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  Inbox,
  Loader2,
  Search,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  WifiOff,
  X,
} from 'lucide-react';
import { Button, Card, Chip, EmptyState, SegmentedControl, UserAvatar } from '../../components/ui';
import { useFriends } from '../../context';
import './friends.css';

const CHIP_COLORS = ['blue', 'coral', 'neutral'];
const SEARCH_DELAY_MS = 300;

function personSubtitle(person) {
  const parts = [];
  if (person.career) parts.push(person.career);
  if (person.semester) parts.push(`${person.semester}.º semestre`);
  return parts.join(' · ') || person.username;
}

function PersonCard({ person, children }) {
  return (
    <Card as="li" className="person">
      <div className="person__top">
        <UserAvatar name={person.name || person.username} size={52} />
        <div className="person__info">
          <p className="person__name">{person.name || person.username}</p>
          <p className="person__career">{personSubtitle(person)}</p>
        </div>
        <span className="person__level" title="Nivel del avatar">
          Nv. {person.level ?? 1}
        </span>
      </div>

      {person.common?.length > 0 && (
        <div className="person__common">
          <span className="label-mono">{person.commonCount ? 'Gustos en común' : 'Le gusta'}</span>
          <div className="person__chips">
            {person.common.map((tag, i) => (
              <Chip key={tag} color={CHIP_COLORS[i % CHIP_COLORS.length]}>
                {tag}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {children && <div className="person__actions">{children}</div>}
    </Card>
  );
}

/** Ejecuta una acción async marcando a la persona como "ocupada" y mostrando errores. */
function useBusyAction() {
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const run = async (id, fn) => {
    setBusyId(id);
    setActionError(null);
    try {
      return await fn();
    } catch (err) {
      setActionError(err.message || 'No se pudo completar la acción.');
      return null;
    } finally {
      setBusyId(null);
    }
  };

  return { busyId, actionError, setActionError, run };
}

export default function FriendsView() {
  const {
    friends,
    recommendations,
    requests,
    loading,
    error,
    enrich,
    search,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    refresh,
  } = useFriends();

  const [tab, setTab] = useState('recomendaciones');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchVersion, setSearchVersion] = useState(0);
  const { busyId, actionError, setActionError, run } = useBusyAction();

  const trimmed = query.trim();
  const isSearching = trimmed.length >= 2;

  // Búsqueda en el servidor con debounce
  useEffect(() => {
    if (!isSearching) {
      setResults([]);
      setSearchError(null);
      setSearching(false);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const data = await search(trimmed);
        if (!cancelled) {
          setResults(data);
          setSearchError(null);
        }
      } catch (err) {
        if (!cancelled) setSearchError(err.message || 'No se pudo buscar.');
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trimmed, isSearching, search, searchVersion]);

  const afterSearchAction = () => setSearchVersion((v) => v + 1);

  const handleAdd = (person) =>
    run(person.id, async () => {
      await sendRequest(person);
      afterSearchAction();
    });

  const handleAccept = (requestId, personId) =>
    run(personId, async () => {
      await acceptRequest(requestId);
      afterSearchAction();
    });

  const handleReject = (requestId, personId) => run(personId, () => rejectRequest(requestId));

  const handleRemove = (person) => {
    if (!window.confirm(`¿Quitar a ${person.name || person.username} de tus amigos?`)) return;
    run(person.id, () => removeFriend(person.id));
  };

  const busyIcon = (id, Icon) => (busyId === id ? Loader2 : Icon);

  /** Botón según la relación con una persona encontrada en la búsqueda. */
  const renderSearchAction = (person) => {
    if (person.is_friend) {
      return (
        <Button variant="success" size="sm" icon={UserCheck} disabled>
          Amigos
        </Button>
      );
    }
    if (person.request_received) {
      return (
        <Button
          size="sm"
          icon={busyIcon(person.id, Check)}
          disabled={busyId === person.id}
          onClick={() => handleAccept(person.request_id, person.id)}
        >
          Aceptar
        </Button>
      );
    }
    if (person.request_sent) {
      return (
        <Button variant="secondary" size="sm" icon={Clock} disabled>
          Solicitud enviada
        </Button>
      );
    }
    return (
      <Button size="sm" icon={busyIcon(person.id, UserPlus)} disabled={busyId === person.id} onClick={() => handleAdd(person)}>
        Agregar
      </Button>
    );
  };

  const title = isSearching
    ? 'Buscar alumnos'
    : {
        recomendaciones: 'Recomendaciones de la Universidad',
        amigos: 'Mis amigos',
        solicitudes: 'Solicitudes de amistad',
      }[tab];

  const subtitle = isSearching
    ? `Resultados para “${trimmed}”`
    : {
        recomendaciones: 'Personas con gustos en común',
        amigos: 'Tu red de apoyo para retos y motivación',
        solicitudes: 'Personas que quieren conectar contigo',
      }[tab];

  const renderContent = () => {
    if (isSearching) {
      if (searching && !results.length) {
        return <EmptyState icon={Loader2} title="Buscando…" />;
      }
      if (searchError) {
        return (
          <EmptyState icon={WifiOff} title="No se pudo buscar">
            {searchError}
          </EmptyState>
        );
      }
      if (!results.length) {
        return (
          <EmptyState icon={Search} title="Sin resultados">
            Nadie coincide con “{trimmed}”. Prueba con el nombre, correo o carrera.
          </EmptyState>
        );
      }
      return (
        <ul className="person-list">
          {results.map((p) => (
            <PersonCard key={p.id} person={enrich(p)}>
              {renderSearchAction(p)}
            </PersonCard>
          ))}
        </ul>
      );
    }

    if (loading && !friends.length && !recommendations.length && !requests.length) {
      return <EmptyState icon={Loader2} title="Cargando…" />;
    }

    if (error) {
      return (
        <EmptyState icon={WifiOff} title="No se pudo conectar con el servidor">
          {error}{' '}
          <button type="button" className="friends__retry" onClick={refresh}>
            Reintentar
          </button>
        </EmptyState>
      );
    }

    if (tab === 'amigos') {
      if (!friends.length) {
        return (
          <EmptyState icon={Users} title="Aún no tienes amigos">
            Revisa la pestaña de recomendados o busca a alguien por su nombre para enviarle una solicitud.
          </EmptyState>
        );
      }
      return (
        <ul className="person-list">
          {friends.map((p) => (
            <PersonCard key={p.id} person={p}>
              <Button
                variant="secondary"
                size="sm"
                icon={busyIcon(p.id, UserMinus)}
                disabled={busyId === p.id}
                onClick={() => handleRemove(p)}
              >
                Quitar amigo
              </Button>
            </PersonCard>
          ))}
        </ul>
      );
    }

    if (tab === 'solicitudes') {
      if (!requests.length) {
        return (
          <EmptyState icon={Inbox} title="Sin solicitudes pendientes">
            Cuando alguien te envíe una solicitud de amistad aparecerá aquí.
          </EmptyState>
        );
      }
      return (
        <ul className="person-list">
          {requests.map((r) => (
            <PersonCard key={r.id} person={r.from_user}>
              <Button
                size="sm"
                icon={busyIcon(r.from_user.id, Check)}
                disabled={busyId === r.from_user.id}
                onClick={() => handleAccept(r.id, r.from_user.id)}
              >
                Aceptar
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={X}
                disabled={busyId === r.from_user.id}
                onClick={() => handleReject(r.id, r.from_user.id)}
              >
                Rechazar
              </Button>
            </PersonCard>
          ))}
        </ul>
      );
    }

    if (!recommendations.length) {
      return (
        <EmptyState icon={UserPlus} title="Sin recomendaciones por ahora">
          Cuando más alumnos se registren aparecerán aquí. También puedes buscar a alguien por su nombre.
        </EmptyState>
      );
    }
    return (
      <ul className="person-list">
        {recommendations.map((p) => (
          <PersonCard key={p.id} person={p}>
            <Button size="sm" icon={busyIcon(p.id, UserPlus)} disabled={busyId === p.id} onClick={() => handleAdd(p)}>
              Agregar
            </Button>
          </PersonCard>
        ))}
      </ul>
    );
  };

  return (
    <section className="view friends">
      <header className="friends__header">
        <h1 className="page-title">{title}</h1>
        <p className="friends__subtitle">{subtitle}</p>
      </header>

      <SegmentedControl
        label="Secciones de amigos"
        value={tab}
        onChange={(next) => {
          setTab(next);
          setQuery('');
          setActionError(null);
        }}
        options={[
          { value: 'recomendaciones', label: 'Recomendados' },
          { value: 'amigos', label: `Mis amigos (${friends.length})` },
          { value: 'solicitudes', label: `Solicitudes (${requests.length})` },
        ]}
      />

      <label className="search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Buscar alumnos</span>
        <input
          type="search"
          placeholder="Buscar alumnos por nombre, correo o carrera"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {actionError && (
        <p className="friends__error" role="alert">
          {actionError}
        </p>
      )}

      {renderContent()}
    </section>
  );
}
