import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  History,
  Info,
  LogOut,
  Moon,
  Palette,
  PieChart,
  Pencil,
  RefreshCcw,
  RotateCcw,
  Settings,
  Sun,
} from 'lucide-react';
import { Button, Card, Field, IconButton, Modal } from '../../components/ui';
import AvatarWidget from '../../components/avatar/AvatarWidget';
import AvatarCustomizer from '../../components/avatar/AvatarCustomizer';
import { useAuth, useAvatar, useCalendar, useTheme } from '../../context';
import { clearPersistedState } from '../../hooks/usePersistentState';
import LifeWheelQuizModal from '../../components/wheel/LifeWheelQuizModal';
import { useTaskActivity } from '../../hooks/useTaskActivity';
import LifeWheel from './LifeWheel';
import WheelComparison from './WheelComparison';
import WheelHistory from './WheelHistory';
import './profile.css';

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
          <span>Restablecer mis datos</span>
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
  const { wheel, wheelInitial, wheelFinal, wheelFinalAt, saveFinalWheel } = useAvatar();
  const { allTasks, completedTasks } = useTaskActivity();
  const navigate = useNavigate();
  const [finalError, setFinalError] = useState('');
  const location = useLocation();

  const [selectedArea, setSelectedArea] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [modal, setModal] = useState(null); // 'profile' | 'settings' | 'avatar' | 'final-wheel'
  const hasFinal = wheelFinal.length > 0;

  const submitFinalWheel = async (scores) => {
    setFinalError('');
    try {
      await saveFinalWheel(scores);
      setModal(null);
    } catch (err) {
      setFinalError(err?.message || 'No se pudo guardar tu rueda final. Intenta de nuevo.');
      setModal(null);
    }
  };

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
        <Button variant="secondary" size="sm" icon={Palette} onClick={() => setModal('avatar')}>
          Personalizar avatar
        </Button>
      </Card>

      {user && (
        <div className="profile-id">
          <p className="profile-id__name">{user.name}</p>
          <p className="profile-id__meta">
            {user.career} · {user.semester}° semestre
          </p>
        </div>
      )}

      {/* Rueda de la vida */}
      <Card className="wheel-card">
        <div className="row-between">
          <h2 className="wheel-card__title">
            <PieChart size={20} aria-hidden="true" /> Rueda de la Vida
          </h2>
          <div className="wheel-card__actions">
            <Button
              variant="blue"
              size="sm"
              icon={RefreshCcw}
              onClick={() => setModal('final-wheel')}
              title="Volver a contestar las preguntas de la Rueda de la Vida"
            >
              Rehacer rueda
            </Button>
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
            Tu rueda parte de las respuestas de tu cuestionario inicial (0 a 10 por área). Cada día todas las áreas bajan 0.2,
            y al completar una tarea su área sube según la dificultad: tranquila +0.2, media +0.5 y difícil +1. Al final del
            periodo puedes responder la rueda final para compararla con la inicial y recibir retroalimentación por área.
          </p>
        )}

        <LifeWheel areas={wheel} selected={selectedArea} onSelect={setSelectedArea} />

        <p className="wheel-card__final-hint">
          {hasFinal
            ? 'Usa «Rehacer rueda» cuando quieras para actualizar la comparación con tu rueda inicial.'
            : 'Usa «Rehacer rueda» para contestar de nuevo las preguntas y comparar tu rueda inicial con la final.'}
        </p>
        {finalError && (
          <p className="wheel-card__final-error" role="alert">
            {finalError}
          </p>
        )}
      </Card>

      {hasFinal && (
        <WheelComparison initial={wheelInitial} final={wheelFinal} finalAt={wheelFinalAt} tasks={allTasks} />
      )}

      {user?.wheel_quiz_completed && <WheelHistory />}

      {/* Menú */}
      <Card className="menu-card">
        <button type="button" className="menu-row" onClick={() => navigate('/tareas-pasadas')}>
          <span className="menu-row__icon menu-row__icon--blue">
            <History size={18} />
          </span>
          <span>Ver Tareas Pasadas</span>
          {completedTasks.length > 0 && <span className="menu-row__count">{completedTasks.length}</span>}
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

      {modal === 'avatar' && <AvatarCustomizer open onClose={() => setModal(null)} />}
      {modal === 'profile' && <EditProfileModal open onClose={() => setModal(null)} />}
      {modal === 'settings' && <SettingsModal open onClose={() => setModal(null)} />}
      {modal === 'final-wheel' && (
        <LifeWheelQuizModal mode="final" open onClose={() => setModal(null)} onSubmit={submitFinalWheel} />
      )}
    </section>
  );
}
