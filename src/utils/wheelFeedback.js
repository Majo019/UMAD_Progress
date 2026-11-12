/**
 * Retroalimentación de la Rueda de la Vida: compara la rueda inicial con la final
 * y la cruza con las tareas registradas en cada área.
 *
 * buildWheelFeedback({ areas, initial, final, tasks }) →
 *   { areas: [AreaFeedback], summary }
 *
 * AreaFeedback: { key, label, initial, final, delta, status, completed, pending,
 *                 noActivity, completionRate, headline, comments: [string] }
 */

const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

/** Estados de avance por área (umbral sobre la diferencia final − inicial). */
export const PROGRESS_STATUS = {
  'gran-avance': { label: 'Gran avance', color: 'green' },
  avance: { label: 'Avance', color: 'green' },
  estable: { label: 'Se mantuvo', color: 'amber' },
  retroceso: { label: 'Retroceso', color: 'coral' },
  'gran-retroceso': { label: 'Retroceso fuerte', color: 'coral' },
};

export function getProgressStatus(delta) {
  if (delta >= 1.5) return 'gran-avance';
  if (delta >= 0.5) return 'avance';
  if (delta > -0.5) return 'estable';
  if (delta > -1.5) return 'retroceso';
  return 'gran-retroceso';
}

/** Una sugerencia concreta por área para cuando necesita atención. */
const AREA_TIPS = {
  amigos: 'Agenda una salida o una llamada con alguien que extrañes esta semana.',
  trabajo: 'Divide tus entregas grandes en bloques de estudio cortos con el Pomodoro.',
  familia: 'Reserva un momento fijo a la semana para convivir con tu familia sin pantallas.',
  deporte: 'Empieza con 20 minutos de actividad física tres veces por semana.',
  economia: 'Registra tus gastos de una semana y define un pequeño monto de ahorro.',
  retrospeccion: 'Dedica 10 minutos al final del día a escribir qué aprendiste y cómo te sentiste.',
  ocio: 'Programa un rato libre para un pasatiempo que disfrutes, igual que programas tus tareas.',
  alimentacion: 'Planea tus comidas del día y procura no saltarte el desayuno.',
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function buildComments({ key, label, status, completed, pending, noActivity, final }) {
  const comments = [];
  const done = completed.length;
  const open = pending.length;

  // 1) Lectura del avance
  const headline = {
    'gran-avance': `¡Excelente! Tu área de ${label} creció de forma notable.`,
    avance: `Vas por buen camino en ${label}: tu puntuación subió.`,
    estable: `Tu área de ${label} se mantuvo prácticamente igual.`,
    retroceso: `Tu área de ${label} bajó un poco respecto al inicio.`,
    'gran-retroceso': `Tu área de ${label} bajó considerablemente; vale la pena darle prioridad.`,
  }[status];

  // 2) Relación con las actividades registradas
  const improved = status === 'gran-avance' || status === 'avance';
  if (noActivity) {
    comments.push(
      improved
        ? 'Mejoraste aunque no registraste actividades en esta área. Regístralas para que tu esfuerzo también se refleje en la app.'
        : 'No registraste ninguna actividad en esta área durante el periodo. Empieza con una tarea tranquila para retomarla.',
    );
  } else if (improved) {
    comments.push(
      `Completaste ${plural(done, 'tarea', 'tareas')} en esta área${open ? ` y te ${open === 1 ? 'queda' : 'quedan'} ${plural(open, 'pendiente', 'pendientes')}` : ''}. Tu constancia se nota.`,
    );
  } else if (done === 0) {
    comments.push(
      `Registraste ${plural(open, 'tarea', 'tareas')} pero no completaste ninguna. Intenta con tareas más pequeñas y alcanzables.`,
    );
  } else if (open > done) {
    comments.push(
      `Completaste ${plural(done, 'tarea', 'tareas')}, pero ${open === 1 ? 'quedó' : 'quedaron'} ${plural(open, 'pendiente', 'pendientes')}. Termina lo pendiente antes de agregar más.`,
    );
  } else {
    comments.push(
      `Completaste ${plural(done, 'tarea', 'tareas')}${open ? ` y ${open === 1 ? 'quedó' : 'quedaron'} ${plural(open, 'pendiente', 'pendientes')}` : ''}. Aumenta la frecuencia o la dificultad para ver un cambio mayor.`,
    );
  }

  // 3) Siguiente paso
  if (improved && final >= 8) {
    comments.push('Mantén el ritmo: esta área ya es una de tus fortalezas.');
  } else if (!improved || final < 5) {
    comments.push(`Sugerencia: ${AREA_TIPS[key] ?? 'Agrega una tarea pequeña en esta área cada semana.'}`);
  }

  return { headline, comments };
}

export function buildWheelFeedback({ areas, initial = [], final = [], tasks = [] }) {
  const valueOf = (list, key) => round1(list.find((a) => a.key === key)?.value);

  const rows = areas.map(({ key, label }) => {
    const areaTasks = tasks.filter((t) => t.area === key);
    const completed = areaTasks.filter((t) => t.completed);
    const pending = areaTasks.filter((t) => !t.completed);
    const start = valueOf(initial, key);
    const end = valueOf(final, key);
    const delta = round1(end - start);
    const status = getProgressStatus(delta);
    const noActivity = areaTasks.length === 0;
    const row = {
      key,
      label,
      initial: start,
      final: end,
      delta,
      status,
      completed,
      pending,
      noActivity,
      completionRate: areaTasks.length ? completed.length / areaTasks.length : 0,
    };
    return { ...row, ...buildComments(row) };
  });

  const avg = (key) => round1(rows.reduce((s, r) => s + r[key], 0) / (rows.length || 1));
  const byDelta = [...rows].sort((a, b) => b.delta - a.delta);

  return {
    areas: rows,
    summary: {
      averageInitial: avg('initial'),
      averageFinal: avg('final'),
      averageDelta: round1(avg('final') - avg('initial')),
      completedCount: rows.reduce((s, r) => s + r.completed.length, 0),
      pendingCount: rows.reduce((s, r) => s + r.pending.length, 0),
      improved: rows.filter((r) => r.delta >= 0.5),
      declined: rows.filter((r) => r.delta <= -0.5),
      withoutActivity: rows.filter((r) => r.noActivity),
      best: byDelta[0]?.delta > 0 ? byDelta[0] : null,
      worst: byDelta[byDelta.length - 1]?.delta < 0 ? byDelta[byDelta.length - 1] : null,
    },
  };
}
