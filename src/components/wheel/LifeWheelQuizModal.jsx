import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Play,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { Button, Chip, Modal } from '../ui';
import { useAvatar } from '../../context';
import './LifeWheelQuizModal.css';

export const LIFE_WHEEL_QUESTIONS = [
  {
    key: 'amigos',
    number: 1,
    label: 'Amigos',
    questions: [
      'Mantengo comunicación constante con mis amistades cercanas a lo largo del mes.',
      'Cuento con personas en mi círculo social a quienes puedo acudir en situaciones difíciles.',
      'Dedico tiempo intencional para convivir o realizar actividades recreativas con mis amigos.',
      'Resuelvo los malentendidos o desacuerdos de forma asertiva y constructiva.',
      'Siento que existe un equilibrio mutuo de apoyo e interés en mis relaciones de amistad.',
    ],
  },
  {
    key: 'trabajo',
    number: 2,
    label: 'Trabajo',
    questions: [
      'Cumplo con mis entregables, proyectos y responsabilidades dentro de los plazos establecidos.',
      'Mantengo un nivel de concentración alto sin que las distracciones afecten mi rendimiento laboral.',
      'Busco activamente aprender nuevas habilidades o herramientas para mejorar mi desempeño profesional.',
      'Gestiono la carga de trabajo y el estrés sin comprometer mi bienestar físico o mental.',
      'Recibo retroalimentación constructiva y aplico mejoras inmediatas en mis tareas diarias.',
    ],
  },
  {
    key: 'familia',
    number: 3,
    label: 'Familia',
    questions: [
      'Comparto tiempo de calidad y conversaciones significativas con los miembros de mi familia.',
      'Existe un ambiente de respeto mutuo y comunicación abierta en el entorno familiar.',
      'Apoyo y colaboro activamente en las responsabilidades o necesidades cotidianas del hogar.',
      'Manejo los conflictos familiares buscando acuerdos sin recurrir a la evasión o la confrontación destructiva.',
      'Me siento valorado y respaldado emocionalmente por mi núcleo familiar.',
    ],
  },
  {
    key: 'deporte',
    number: 4,
    label: 'Deporte',
    questions: [
      'Cumplo de forma regular con mi rutina de ejercicio físico programada durante la semana.',
      'Aplico una sobrecarga o aumento progresivo en la intensidad, técnica o duración de mis entrenamientos.',
      'Priorizo los tiempos de descanso y recuperación muscular adecuados entre sesiones.',
      'Mantengo la disciplina para entrenar incluso en días donde la motivación inicial es baja.',
      'Registro o monitoreo mis marcas, repeticiones o avances de rendimiento físico de manera continua.',
    ],
  },
  {
    key: 'economia',
    number: 5,
    label: 'Economía',
    questions: [
      'Llevo un control detallado de mis ingresos, gastos fijos y gastos variables cada mes.',
      'Destino un porcentaje fijo de mis ingresos al ahorro o a la inversión antes de realizar consumos personales.',
      'Evito compras impulsivas o innecesarias que comprometan mi estabilidad financiera.',
      'Cuento con un fondo de reserva o emergencias capaz de cubrir imprevistos económicos.',
      'Pago mis compromisos financieros, servicios y tarjetas a tiempo sin generar recargos o deudas descontroladas.',
    ],
  },
  {
    key: 'retrospeccion',
    number: 6,
    label: 'Retrospección',
    questions: [
      'Me tomo momentos regulares para reflexionar sobre mis decisiones, aciertos y errores pasados.',
      'Identifico con claridad mis patrones emocionales y cómo influyen en mis reacciones cotidianas.',
      'Evalúo periódicamente si mis acciones diarias están alineadas con mis metas a mediano y largo plazo.',
      'Asumo la responsabilidad directa de mis resultados sin justificarme en factores externos.',
      'Ajusto mis hábitos y conductas basándome en lo que aprendo de mis propias experiencias.',
    ],
  },
  {
    key: 'ocio',
    number: 7,
    label: 'Ocio',
    questions: [
      'Reservo espacios específicos en mi semana para desconectarme de las obligaciones y descansar.',
      'Participo en pasatiempos, videojuegos o actividades recreativas que genuinamente disfruto.',
      'Consigo desconectarme mentalmente del trabajo o responsabilidades durante mi tiempo libre.',
      'Mi tiempo de descanso resulta reparador y me permite renovar energías.',
      'Evito que el entretenimiento pasivo desplace mis horas de sueño o metas prioritarias.',
    ],
  },
  {
    key: 'alimentacion',
    number: 8,
    label: 'Alimentación',
    questions: [
      'Planifico o preparo mis comidas considerando cantidades y calidad nutricional adecuada.',
      'Cumplo con mis requerimientos diarios de consumo de agua potable.',
      'Mantengo horarios regulares de comida sin saltarme tomas de forma desordenada.',
      'Modero el consumo de alimentos ultraprocesados, azúcares añadidos y comida rápida.',
      'Ajusto las porciones de mis alimentos en función de mis objetivos energéticos y de salud.',
    ],
  },
];

const ANSWER_OPTIONS = [
  { value: 0, label: 'No' },
  { value: 1, label: 'A veces' },
  { value: 2, label: 'Sí' },
];

const QUESTIONS_VIDEO_SRC = `${import.meta.env.BASE_URL}videos/explicacion-preguntas.mp4`;

/** Todas las preguntas empiezan sin responder (null): no se pueden saltar. */
function createInitialAnswers() {
  const initial = {};
  LIFE_WHEEL_QUESTIONS.forEach((section) => {
    initial[section.key] = section.questions.map(() => null);
  });
  return initial;
}

const isAnswered = (v) => v !== null && v !== undefined;

/**
 * Paso previo al cuestionario: reproduce solo el video de explicación.
 * Intenta arrancar con sonido; si el navegador lo bloquea, arranca en silencio
 * y avisa para que la persona active el audio.
 */
function ExplanationVideo({ onFinished }) {
  const videoRef = useRef(null);
  const [mutedFallback, setMutedFallback] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    const attempt = video.play();
    if (attempt?.catch) {
      attempt.catch(() => {
        // Autoplay con sonido bloqueado → reintenta en silencio
        video.muted = true;
        setMutedFallback(true);
        video.play().catch(() => {
          /* el usuario podrá darle play con los controles */
        });
      });
    }
  }, []);

  return (
    <div className="wheel-quiz__video">
      <video
        ref={videoRef}
        className="wheel-quiz__video-player"
        src={QUESTIONS_VIDEO_SRC}
        autoPlay
        playsInline
        controls
        controlsList="nodownload"
        preload="auto"
        onEnded={() => onFinished(true)}
        onError={() => onFinished(true)}
        onVolumeChange={(e) => e.currentTarget.muted === false && setMutedFallback(false)}
      >
        Tu navegador no puede reproducir este video.
      </video>
      {mutedFallback && (
        <p className="wheel-quiz__video-note">
          <Volume2 size={14} aria-hidden="true" /> El video empezó sin sonido. Usa los controles para activarlo.
        </p>
      )}
    </div>
  );
}

/**
 * mode="initial" (por defecto): cuestionario obligatorio al crear la cuenta; lo controla AvatarContext.
 * mode="final": la Rueda de la Vida final; se abre desde el perfil, se puede cancelar y repetir.
 */
export default function LifeWheelQuizModal({ mode = 'initial', open = false, onClose, onSubmit }) {
  const avatar = useAvatar();
  const isFinal = mode === 'final';
  const quizOpen = isFinal ? open : avatar.quizOpen;
  const quizMandatory = isFinal ? false : avatar.quizMandatory;
  const completeWheelQuiz = isFinal ? onSubmit : avatar.completeWheelQuiz;
  // El cuestionario inicial es obligatorio y se responde una sola vez: no se puede cerrar
  const closeWheelQuiz = isFinal ? () => onClose?.() : () => {};
  const [phase, setPhase] = useState('video'); // 'video' | 'questions'
  const [videoDone, setVideoDone] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState(createInitialAnswers);

  // Cada vez que se abre el cuestionario: primero el video, luego las preguntas desde cero
  useEffect(() => {
    if (quizOpen) {
      setPhase('video');
      setVideoDone(false);
      setStepIndex(0);
      setAnswers(createInitialAnswers());
    }
  }, [quizOpen]);

  const currentSection = LIFE_WHEEL_QUESTIONS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === LIFE_WHEEL_QUESTIONS.length - 1;

  const scoresByArea = useMemo(() => {
    const scores = {};
    LIFE_WHEEL_QUESTIONS.forEach((section) => {
      const vals = answers[section.key] || [];
      scores[section.key] = vals.reduce((acc, v) => acc + Number(v || 0), 0);
    });
    return scores;
  }, [answers]);

  // Un área está completa cuando sus 5 preguntas tienen respuesta
  const sectionComplete = useMemo(
    () => LIFE_WHEEL_QUESTIONS.map((sec) => (answers[sec.key] || []).every(isAnswered)),
    [answers],
  );
  // Primera área con preguntas pendientes: no se puede pasar más allá de ella
  const firstPending = sectionComplete.indexOf(false);
  const furthestAllowed = firstPending === -1 ? LIFE_WHEEL_QUESTIONS.length - 1 : firstPending;
  const currentComplete = sectionComplete[stepIndex];
  const allComplete = firstPending === -1;
  const pendingInCurrent = (answers[currentSection.key] || []).filter((v) => !isAnswered(v)).length;

  if (!quizOpen) return null;

  const setQuestionAnswer = (areaKey, qIdx, points) => {
    setAnswers((prev) => {
      const nextArea = [...(prev[areaKey] || [null, null, null, null, null])];
      nextArea[qIdx] = points;
      return { ...prev, [areaKey]: nextArea };
    });
  };

  const toggleQuestion = (areaKey, qIdx) => {
    const current = answers[areaKey]?.[qIdx];
    setQuestionAnswer(areaKey, qIdx, current === 2 ? 0 : 2);
  };

  const handleFinish = () => {
    if (!allComplete) return;
    completeWheelQuiz(scoresByArea);
    setStepIndex(0);
  };

  const currentScore = scoresByArea[currentSection.key] ?? 0;

  /* ---------- Paso 1: video de explicación ---------- */
  if (phase === 'video') {
    const canContinue = !quizMandatory || videoDone;
    return (
      <Modal
        open={quizOpen}
        onClose={closeWheelQuiz}
        dismissible={!quizMandatory}
        title="Antes de empezar"
        footer={
          <>
            {!quizMandatory && (
              <Button type="button" variant="ghost" onClick={closeWheelQuiz}>
                Cancelar
              </Button>
            )}
            <Button
              type="button"
              variant="primary"
              icon={Play}
              disabled={!canContinue}
              onClick={() => setPhase('questions')}
            >
              {canContinue ? 'Comenzar preguntas' : 'Mira el video para continuar'}
            </Button>
          </>
        }
      >
        <div className="wheel-quiz">
          <p className="wheel-quiz__intro">
            Mira este video corto: te explica cómo responder el diagnóstico de tu <strong>Rueda de la Vida</strong>.
          </p>
          <ExplanationVideo onFinished={setVideoDone} />
        </div>
      </Modal>
    );
  }

  /* ---------- Paso 2: preguntas detonadoras ---------- */
  return (
    <Modal
      open={quizOpen}
      onClose={closeWheelQuiz}
      dismissible={!quizMandatory}
      title={isFinal ? 'Rueda de la Vida final' : 'Diagnóstico · Rueda de la Vida'}
      footer={
        <>
          {!isFirst ? (
            <Button
              type="button"
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            >
              Anterior
            </Button>
          ) : (
            !quizMandatory && (
              <Button type="button" variant="ghost" onClick={closeWheelQuiz}>
                Cancelar
              </Button>
            )
          )}

          {!isLast ? (
            <Button
              type="button"
              variant="primary"
              icon={ArrowRight}
              disabled={!currentComplete}
              onClick={() => setStepIndex((i) => Math.min(LIFE_WHEEL_QUESTIONS.length - 1, i + 1))}
            >
              Siguiente ({stepIndex + 1}/{LIFE_WHEEL_QUESTIONS.length})
            </Button>
          ) : (
            <Button type="button" variant="primary" icon={Sparkles} disabled={!allComplete} onClick={handleFinish}>
              {isFinal ? 'Guardar rueda final' : 'Guardar mi Rueda'}
            </Button>
          )}
        </>
      }
    >
      <div className="wheel-quiz">
        <p className="wheel-quiz__intro">
          Responde <strong>todas</strong> las afirmaciones de cada área para calcular tu <strong>Rueda de la Vida</strong>{' '}
          {isFinal ? 'final' : 'inicial'} (de 0 a 10 puntos por categoría).
          {isFinal && ' Al guardarla la compararemos con tu rueda inicial.'}
        </p>

        {/* Navegador de las 8 áreas: solo se puede ir a áreas ya completadas o a la actual */}
        <div className="wheel-quiz__tabs" role="tablist" aria-label="Áreas de la Rueda de la Vida">
          {LIFE_WHEEL_QUESTIONS.map((sec, idx) => {
            const active = idx === stepIndex;
            const locked = idx > furthestAllowed;
            const score = scoresByArea[sec.key] ?? 0;
            return (
              <button
                key={sec.key}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={locked}
                className={`wheel-quiz__tab ${active ? 'is-active' : ''} ${sectionComplete[idx] ? 'has-score' : ''} ${
                  locked ? 'is-locked' : ''
                }`}
                onClick={() => setStepIndex(idx)}
              >
                <span className="wheel-quiz__tab-num">{sec.number}.</span>
                <span className="wheel-quiz__tab-label">{sec.label}</span>
                <span className="wheel-quiz__tab-score">{sectionComplete[idx] ? `${score}/10` : '–'}</span>
              </button>
            );
          })}
        </div>

        {/* Cabecera del área actual */}
        <div className="wheel-quiz__section-head">
          <div>
            <span className="label-mono">
              Área {currentSection.number} de {LIFE_WHEEL_QUESTIONS.length}
            </span>
            <h3 className="wheel-quiz__section-title">
              {currentSection.number}. {currentSection.label}
            </h3>
          </div>
          <Chip color={currentScore >= 7 ? 'green' : currentScore >= 4 ? 'amber' : 'coral'}>
            <ClipboardCheck size={14} /> {currentScore} / 10 pts
          </Chip>
        </div>

        {/* Lista de las 5 preguntas del área actual */}
        <ul className="wheel-quiz__list">
          {currentSection.questions.map((question, qIdx) => {
            const raw = answers[currentSection.key]?.[qIdx];
            const value = isAnswered(raw) ? raw : null;
            const isChecked = value === 2;
            const isPartial = value === 1;

            return (
              <li
                key={qIdx}
                className={`wheel-quiz__item ${isChecked ? 'is-yes' : ''} ${isPartial ? 'is-partial' : ''}`}
              >
                <div
                  className="wheel-quiz__item-main"
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleQuestion(currentSection.key, qIdx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleQuestion(currentSection.key, qIdx);
                    }
                  }}
                >
                  <span className={`wheel-quiz__check ${value > 0 ? 'is-on' : ''}`} aria-hidden="true">
                    {value > 0 && <Check size={14} />}
                  </span>
                  <p className="wheel-quiz__question">{question}</p>
                </div>

                <div className="wheel-quiz__options" role="group" aria-label={`Respuesta para pregunta ${qIdx + 1}`}>
                  {ANSWER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`wheel-quiz__opt ${value === opt.value ? 'is-selected' : ''}`}
                      onClick={() => setQuestionAnswer(currentSection.key, qIdx, opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>

        {!currentComplete && (
          <p className="wheel-quiz__pending" role="status">
            Te falta{pendingInCurrent === 1 ? '' : 'n'} {pendingInCurrent} pregunta{pendingInCurrent === 1 ? '' : 's'} por responder
            en esta área.
          </p>
        )}

        {/* Resumen rápido en el último paso */}
        {isLast && (
          <div className="wheel-quiz__summary">
            <div className="wheel-quiz__summary-head">
              <CheckCircle2 size={16} />
              <span>Resumen de tu Rueda de la Vida</span>
            </div>
            <div className="wheel-quiz__summary-grid">
              {LIFE_WHEEL_QUESTIONS.map((sec, idx) => (
                <div key={sec.key} className="wheel-quiz__summary-item">
                  <span>{sec.label}</span>
                  <strong>{sectionComplete[idx] ? `${scoresByArea[sec.key]}/10` : 'Pendiente'}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
