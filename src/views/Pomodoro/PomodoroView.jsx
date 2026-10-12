import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, TimerReset } from 'lucide-react';
import { Button, Card, Chip, ProgressBar } from '../../components/ui';
import { useAvatar } from '../../context';
import './pomodoro.css';

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export default function PomodoroView() {
  const { applyReward } = useAvatar();

  const [phase, setPhase] = useState('focus');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const rewardedRef = useRef(false);

  const totalSeconds =
    phase === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS;

  const progress = useMemo(() => {
    const elapsed = totalSeconds - secondsLeft;

    return Math.round((elapsed / totalSeconds) * 100);
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
            setCompletedSessions((count) => count + 1);
          }

          setPhase('break');
          return BREAK_SECONDS;
        }

        rewardedRef.current = false;
        setPhase('focus');
        return FOCUS_SECONDS;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, phase, applyReward]);

  const toggleTimer = () => {
    setIsRunning((running) => !running);
  };

  const resetTimer = () => {
    setIsRunning(false);
    rewardedRef.current = false;

    setSecondsLeft(
      phase === 'focus'
        ? FOCUS_SECONDS
        : BREAK_SECONDS,
    );
  };

  const changePhase = (nextPhase) => {
    setIsRunning(false);
    rewardedRef.current = false;
    setPhase(nextPhase);

    setSecondsLeft(
      nextPhase === 'focus'
        ? FOCUS_SECONDS
        : BREAK_SECONDS,
    );
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(
    seconds,
  ).padStart(2, '0')}`;

  return (
    <section className="view pomodoro">
      <div>
        <h1 className="page-title">Pomodoro</h1>
        <p className="pomodoro__subtitle">
          Organiza tus sesiones de enfoque y descanso.
        </p>
      </div>

      <div className="pomodoro__phases">
        <Button
          variant={phase === 'focus' ? 'primary' : 'secondary'}
          onClick={() => changePhase('focus')}
        >
          Enfoque
        </Button>

        <Button
          variant={phase === 'break' ? 'blue' : 'secondary'}
          onClick={() => changePhase('break')}
        >
          Descanso
        </Button>
      </div>

      <Card
        className="pomodoro__timer-card"
        accent={phase === 'focus' ? 'coral' : 'blue'}
      >
        <div className="pomodoro__timer-icon">
          <TimerReset size={28} />
        </div>

        <Chip color={phase === 'focus' ? 'coral' : 'blue'}>
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
          color={phase === 'focus' ? 'coral' : 'blue'}
        />

        <div className="pomodoro__actions">
          <Button
            icon={isRunning ? Pause : Play}
            onClick={toggleTimer}
          >
            {isRunning ? 'Pausar' : 'Iniciar'}
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
          Cada sesión de enfoque completada otorga +10 cariño y +15 XP.
        </p>
      </Card>
    </section>
  );
}