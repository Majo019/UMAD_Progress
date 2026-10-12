import { useMemo, useState } from 'react';
import { Check, Search, UserMinus, UserPlus, Users } from 'lucide-react';
import { Button, Card, Chip, EmptyState, SegmentedControl, UserAvatar } from '../../components/ui';
import { useFriends } from '../../context';
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
  const [tab, setTab] = useState('recomendaciones');
  const [query, setQuery] = useState('');

  const list = tab === 'recomendaciones' ? recommendations : friends;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => [p.name, p.career, ...p.interests].some((v) => v.toLowerCase().includes(q)));
  }, [list, query]);

  return (
    <section className="view friends">
      <header className="friends__header">
        <h1 className="page-title">
          {tab === 'recomendaciones' ? 'Recomendaciones de la Universidad' : 'Mis amigos'}
        </h1>
        <p className="friends__subtitle">
          {tab === 'recomendaciones' ? 'Personas con gustos en común' : 'Tu red de apoyo para retos y motivación'}
        </p>
      </header>

      <SegmentedControl
        label="Secciones de amigos"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'recomendaciones', label: 'Recomendados' },
          { value: 'amigos', label: `Mis amigos (${friends.length})` },
        ]}
      />

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
    </section>
  );
}
