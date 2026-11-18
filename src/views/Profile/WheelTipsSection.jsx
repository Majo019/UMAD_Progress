import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Apple,
  BookOpen,
  Brain,
  Briefcase,
  Check,
  CheckCircle2,
  ExternalLink,
  Gamepad2,
  Home,
  Info,
  Lightbulb,
  Play,
  Plus,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { Button, Card, Chip } from '../../components/ui';
import {
  DIFFICULTY,
  WHEEL_POINTS_BY_DIFFICULTY,
  formatWheelValue,
  useAvatar,
  useCalendar,
  useTasks,
} from '../../context';
import {
  WHEEL_SOURCES_NOTE,
  WHEEL_TIPS_DATA,
} from '../../data/wheelTipsData';
import './WheelTipsSection.css';

const ICON_MAP = {
  Apple,
  Users,
  Briefcase,
  Home,
  Activity,
  Wallet,
  Brain,
  Gamepad2,
};

export default function WheelTipsSection() {
  const { wheel } = useAvatar();
  const calendar = useCalendar();
  const tasksContext = useTasks();

  const [activeKey, setActiveKey] = useState(() => WHEEL_TIPS_DATA[0].key);
  const [addedTasks, setAddedTasks] = useState({});
  const [toastMessage, setToastMessage] = useState('');

  const handleTabClick = (key) => {
    setActiveKey(key);
  };

  const currentArea = useMemo(
    () => WHEEL_TIPS_DATA.find((a) => a.key === activeKey) || WHEEL_TIPS_DATA[0],
    [activeKey],
  );

  const currentWheelArea = useMemo(
    () => (Array.isArray(wheel) ? wheel.find((a) => a.key === currentArea.key) : null),
    [wheel, currentArea.key],
  );

  const CurrentIcon = ICON_MAP[currentArea.iconName] || Sparkles;

  const handleAddTask = (task) => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);

    // 1) Agregar a CalendarContext (agenda / timeline de tareas)
    if (calendar?.addEvent) {
      calendar.addEvent({
        title: task.title,
        date: dateStr,
        time: '10:00',
        detail: task.detail || `Sugerencia de bienestar (${currentArea.label})`,
        type: 'personal',
        difficulty: task.difficulty || 'tranquila',
        area: currentArea.key,
        completed: false,
      });
    }

    // 2) Agregar a TasksContext (servidor / dashboard)
    if (tasksContext?.addTask) {
      tasksContext.addTask({
        title: task.title,
        description: task.detail || `Sugerencia de bienestar (${currentArea.label})`,
        dueDate: dateStr,
        difficulty: task.difficulty || 'tranquila',
        area: currentArea.key,
      });
    }

    setAddedTasks((prev) => ({ ...prev, [task.id]: true }));
    setToastMessage(`✓ Tarea agregada a tu día: "${task.title}"`);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const videoSrc = `${import.meta.env.BASE_URL}videos/${currentArea.videoFile}`;

  return (
    <Card className="wheel-tips-card" id="tips-por-area">
      {/* Encabezado del apartado */}
      <div className="wheel-tips-header">
        <div className="wheel-tips-header__title-row">
          <h2 className="wheel-tips-header__title">
            <Sparkles size={20} className="wheel-tips-header__icon" aria-hidden="true" />
            Tips y videos por área
          </h2>
          <span className="wheel-tips-header__badge">Rueda de la Vida</span>
        </div>
        <p className="wheel-tips-header__desc">
          Guías prácticas, videos y hábitos sugeridos para potenciar cada área de tu vida universitaria.
        </p>
      </div>

      {/* Barra de 8 pestañas (con scroll horizontal en móviles) */}
      <div className="wheel-tips-tabs-wrapper">
        <div className="wheel-tips-tabs" role="tablist" aria-label="Áreas de la Rueda de la Vida">
          {WHEEL_TIPS_DATA.map((area) => {
            const Icon = ICON_MAP[area.iconName] || Sparkles;
            const isActive = area.key === currentArea.key;
            return (
              <button
                key={area.key}
                type="button"
                role="tab"
                id={`tab-${area.key}`}
                aria-selected={isActive}
                aria-controls={`panel-${area.key}`}
                className={`wheel-tips-tab ${isActive ? 'is-active' : ''}`}
                onClick={() => handleTabClick(area.key)}
              >
                <Icon size={16} className="wheel-tips-tab__icon" aria-hidden="true" />
                <span className="wheel-tips-tab__label">{area.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido de la pestaña activa */}
      <div
        id={`panel-${currentArea.key}`}
        role="tabpanel"
        aria-labelledby={`tab-${currentArea.key}`}
        className="wheel-tips-content"
      >
        {/* Banner del área activa */}
        <div className="wheel-tips-hero">
          <div className="wheel-tips-hero__icon-badge" style={{ backgroundColor: `${currentArea.accentColor}20`, color: currentArea.accentColor }}>
            <CurrentIcon size={24} aria-hidden="true" />
          </div>
          <div className="wheel-tips-hero__meta">
            <div className="wheel-tips-hero__top-row">
              <h3 className="wheel-tips-hero__title">{currentArea.label}</h3>
              {currentWheelArea && (
                <span className="wheel-tips-hero__score" title="Puntuación actual en tu Rueda de la Vida">
                  Tu nivel: <strong>{formatWheelValue(currentWheelArea.value)}</strong>/10
                </span>
              )}
            </div>
            {currentArea.subtitle && (
              <p className="wheel-tips-hero__subtitle">{currentArea.subtitle}</p>
            )}
          </div>
        </div>

        {/* Notificación de tarea agregada */}
        {toastMessage && (
          <div className="wheel-tips-toast" role="status" aria-live="polite">
            <Check size={16} aria-hidden="true" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Video explicativo del área */}
        <div className="wheel-tips-video-block">
          <div className="wheel-tips-video-block__head">
            <Play size={16} aria-hidden="true" />
            <span>{currentArea.videoTitle || `Video guía: ${currentArea.label}`}</span>
          </div>
          <div className="wheel-tips-video-player-wrap">
            <video
              key={videoSrc}
              src={videoSrc}
              className="wheel-tips-video-player"
              controls
              playsInline
              preload="metadata"
              controlsList="nodownload"
            >
              Tu navegador no soporta reproducción de videos MP4.
            </video>
          </div>
        </div>

        {/* Sección: Tips clave */}
        <div className="wheel-tips-section-group">
          <div className="wheel-tips-section-group__head">
            <Lightbulb size={18} className="wheel-tips-icon--amber" aria-hidden="true" />
            <h4>Consejos y tips clave</h4>
          </div>
          <ul className="wheel-tips-list">
            {currentArea.tips.map((tip, idx) => (
              <li key={idx} className="wheel-tips-item">
                <span className="wheel-tips-item__bullet" aria-hidden="true">
                  {idx + 1}
                </span>
                <p className="wheel-tips-item__text">{tip}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Sección: Tareas sugeridas */}
        <div className="wheel-tips-section-group">
          <div className="wheel-tips-section-group__head">
            <CheckCircle2 size={18} className="wheel-tips-icon--green" aria-hidden="true" />
            <div className="wheel-tips-section-group__head-texts">
              <h4>Tareas sugeridas</h4>
              <p className="wheel-tips-section-group__head-sub">
                Toca «Agregar a mis tareas» para agendarlas directamente en tu calendario.
              </p>
            </div>
          </div>

          <div className="wheel-tips-tasks-grid">
            {currentArea.suggestedTasks.map((task) => {
              const isAdded = Boolean(addedTasks[task.id]);
              const diffInfo = DIFFICULTY[task.difficulty] || DIFFICULTY.media;
              const points = WHEEL_POINTS_BY_DIFFICULTY[task.difficulty] ?? 0.5;

              return (
                <div key={task.id} className={`wheel-tips-task-card ${isAdded ? 'is-added' : ''}`}>
                  <div className="wheel-tips-task-card__info">
                    <p className="wheel-tips-task-card__title">{task.title}</p>
                    {task.detail && (
                      <p className="wheel-tips-task-card__detail">{task.detail}</p>
                    )}
                    <div className="wheel-tips-task-card__badges">
                      <span className={`task-diff-pill task-diff-pill--${diffInfo.color}`}>
                        {diffInfo.label} (+{points} pts)
                      </span>
                    </div>
                  </div>

                  <div className="wheel-tips-task-card__actions">
                    {isAdded ? (
                      <span className="wheel-tips-task-card__added-badge">
                        <Check size={14} aria-hidden="true" /> Agendada
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Plus}
                        onClick={() => handleAddTask(task)}
                        title="Agregar tarea a tu calendario"
                      >
                        Agregar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sección: Referencias */}
        <div className="wheel-tips-section-group">
          <div className="wheel-tips-section-group__head">
            <BookOpen size={18} className="wheel-tips-icon--blue" aria-hidden="true" />
            <h4>Referencias y artículos</h4>
          </div>
          <ul className="wheel-tips-refs-list">
            {currentArea.references.map((ref, idx) => (
              <li key={idx}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wheel-tips-ref-link"
                >
                  <span className="wheel-tips-ref-link__text">{ref.text}</span>
                  <ExternalLink size={14} className="wheel-tips-ref-link__icon" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Nota informativa de fuentes */}
        <div className="wheel-tips-note">
          <Info size={16} className="wheel-tips-note__icon" aria-hidden="true" />
          <p className="wheel-tips-note__text">{WHEEL_SOURCES_NOTE}</p>
        </div>
      </div>
    </Card>
  );
}
