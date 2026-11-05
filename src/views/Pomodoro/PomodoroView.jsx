import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  TimerReset,
} from 'lucide-react';

import {
  Button,
  Card,
  Chip,
  Field,
  ProgressBar,
} from '../../components/ui';

import { useAvatar } from '../../context';
import { usePersistentState } from '../../hooks/usePersistentState';

import './pomodoro.css';

const DEFAULT_FOCUS_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;

const clampMinutes = (value, min, max) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return min;

  return Math.min(max, Math.max(min, Math.round(number)));
};

export default function PomodoroView() {
  const { applyReward } = useAvatar();

  const [focusMinutes, setFocusMinutes] = usePersistentState(
    'up:pomodoro-focus',
    DEFAULT_FOCUS_MINUTES,
  );

  const [breakMinutes, setBreakMinutes] = usePersistentState(
    'up:pomodoro-break',
    DEFAULT_BREAK_MINUTES,
  );

  const focusSeconds = focusMinutes * 60;
  const breakSeconds = breakMinutes * 60;

  const [phase, setPhase] = useState('focus');

  const [secondsLeft, setSecondsLeft] = useState(
    focusSeconds,
  );

  const [isRunning, setIsRunning] = useState(false);

  const [completedSessions, setCompletedSessions] =
    usePersistentState(
      'up:pomodoro-sessions',
      0,
    );

  const rewardedRef = useRef(false);

  const totalSeconds =
    phase === 'focus'
      ? focusSeconds
      : breakSeconds;

  const progress = useMemo(() => {
    if (!totalSeconds) return 0;

    const elapsed = totalSeconds - secondsLeft;

    return Math.min(
      100,
      Math.max(
        0,
        Math.round((elapsed / totalSeconds) * 100),
      ),
    );
  }, [secondsLeft, totalSeconds]);

  useEffect(() => {
    if (!isRunning) return undefined;

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) {
          return current - 1;
        }

        setIsRunning(false);

        if (phase === 'focus') {
          if (!rewardedRef.current) {
            applyReward({
              carino: 10,
              xp: 15,
            });

            rewardedRef.current = true;

            setCompletedSessions(
              (count) => count + 1,
            );
          }

          setPhase('break');

          return breakSeconds;
        }

        rewardedRef.current = false;

        setPhase('focus');

        return focusSeconds;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    isRunning,
    phase,
    focusSeconds,
    breakSeconds,
    applyReward,
    setCompletedSessions,
  ]);

  const toggleTimer = () => {
    setIsRunning((running) => !running);
  };

  const resetTimer = () => {
    setIsRunning(false);
    rewardedRef.current = false;

    setSecondsLeft(
      phase === 'focus'
        ? focusSeconds
        : breakSeconds,
    );
  };

  const changePhase = (nextPhase) => {
    setIsRunning(false);
    rewardedRef.current = false;

    setPhase(nextPhase);

    setSecondsLeft(
      nextPhase === 'focus'
        ? focusSeconds
        : breakSeconds,
    );
  };

  const handleFocusChange = (event) => {
    const value = clampMinutes(
      event.target.value,
      1,
      120,
    );

    setFocusMinutes(value);

    if (!isRunning && phase === 'focus') {
      setSecondsLeft(value * 60);
    }
  };

  const handleBreakChange = (event) => {
    const value = clampMinutes(
      event.target.value,
      1,
      60,
    );

    setBreakMinutes(value);

    if (!isRunning && phase === 'break') {
      setSecondsLeft(value * 60);
    }
  };

  const applyPreset = (
    newFocus,
    newBreak,
  ) => {
    if (isRunning) return;

    setFocusMinutes(newFocus);
    setBreakMinutes(newBreak);

    setSecondsLeft(
      phase === 'focus'
        ? newFocus * 60
        : newBreak * 60,
    );
  };

  const minutes =
    Math.floor(secondsLeft / 60);

  const seconds =
    secondsLeft % 60;

  const formattedTime =
    `${String(minutes).padStart(2, '0')}:` +
    `${String(seconds).padStart(2, '0')}`;

  return (
    <section className="view pomodoro">
      <div>
        <h1 className="page-title">
          Pomodoro
        </h1>

        <p className="pomodoro__subtitle">
          Organiza tus sesiones de enfoque y descanso.
        </p>
      </div>

      <Card className="pomodoro__settings">
        <div className="pomodoro__settings-header">
          <div>
            <p className="label-mono">
              Configuración
            </p>

            <p className="text-muted">
              Personaliza la duración de tus sesiones.
            </p>
          </div>
        </div>

        <div className="pomodoro__settings-grid">
          <Field
            label="Enfoque"
            type="number"
            min="1"
            max="120"
            value={focusMinutes}
            onChange={handleFocusChange}
            disabled={isRunning}
          />

          <Field
            label="Descanso"
            type="number"
            min="1"
            max="60"
            value={breakMinutes}
            onChange={handleBreakChange}
            disabled={isRunning}
          />
        </div>

        <p className="pomodoro__settings-hint">
          Duración en minutos
        </p>

        <div className="pomodoro__presets">
          <Button
            variant="secondary"
            onClick={() => applyPreset(25, 5)}
            disabled={isRunning}
          >
            25 / 5
          </Button>

          <Button
            variant="secondary"
            onClick={() => applyPreset(50, 10)}
            disabled={isRunning}
          >
            50 / 10
          </Button>

          <Button
            variant="secondary"
            onClick={() => applyPreset(15, 5)}
            disabled={isRunning}
          >
            15 / 5
          </Button>
        </div>
      </Card>

      <div className="pomodoro__phases">
        <Button
          variant={
            phase === 'focus'
              ? 'primary'
              : 'secondary'
          }
          onClick={() => changePhase('focus')}
        >
          Enfoque
        </Button>

        <Button
          variant={
            phase === 'break'
              ? 'blue'
              : 'secondary'
          }
          onClick={() => changePhase('break')}
        >
          Descanso
        </Button>
      </div>

      <Card
        className="pomodoro__timer-card"
        accent={
          phase === 'focus'
            ? 'coral'
            : 'blue'
        }
      >
        <div className="pomodoro__timer-icon">
          <TimerReset size={28} />
        </div>

        <Chip
          color={
            phase === 'focus'
              ? 'coral'
              : 'blue'
          }
        >
          {phase === 'focus'
            ? 'Sesión de enfoque'
            : 'Descanso'}
        </Chip>

        <p
          className="pomodoro__time"
          aria-live="polite"
        >
          {formattedTime}
        </p>

        <ProgressBar
          value={progress}
          label={
            phase === 'focus'
              ? 'Progreso de enfoque'
              : 'Progreso de descanso'
          }
          color={
            phase === 'focus'
              ? 'coral'
              : 'blue'
          }
        />

        <div className="pomodoro__actions">
          <Button
            icon={
              isRunning
                ? Pause
                : Play
            }
            onClick={toggleTimer}
          >
            {isRunning
              ? 'Pausar'
              : 'Iniciar'}
          </Button>

          <Button
            variant="secondary"
            icon={RotateCcw}
            onClick={resetTimer}
          >
            Reiniciar
          </Button>
        </div>
      </Card>

      <Card className="pomodoro__summary">
        <span className="label-mono">
          Sesiones completadas
        </span>

        <strong className="pomodoro__session-count">
          {completedSessions}
        </strong>

        <p className="text-muted">
          Cada sesión de enfoque completada otorga
          +10 cariño y +15 XP.
        </p>
      </Card>
    </section>
  );
}