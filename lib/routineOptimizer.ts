import { Goal, MuscleGroup, Equipment, UserProfile, RoutineExercise } from '../types';
import { exercises } from '../data/exercises';

// ─── Parámetros por objetivo (basados en meta-análisis Schoenfeld, Krieger, NSCA) ─────

export interface TrainingParams {
  sets: number;
  reps: string;
  rest_seconds: number;
  rir: number;
  label: string;
  rationale: string;
}

export function getTrainingParams(goals: Goal[], level: UserProfile['experience_level']): TrainingParams {
  const primary = goals[0] ?? 'mixed';

  const byGoal: Record<string, TrainingParams> = {
    fat_loss: {
      sets: level === 'beginner' ? 3 : 4,
      reps: '12-15',
      rest_seconds: 60,
      rir: 2,
      label: 'Pérdida de grasa — densidad metabólica',
      rationale:
        'Reps moderadas-altas (12-15) con descanso corto (60s) maximizan el gasto calórico durante la sesión y el EPOC post-entrenamiento. Mantener RIR 2 para preservar músculo en déficit.',
    },
    muscle_gain: {
      sets: level === 'beginner' ? 3 : level === 'intermediate' ? 4 : 5,
      reps: '8-12',
      rest_seconds: 90,
      rir: 2,
      label: 'Hipertrofia — zona de acumulación',
      rationale:
        'El rango 8-12 genera el mayor estímulo mecánico y metabólico para hipertrofia (Schoenfeld 2017). Descanso de 90s permite recuperación parcial para mantener volumen sin perder tensión.',
    },
    strength: {
      sets: level === 'beginner' ? 3 : level === 'intermediate' ? 4 : 5,
      reps: '3-6',
      rest_seconds: 180,
      rir: 1,
      label: 'Fuerza máxima — adaptación neural',
      rationale:
        'Cargas altas (85-95% 1RM) con reps bajas reclutan unidades motoras de alto umbral y mejoran la coordinación intermuscular. Descanso largo (3min) es necesario para restaurar ATP-PCr.',
    },
    endurance: {
      sets: 3,
      reps: '15-20',
      rest_seconds: 45,
      rir: 3,
      label: 'Resistencia muscular — capacidad oxidativa',
      rationale:
        'Reps altas con descanso muy corto aumentan la capacidad buffer de lactato y la densidad mitocondrial. Ideal para mejorar resistencia muscular local.',
    },
    health: {
      sets: 3,
      reps: '10-15',
      rest_seconds: 75,
      rir: 3,
      label: 'Salud general — mantenimiento funcional',
      rationale:
        'Volumen moderado con RIR alto. Prioriza la adherencia y la recuperación. Basado en guías ACSM para salud cardiovascular y musculoesqueletal.',
    },
    mixed: {
      sets: level === 'beginner' ? 3 : 4,
      reps: '8-12',
      rest_seconds: 90,
      rir: 2,
      label: 'Balance — fuerza + hipertrofia',
      rationale:
        'Enfoque ondulatorio: rango 8-12 como base con bloques de fuerza (5-6 reps) en compuestos principales. Maximiza adaptaciones simultáneas para un atleta recreativo.',
    },
  };

  const params = byGoal[primary] ?? byGoal.mixed;

  // Si hay múltiples objetivos, ajusta ligeramente
  if (goals.includes('strength') && goals.includes('muscle_gain')) {
    return { ...params, reps: '6-10', rest_seconds: 120, label: 'Fuerza-Hipertrofia (Power Building)' };
  }
  if (goals.includes('fat_loss') && goals.includes('muscle_gain')) {
    return { ...params, reps: '10-15', rest_seconds: 75, label: 'Recomposición corporal' };
  }

  return params;
}

// ─── Splits disponibles ───────────────────────────────────────────────────────

export type SplitType =
  | 'full_body'
  | 'upper_lower'
  | 'push'
  | 'pull'
  | 'legs'
  | 'push_pull'
  | 'chest_triceps'
  | 'back_biceps'
  | 'shoulders_arms'
  | 'core_cardio';

export interface SplitOption {
  id: SplitType;
  label: string;
  emoji: string;
  muscles: MuscleGroup[];
  desc: string;
  bestFor: Goal[];
  daysPerWeek?: string;
}

export const SPLIT_OPTIONS: SplitOption[] = [
  {
    id: 'full_body',
    label: 'Full Body',
    emoji: '⚡',
    muscles: ['chest', 'back', 'legs', 'shoulders', 'core'],
    desc: '1 o 2 ejercicios por grupo muscular. Máxima frecuencia de estímulo por semana.',
    bestFor: ['fat_loss', 'health', 'mixed'],
    daysPerWeek: '2-3',
  },
  {
    id: 'upper_lower',
    label: 'Tren superior',
    emoji: '💪',
    muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
    desc: 'Todos los músculos del tren superior en una sola sesión.',
    bestFor: ['muscle_gain', 'mixed'],
    daysPerWeek: '2-3',
  },
  {
    id: 'push',
    label: 'Push (Empuje)',
    emoji: '🔝',
    muscles: ['chest', 'shoulders', 'triceps'],
    desc: 'Pecho + hombros + tríceps. Todos los movimientos de empuje.',
    bestFor: ['muscle_gain', 'strength'],
    daysPerWeek: '1-2',
  },
  {
    id: 'pull',
    label: 'Pull (Jale)',
    emoji: '↩️',
    muscles: ['back', 'biceps'],
    desc: 'Espalda + bíceps. Todos los movimientos de jale.',
    bestFor: ['muscle_gain', 'strength'],
    daysPerWeek: '1-2',
  },
  {
    id: 'legs',
    label: 'Piernas',
    emoji: '🦵',
    muscles: ['quads', 'hamstrings', 'glutes', 'calves'],
    desc: 'Cuádriceps + isquiotibiales + glúteos + gemelos.',
    bestFor: ['muscle_gain', 'fat_loss', 'strength'],
    daysPerWeek: '1-2',
  },
  {
    id: 'push_pull',
    label: 'Push + Pull',
    emoji: '🔄',
    muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
    desc: 'Empuje y jale en la misma sesión. Eficiente para 4 días.',
    bestFor: ['mixed', 'muscle_gain'],
    daysPerWeek: '2',
  },
  {
    id: 'chest_triceps',
    label: 'Pecho + Tríceps',
    emoji: '🏋️',
    muscles: ['chest', 'triceps'],
    desc: 'Sinergistas naturales. El tríceps ya trabaja en los compuestos de pecho.',
    bestFor: ['muscle_gain', 'strength'],
    daysPerWeek: '1-2',
  },
  {
    id: 'back_biceps',
    label: 'Espalda + Bíceps',
    emoji: '🦾',
    muscles: ['back', 'biceps'],
    desc: 'Sinergistas naturales. El bíceps ya trabaja en los jalones y remos.',
    bestFor: ['muscle_gain', 'strength'],
    daysPerWeek: '1-2',
  },
  {
    id: 'shoulders_arms',
    label: 'Hombros + Brazos',
    emoji: '💥',
    muscles: ['shoulders', 'biceps', 'triceps'],
    desc: 'Sesión enfocada en músculos pequeños. Ideal como día extra.',
    bestFor: ['muscle_gain'],
    daysPerWeek: '1',
  },
  {
    id: 'core_cardio',
    label: 'Core + Cardio',
    emoji: '🔥',
    muscles: ['core', 'cardio'],
    desc: 'Core, abdominales y ejercicios cardiovasculares funcionales.',
    bestFor: ['fat_loss', 'health', 'endurance'],
    daysPerWeek: '1-2',
  },
];

// ─── Generador de rutina automática ──────────────────────────────────────────

export interface GeneratedRoutine {
  name: string;
  exercises: RoutineExercise[];
  params: TrainingParams;
  rationale: string;
}

export function generateRoutine(
  split: SplitOption,
  mode: 'home' | 'gym',
  goals: Goal[],
  level: UserProfile['experience_level'],
  equipment: Equipment[]
): GeneratedRoutine {
  const params = getTrainingParams(goals, level);

  // Filtrar ejercicios por modo y equipamiento
  const eligible = exercises.filter((ex) => {
    const modeOk = ex.mode === mode || ex.mode === 'both';
    const muscleOk = split.muscles.includes(ex.muscle_group as MuscleGroup);
    const equipOk =
      mode === 'gym' ||
      ex.equipment_required.every((eq) => equipment.includes(eq));
    return modeOk && muscleOk && equipOk;
  });

  // Ordenar: compuestos primero, luego por dificultad apropiada para el nivel
  const levelDiff: Record<string, number> = { beginner: 2, intermediate: 3, advanced: 4 };
  const targetDiff = levelDiff[level] ?? 3;

  const sorted = [...eligible].sort((a, b) => {
    if (a.exercise_type === 'compound' && b.exercise_type !== 'compound') return -1;
    if (b.exercise_type === 'compound' && a.exercise_type !== 'compound') return 1;
    return Math.abs(a.difficulty - targetDiff) - Math.abs(b.difficulty - targetDiff);
  });

  // Cuántos ejercicios por grupo muscular
  const exPerMuscle = goals.includes('fat_loss') || split.id === 'full_body'
    ? 1 : goals.includes('muscle_gain') ? 3 : 2;

  // Seleccionar ejercicios: max exPerMuscle por grupo, evitar duplicar músculos secundarios excesivamente
  const selected: typeof eligible = [];
  const muscleCount: Record<string, number> = {};

  for (const ex of sorted) {
    const mg = ex.muscle_group;
    muscleCount[mg] = (muscleCount[mg] ?? 0);
    if (muscleCount[mg] < exPerMuscle) {
      selected.push(ex);
      muscleCount[mg]++;
    }
    if (selected.length >= 8) break;
  }

  // Ajustar sets para Full Body (menos volumen por músculo)
  const setsAdjusted = split.id === 'full_body' ? Math.max(2, params.sets - 1) : params.sets;

  // Compuestos reciben 1 set extra
  const routineExercises: RoutineExercise[] = selected.map((ex, idx) => ({
    exercise_id: ex.id,
    order: idx,
    target_sets: ex.exercise_type === 'compound' ? setsAdjusted + 1 : setsAdjusted,
    target_reps: ex.exercise_type === 'compound' && goals.includes('strength')
      ? '4-6'
      : params.reps,
    rest_seconds: ex.exercise_type === 'compound'
      ? params.rest_seconds + 30
      : params.rest_seconds,
  }));

  const goalLabels: Record<string, string> = {
    fat_loss: 'pérdida de grasa', muscle_gain: 'hipertrofia', strength: 'fuerza',
    endurance: 'resistencia', health: 'salud', mixed: 'balance general',
  };

  const rationale = `Rutina generada para ${goalLabels[goals[0]] ?? 'balance'} en nivel ${level === 'beginner' ? 'principiante' : level === 'intermediate' ? 'intermedio' : 'avanzado'}. ` +
    `${selected.filter((e) => e.exercise_type === 'compound').length} ejercicios compuestos primero para maximizar la activación hormonal, ` +
    `seguidos de aislamientos. ${params.rationale}`;

  return {
    name: `${split.label} — ${goalLabels[goals[0]] ?? 'Balance'}`,
    exercises: routineExercises,
    params,
    rationale,
  };
}
