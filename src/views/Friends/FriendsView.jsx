import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search, Trash2, Upload, UserMinus, UserPlus, Users, Video } from 'lucide-react';
import { Button, Card, Chip, EmptyState, IconButton, SegmentedControl, UserAvatar } from '../../components/ui';
import { useAuth, useFriends } from '../../context';
import { listShorts, removeShort, saveShort } from '../../utils/shortsStorage';
import './friends.css';

const CHIP_COLORS = ['blue', 'coral', 'neutral'];

function PersonCard({ person, isFriend, onAdd, onRemove }) {
  return (
    <Card as="li" className="person">
      <div className="person__top">
        <UserAvatar name={person.name} size={52} />
        <div className="person__info">
          <p className="person__name">{person.name}</p>
          <p className="person__career">{person.career}</p>
        </div>
        {isFriend ? (
          <Button variant="success" size="sm" icon={Check} onClick={() => onRemove(person.id)} aria-label={`Quitar a ${person.name}`}>
            Agregado
          </Button>
        ) : (
          <Button size="sm" icon={UserPlus} onClick={() => onAdd(person.id)}>
            Agregar
          </Button>
        )}
      </div>
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
    </Card>
  );
}

export default function FriendsView() {
  const { recommendations, friends, addFriend, removeFriend, isFriend } = useFriends();
  const { user } = useAuth();
  const userId = user?.id;
  const [tab, setTab] = useState('recomendaciones');
  const [query, setQuery] = useState('');
  const [shorts, setShorts] = useState([]);
  const [videoUrls, setVideoUrls] = useState({});
  const [loadingShorts, setLoadingShorts] = useState(true);
  const [shortTitle, setShortTitle] = useState('');
  const [shortFile, setShortFile] = useState(null);
  const [shortsError, setShortsError] = useState('');
  const fileInput = useRef(null);

  useEffect(() => {
    let active = true;
    setShorts([]);
    setLoadingShorts(true);

    listShorts(userId)
      .then((savedShorts) => {
        if (active) setShorts(savedShorts);
      })
      .catch((error) => {
        if (active) setShortsError(error.message);
      })
      .finally(() => {
        if (active) setLoadingShorts(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    const urls = Object.fromEntries(
      shorts.map((short) => [short.id, URL.createObjectURL(short.video)]),
    );
    setVideoUrls(urls);

    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [shorts]);

  const list = tab === 'recomendaciones' ? recommendations : friends;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => [p.name, p.career, ...p.interests].some((v) => v.toLowerCase().includes(q)));
  }, [list, query]);

  const uploadShort = async (event) => {
    event.preventDefault();
    setShortsError('');

    if (!shortFile || !shortFile.type.startsWith('video/')) {
      setShortsError('Selecciona un archivo de video válido.');
      return;
    }

    try {
      const savedShort = await saveShort(shortFile, shortTitle, userId);
      setShorts((prev) => [savedShort, ...prev]);
      setShortTitle('');
      setShortFile(null);
      if (fileInput.current) fileInput.current.value = '';
    } catch (error) {
      setShortsError(error.message);
    }
  };

  const deleteShort = async (id) => {
    setShortsError('');
    try {
      await removeShort(id, userId);
      setShorts((prev) => prev.filter((short) => short.id !== id));
    } catch (error) {
      setShortsError(error.message);
    }
  };

  return (
    <section className="view friends">
      <header className="friends__header">
        <h1 className="page-title">
          {tab === 'recomendaciones'
            ? 'Recomendaciones de la Universidad'
            : tab === 'amigos'
              ? 'Mis amigos'
              : 'Shorts'}
        </h1>
        <p className="friends__subtitle">
          {tab === 'recomendaciones'
            ? 'Personas con gustos en común'
            : tab === 'amigos'
              ? 'Tu red de apoyo para retos y motivación'
              : 'Tus videos cortos guardados en este navegador'}
        </p>
      </header>

      <SegmentedControl
        label="Secciones de amigos"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'recomendaciones', label: 'Recomendados' },
          { value: 'amigos', label: `Mis amigos (${friends.length})` },
          { value: 'shorts', label: `Shorts (${shorts.length})` },
        ]}
      />

      {tab === 'shorts' ? (
        <>
          <Card className="shorts-upload">
            <div className="shorts-upload__heading">
              <Video size={20} aria-hidden="true" />
              <div>
                <h2 className="section-title">Sube un Short</h2>
                <p className="text-muted">El video se guarda solo en este navegador.</p>
              </div>
            </div>
            <form className="shorts-upload__form" onSubmit={uploadShort}>
              <label className="shorts-upload__field">
                <span>Título (opcional)</span>
                <input
                  type="text"
                  value={shortTitle}
                  onChange={(event) => setShortTitle(event.target.value)}
                  maxLength={80}
                  placeholder="Dale un título a tu video"
                />
              </label>
              <label className="shorts-upload__field">
                <span>Archivo de video</span>
                <input
                  ref={fileInput}
                  type="file"
                  accept="video/*"
                  onChange={(event) => setShortFile(event.target.files?.[0] ?? null)}
                  required
                />
              </label>
              <Button type="submit" icon={Upload} disabled={!shortFile}>
                Guardar Short
              </Button>
              {shortsError && <p className="shorts-upload__error" role="alert">{shortsError}</p>}
            </form>
          </Card>

          {loadingShorts ? (
            <p className="text-muted" role="status">Cargando Shorts…</p>
          ) : shorts.length ? (
            <ul className="shorts-list">
              {shorts.map((short) => (
                <Card as="li" key={short.id} className="short-card">
                  {videoUrls[short.id] && (
                    <video
                      className="short-card__video"
                      src={videoUrls[short.id]}
                      controls
                      playsInline
                      preload="metadata"
                      aria-label={short.title}
                    />
                  )}
                  <div className="short-card__details">
                    <div>
                      <p className="short-card__title">{short.title}</p>
                      <p className="short-card__meta">{short.fileName}</p>
                    </div>
                    <IconButton
                      icon={Trash2}
                      label={`Eliminar ${short.title}`}
                      className="icon-btn--sm"
                      onClick={() => deleteShort(short.id)}
                    />
                  </div>
                </Card>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Video} title="Aún no hay Shorts">
              Elige un video para publicar el primero.
            </EmptyState>
          )}
        </>
      ) : (
        <>
          <label className="search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Buscar</span>
            <input
              type="search"
              placeholder="Buscar por nombre, carrera o interés"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          {filtered.length ? (
            <ul className="person-list">
              {filtered.map((p) => (
                <PersonCard key={p.id} person={p} isFriend={isFriend(p.id)} onAdd={addFriend} onRemove={removeFriend} />
              ))}
            </ul>
          ) : tab === 'amigos' && !query ? (
            <EmptyState icon={Users} title="Aún no agregas amigos">
              Revisa la pestaña de recomendados y conecta con personas con tus mismos gustos.
            </EmptyState>
          ) : (
            <EmptyState icon={query ? Search : UserMinus} title="Sin resultados">
              {query ? `Nadie coincide con “${query}”.` : 'Ya agregaste a todas las recomendaciones.'}
            </EmptyState>
          )}
        </>
      )}
    </section>
  );
}
