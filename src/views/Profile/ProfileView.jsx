import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Award,
  History,
  Info,
  LogOut,
  Medal,
  Moon,
  PieChart,
  Pencil,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Sun,
} from 'lucide-react';
import { Button, Card, Chip, Field, IconButton, Modal, ProgressBar } from '../../components/ui';
import AvatarWidget from '../../components/avatar/AvatarWidget';
import { XP_PER_LEVEL, useAuth, useAvatar, useCalendar, useTasks, useTheme } from '../../context';
import { clearPersistedState } from '../../hooks/usePersistentState';
import LifeWheel from './LifeWheel';
import './profile.css';

const LEVEL_RANKS = [
  { min: 1, label: 'Novato' },
  { min: 5, label: 'Aprendiz' },
  { min: 10, label: 'Constante' },
  { min: 20, label: 'Avanzado' },
  { min: 30, label: 'Maestro' },
];

function formatAchievementDate(timestamp) {
  if (!timestamp) return '';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp));
}

function EditProfileModal({ open, onClose }) {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState(() => ({
    name: user?.name ?? '',
    career: user?.career ?? '',
    semester: user?.semester ?? 1,
    goals: user?.goals ?? '',
    interests: (user?.interests ?? []).join(', '),
  }));
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    updateProfile({
      ...form,
      semester: Number(form.semester),
      interests: form.interests
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar perfil"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="profile-form">
            Guardar
          </Button>
        </>
      }
    >
      <form id="profile-form" className="form-grid" onSubmit={submit}>
        <Field label="Nombre" value={form.name} onChange={set('name')} required maxLength={40} />
        <div className="form-grid form-grid--2">
          <Field label="Carrera" value={form.career} onChange={set('career')} maxLength={40} />
          <Field label="Semestre" type="number" min={1} max={12} value={form.semester} onChange={set('semester')} />
        </div>
        <Field
          label="Intereses"
          value={form.interests}
          onChange={set('interests')}
          hint="Separados por coma. Se usan para recomendarte amigos."
        />
        <Field label="Objetivos de bienestar" as="textarea" rows={3} value={form.goals} onChange={set('goals')} maxLength={160} />
      </form>
    </Modal>
  );
}

function SettingsModal({ open, onClose }) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { resetAvatar } = useAvatar();
  const { resetEvents } = useCalendar();

  return (
    <Modal open={open} onClose={onClose} title="Configuración">
      <div className="settings-list">
        <button type="button" className="settings-row" onClick={toggleTheme}>
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          <span>Tema {theme === 'dark' ? 'oscuro' : 'claro'}</span>
          <span className={`switch ${theme === 'dark' ? 'is-on' : ''}`} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="settings-row"
          onClick={() => {
            resetAvatar();
            resetEvents();
            onClose();
          }}
        >
          <RotateCcw size={18} />
          <span>Restablecer datos de ejemplo</span>
        </button>
        <button
          type="button"
          className="settings-row is-danger"
          onClick={() => {
            clearPersistedState();
            logout();
          }}
        >
          <LogOut size={18} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </Modal>
  );
}

export default function ProfileView() {
  const { user } = useAuth();
  const { wheel, setWheelValue, level, xp } = useAvatar();
  const { achievements } = useTasks();
  const navigate = useNavigate();
  const location = useLocation();
  const rank = [...LEVEL_RANKS].reverse().find((item) => level >= item.min) ?? LEVEL_RANKS[0];
  const nextRank = LEVEL_RANKS.find((item) => level < item.min);

  const [selectedArea, setSelectedArea] = useState(null);
  const [editingWheel, setEditingWheel] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [modal, setModal] = useState(null); // 'profile' | 'settings'

  // El engrane del header abre Configuración directamente
  useEffect(() => {
    if (location.state?.openSettings) {
      setModal('settings');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  return (
    <section className="view profile">
      {/* Avatar + estado — Widget 4.5 */}
      <Card className="avatar-card">
        <AvatarWidget size={88} />
      </Card>

      {user && (
        <div className="profile-id">
          <p className="profile-id__name">{user.name}</p>
          <p className="profile-id__meta">
            {user.career} · {user.semester}° semestre
          </p>
        </div>
      )}

      <Card className="profile-level">
        <div className="profile-level__heading">
          <div className="profile-level__icon">
            <Medal size={22} aria-hidden="true" />
          </div>
          <div className="profile-level__identity">
            <p className="label-mono">Clasificación</p>
            <h2 className="profile-level__rank">{rank.label}</h2>
          </div>
          <Chip color="amber">Nivel {level}</Chip>
        </div>
        <ProgressBar value={xp} max={XP_PER_LEVEL} label="Progreso al siguiente nivel" color="blue" />
        <p className="profile-level__hint">
          {nextRank
            ? `Completa actividades para llegar al rango ${nextRank.label} en el nivel ${nextRank.min}.`
            : 'Has alcanzado el rango más alto. Sigue acumulando experiencia.'}
        </p>
      </Card>

      <Card className="achievement-card">
        <div className="achievement-card__heading">
          <div className="achievement-card__title">
            <Award size={20} aria-hidden="true" />
            <h2 className="section-title">Logros de tareas</h2>
          </div>
          <Chip color="amber">{achievements.length} {achievements.length === 1 ? 'logro' : 'logros'}</Chip>
        </div>
        {achievements.length ? (
          <ul className="achievement-list">
            {[...achievements].reverse().map((achievement) => (
              <li className="achievement-list__item" key={achievement.id}>
                <span className="achievement-list__icon">
                  <Sparkles size={16} aria-hidden="true" />
                </span>
                <span className="achievement-list__details">
                  <strong>Tarea completada</strong>
                  <span>{achievement.taskTitle}</span>
                </span>
                <time dateTime={new Date(achievement.completedAt).toISOString()}>
                  {formatAchievementDate(achievement.completedAt)}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="achievement-card__empty">
            Completa una tarea para desbloquear tu primer logro.
          </p>
        )}
      </Card>

      {/* Rueda de la vida */}
      <Card className="wheel-card">
        <div className="row-between">
          <h2 className="wheel-card__title">
            <PieChart size={20} aria-hidden="true" /> Rueda de la Vida
          </h2>
          <div className="wheel-card__actions">
            <IconButton
              icon={SlidersHorizontal}
              label={editingWheel ? 'Terminar edición' : 'Calificar áreas'}
              className={`icon-btn--sm ${editingWheel ? 'is-toggled' : ''}`}
              onClick={() => setEditingWheel((v) => !v)}
            />
            <IconButton
              icon={Info}
              label="¿Qué es la Rueda de la Vida?"
              className={`icon-btn--sm ${showInfo ? 'is-toggled' : ''}`}
              onClick={() => setShowInfo((v) => !v)}
            />
          </div>
        </div>

        {showInfo && (
          <p className="wheel-card__info">
            Califica del 0 al 10 qué tan satisfecho estás con cada área de tu vida. Entre más equilibrada se vea la rueda, más
            balanceada está tu rutina. Los check-ins de hábitos la van haciendo crecer.
          </p>
        )}

        <LifeWheel areas={wheel} selected={selectedArea} onSelect={setSelectedArea} />

        {editingWheel && (
          <div className="wheel-sliders">
            {wheel.map((area) => (
              <label key={area.key} className="wheel-slider">
                <span>{area.label}</span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={area.value}
                  onChange={(e) => setWheelValue(area.key, Number(e.target.value))}
                  onFocus={() => setSelectedArea(area.key)}
                />
                <span className="wheel-slider__value">{area.value}</span>
              </label>
            ))}
          </div>
        )}
      </Card>

      {/* Menú */}
      <Card className="menu-card">
        <button type="button" className="menu-row" onClick={() => navigate('/tareas-pasadas')}>
          <span className="menu-row__icon menu-row__icon--blue">
            <History size={18} />
          </span>
          <span>Ver Tareas Pasadas</span>
          <ChevronRight size={18} className="menu-row__chevron" />
        </button>
        <button type="button" className="menu-row" onClick={() => setModal('profile')}>
          <span className="menu-row__icon menu-row__icon--coral">
            <Pencil size={18} />
          </span>
          <span>Editar Perfil</span>
          <ChevronRight size={18} className="menu-row__chevron" />
        </button>
        <button type="button" className="menu-row" onClick={() => setModal('settings')}>
          <span className="menu-row__icon">
            <Settings size={18} />
          </span>
          <span>Configuración</span>
          <Settings size={18} className="menu-row__chevron menu-row__chevron--accent" />
        </button>
      </Card>

      {modal === 'profile' && <EditProfileModal open onClose={() => setModal(null)} />}
      {modal === 'settings' && <SettingsModal open onClose={() => setModal(null)} />}
    </section>
  );
}