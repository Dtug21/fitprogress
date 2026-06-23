import { Goal, MuscleGroup, Equipment, UserProfile, RoutineExercise, Routine } from '../types';
import { exercises } from '../data/exercises';

// ─── Parámetros por objetivo (Schoenfeld 2017, Krieger, NSCA/ACSM 2026) ─────

export interface TrainingParams {
  sets: number;
  reps: string;
  rest_seconds: number;
  rir: number;
  label: string;
  rationale: string;
}

const MAX_EXERCISES_BY_LEVEL: Record<UserProfile['experience_level'], number> = {
  beginner: 5,
  intermediate: 7,
  advanced: 8,
};

const MAX_SETS_PER_SESSION = 24;

export function getTrainingParams(goals: Goal[], level: UserProfile['experience_level']): TrainingParams {
  const effective = getEffectiveGoals(goals);
  const primary = effective[0];

  const byGoal: Record<string, TrainingParams> = {
    fat_loss: {
      sets: level === 'beginner' ? 3 : 3,
      reps: '12-15',
      rest_seconds: 60,
      rir: 2,
      label: 'Pérdida de grasa — densidad metabólica',
      rationale:
        'Reps moderadas-altas (12-15) con descanso corto (60s) maximizan el gasto calórico y el EPOC. RIR 2 preserva músculo en déficit (ACSM 2026).',
    },
    muscle_gain: {
      sets: level === 'beginner' ? 3 : level === 'intermediate' ? 4 : 4,
      reps: '8-12',
      rest_seconds: 90,
      rir: 2,
      label: 'Hipertrofia — zona de acumulación',
      rationale:
        '8-12 reps optimizan estímulo mecánico y metabólico para hipertrofia (Schoenfeld 2017). ~10 series/semana por grupo como referencia (umbrella review PMC9302196).',
    },
    strength: {
      sets: level === 'beginner' ? 3 : 4,
      reps: '3-6',
      rest_seconds: 180,
      rir: 1,
      label: 'Fuerza máxima — adaptación neural',
      rationale:
        'Cargas altas con reps bajas y descanso ≥3 min restauran ATP-PCr. Prioriza compuestos y técnica antes de volumen accesorio.',
    },
    endurance: {
      sets: 3,
      reps: '15-20',
      rest_seconds: 45,
      rir: 3,
      label: 'Resistencia muscular — capacidad oxidativa',
      rationale:
        'Reps altas con descanso corto mejoran tolerancia al lactato. RIR más alto para sostener adherencia.',
    },
    health: {
      sets: 3,
      reps: '10-15',
      rest_seconds: 75,
      rir: 3,
      label: 'Salud general — mantenimiento funcional',
      rationale:
        'Volumen moderado con RIR alto. Prioriza adherencia y movimientos funcionales (guías ACSM).',
    },
    mixed: {
      sets: level === 'beginner' ? 3 : 4,
      reps: '8-12',
      rest_seconds: 90,
      rir: 2,
      label: 'Balance — fuerza + hipertrofia',
      rationale:
        'Base 8-12 con compuestos primero. Adecuado para atletas recreativos que buscan fuerza y masa sin especialización extrema.',
    },
  };

  const params = byGoal[primary] ?? byGoal.mixed;

  if (effective.includes('strength') && effective.includes('muscle_gain')) {
    return { ...params, reps: '6-10', rest_seconds: 120, label: 'Fuerza-Hipertrofia (Power Building)' };
  }
  if (effective.includes('fat_loss') && effective.includes('muscle_gain')) {
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
  minDays?: number;
  maxDays?: number;
}

export const SPLIT_OPTIONS: SplitOption[] = [
  {
    id: 'full_body',
    label: 'Full Body',
    emoji: '⚡',
    muscles: ['chest', 'back', 'legs', 'shoulders', 'core'],
    desc: '1 ejercicio por grupo. Máxima frecuencia semanal con volumen controlado por sesión.',
    bestFor: ['fat_loss', 'health', 'mixed'],
    daysPerWeek: '2-3',
    minDays: 2,
    maxDays: 3,
  },
  {
    id: 'upper_lower',
    label: 'Tren superior',
    emoji: '💪',
    muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
    desc: 'Todos los músculos del tren superior. Compuestos primero, aislamiento después.',
    bestFor: ['muscle_gain', 'mixed'],
    daysPerWeek: '2-4',
    minDays: 2,
    maxDays: 4,
  },
  {
    id: 'push',
    label: 'Push (Empuje)',
    emoji: '🔝',
    muscles: ['chest', 'shoulders', 'triceps'],
    desc: 'Pecho + hombros + tríceps. Ideal en splits de 4-6 días.',
    bestFor: ['muscle_gain', 'strength'],
    daysPerWeek: '1-2',
    minDays: 4,
    maxDays: 6,
  },
  {
    id: 'pull',
    label: 'Pull (Jale)',
    emoji: '↩️',
    muscles: ['back', 'biceps'],
    desc: 'Espalda + bíceps. Complementa un día Push en la misma semana.',
    bestFor: ['muscle_gain', 'strength'],
    daysPerWeek: '1-2',
    minDays: 4,
    maxDays: 6,
  },
  {
    id: 'legs',
    label: 'Piernas',
    emoji: '🦵',
    muscles: ['quads', 'hamstrings', 'glutes', 'calves'],
    desc: 'Cuádriceps, isquios, glúteos y gemelos. Sesión dedicada con descansos largos en compuestos.',
    bestFor: ['muscle_gain', 'fat_loss', 'strength'],
    daysPerWeek: '1-2',
    minDays: 3,
    maxDays: 6,
  },
  {
    id: 'push_pull',
    label: 'Push + Pull',
    emoji: '🔄',
    muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
    desc: 'Empuje y jale en una sesión. Eficiente con 4 días disponibles por semana.',
    bestFor: ['mixed', 'muscle_gain'],
    daysPerWeek: '2',
    minDays: 4,
    maxDays: 5,
  },
  {
    id: 'chest_triceps',
    label: 'Pecho + Tríceps',
    emoji: '🏋️',
    muscles: ['chest', 'triceps'],
    desc: 'Sinergistas naturales. Para programas tipo bro-split de 5-6 días.',
    bestFor: ['muscle_gain', 'strength'],
    daysPerWeek: '1',
    minDays: 5,
    maxDays: 6,
  },
  {
    id: 'back_biceps',
    label: 'Espalda + Bíceps',
    emoji: '🦾',
    muscles: ['back', 'biceps'],
    desc: 'Sinergistas naturales. Complemento de un día pecho/tríceps.',
    bestFor: ['muscle_gain', 'strength'],
    daysPerWeek: '1',
    minDays: 5,
    maxDays: 6,
  },
  {
    id: 'shoulders_arms',
    label: 'Hombros + Brazos',
    emoji: '💥',
    muscles: ['shoulders', 'biceps', 'triceps'],
    desc: 'Sesión accesoria. Solo si entrenas 5+ días y ya cubres compuestos.',
    bestFor: ['muscle_gain'],
    daysPerWeek: '1',
    minDays: 5,
    maxDays: 6,
  },
  {
    id: 'core_cardio',
    label: 'Core + Cardio',
    emoji: '🔥',
    muscles: ['core', 'cardio'],
    desc: 'Core y cardio funcional. Sesión activa de bajo impacto articular.',
    bestFor: ['fat_loss', 'health', 'endurance'],
    daysPerWeek: '1-2',
    minDays: 2,
    maxDays: 6,
  },
];

// ─── Generador de rutina automática ──────────────────────────────────────────

export interface GeneratedRoutine {
  name: string;
  exercises: RoutineExercise[];
  params: TrainingParams;
  rationale: string;
}

function exercisesPerMuscle(
  split: SplitOption,
  goals: Goal[],
  level: UserProfile['experience_level'],
): number {
  const effective = getEffectiveGoals(goals);
  if (split.id === 'full_body' || split.id === 'core_cardio') return 1;
  if (effective.includes('strength')) return 1;
  if (effective.includes('fat_loss') || effective.includes('health')) return 1;
  if (level === 'beginner') return 1;
  if (split.muscles.length <= 2) return 2;
  return 1;
}

export function scoreSplit(
  split: SplitOption,
  profile: Pick<UserProfile, 'goals' | 'days_per_week' | 'experience_level'>,
): number {
  const goals = getEffectiveGoals(profile.goals ?? []);
  const days = profile.days_per_week ?? 4;
  let score = 0;

  for (const g of goals) {
    if (split.bestFor.includes(g)) score += 12;
  }

  if (split.minDays != null && days < split.minDays) score -= 20;
  if (split.maxDays != null && days > split.maxDays) score -= 8;

  if (split.id === 'full_body' && days <= 3) score += 8;
  if (split.id === 'push_pull' && days >= 4 && days <= 5) score += 10;
  if (split.id === 'upper_lower' && days >= 3 && days <= 4) score += 6;
  if (split.id === 'legs' && days >= 3) score += 4;
  if (['push', 'pull'].includes(split.id) && days >= 4) score += 3;
  if (['chest_triceps', 'back_biceps', 'shoulders_arms'].includes(split.id) && days < 5) score -= 15;

  if (profile.experience_level === 'beginner' && split.id === 'full_body') score += 6;
  if (profile.experience_level === 'advanced' && ['push', 'pull', 'legs'].includes(split.id)) score += 4;

  return score;
}

export function generateRoutine(
  split: SplitOption,
  mode: 'home' | 'gym',
  goals: Goal[],
  level: UserProfile['experience_level'],
  equipment: Equipment[],
  volumeFactor = 1,
): GeneratedRoutine {
  const effective = getEffectiveGoals(goals);
  const params = getTrainingParams(effective, level);
  const clampedFactor = Math.max(0.5, Math.min(1, volumeFactor));
  const maxExercises = Math.max(
    3,
    Math.round(MAX_EXERCISES_BY_LEVEL[level] * clampedFactor),
  );
  const exPerMuscle = exercisesPerMuscle(split, effective, level);

  const eligible = exercises.filter((ex) => {
    const modeOk = ex.mode === mode || ex.mode === 'both';
    const muscleOk = split.muscles.includes(ex.muscle_group as MuscleGroup);
    const equipOk =
      mode === 'gym' ||
      ex.equipment_required.every((eq) => equipment.includes(eq));
    return modeOk && muscleOk && equipOk;
  });

  const levelDiff: Record<string, number> = { beginner: 2, intermediate: 3, advanced: 4 };
  const targetDiff = levelDiff[level] ?? 3;

  const sorted = [...eligible].sort((a, b) => {
    if (a.exercise_type === 'compound' && b.exercise_type !== 'compound') return -1;
    if (b.exercise_type === 'compound' && a.exercise_type !== 'compound') return 1;
    return Math.abs(a.difficulty - targetDiff) - Math.abs(b.difficulty - targetDiff);
  });

  // Selección round-robin balanceada: cada músculo del split recibe su 1er
  // ejercicio (compuesto) antes de que cualquiera reciba el 2º. Como dentro de
  // cada músculo el orden es compuesto-primero, la sesión queda con los
  // compuestos al inicio y los aislamientos después, sin sobrecargar un músculo.
  const byMuscle: Record<string, typeof eligible> = {};
  for (const ex of sorted) {
    (byMuscle[ex.muscle_group] ??= []).push(ex);
  }
  const muscleOrder = split.muscles.filter((m) => byMuscle[m]?.length);

  const selected: typeof eligible = [];
  for (let round = 0; round < exPerMuscle && selected.length < maxExercises; round++) {
    for (const m of muscleOrder) {
      if (selected.length >= maxExercises) break;
      const pick = byMuscle[m][round];
      if (pick) selected.push(pick);
    }
  }

  const setsAdjusted = Math.max(
    2,
    Math.round(
      (split.id === 'full_body' ? Math.max(2, params.sets - 1) : params.sets) * clampedFactor,
    ),
  );
  const strengthGoal = effective.includes('strength');

  let routineExercises: RoutineExercise[] = selected.map((ex, idx) => ({
    exercise_id: ex.id,
    order: idx,
    target_sets: ex.exercise_type === 'compound' && !strengthGoal
      ? setsAdjusted
      : strengthGoal && ex.exercise_type === 'compound'
        ? setsAdjusted + 1
        : setsAdjusted,
    target_reps: ex.exercise_type === 'compound' && strengthGoal
      ? '4-6'
      : params.reps,
    rest_seconds: ex.exercise_type === 'compound'
      ? params.rest_seconds + (strengthGoal ? 30 : 15)
      : params.rest_seconds,
  }));

  const maxSetsBudget = Math.round(MAX_SETS_PER_SESSION * clampedFactor);
  let totalSets = routineExercises.reduce((t, re) => t + re.target_sets, 0);
  while (totalSets > maxSetsBudget && routineExercises.length > 0) {
    const last = routineExercises[routineExercises.length - 1];
    if (last.target_sets > 2) {
      last.target_sets -= 1;
    } else {
      routineExercises = routineExercises.slice(0, -1);
    }
    totalSets = routineExercises.reduce((t, re) => t + re.target_sets, 0);
  }

  const goalLabels: Record<string, string> = {
    fat_loss: 'pérdida de grasa', muscle_gain: 'hipertrofia', strength: 'fuerza',
    endurance: 'resistencia', health: 'salud', mixed: 'balance general',
  };

  const compounds = selected.filter((e) => e.exercise_type === 'compound').length;
  const rationale = `Sesión ${split.label} para ${goalLabels[effective[0]] ?? 'balance'} (${level}). ` +
    `${compounds} compuestos primero, ${routineExercises.length} ejercicios y ${totalSets} series totales. ` +
    params.rationale;

  return {
    name: `${split.label} — ${goalLabels[effective[0]] ?? 'Balance'}`,
    exercises: routineExercises,
    params,
    rationale,
  };
}

export function getEffectiveGoals(goals: Goal[]): Goal[] {
  return goals.length > 0 ? goals : ['mixed'];
}

export function isSplitRecommended(split: SplitOption, goals: Goal[]): boolean {
  return scoreSplit(split, { goals, days_per_week: 4, experience_level: 'intermediate' }) > 0
    && split.bestFor.some((g) => getEffectiveGoals(goals).includes(g));
}

export function getRecommendedSplits(
  profile: Pick<UserProfile, 'goals' | 'days_per_week' | 'experience_level'>,
  limit = 3,
): SplitOption[] {
  return [...SPLIT_OPTIONS]
    .map((split) => ({ split, score: scoreSplit(split, profile) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.split);
}

export function buildGeneratedRoutine(
  split: SplitOption,
  profile: Pick<UserProfile, 'mode' | 'goals' | 'experience_level' | 'home_equipment'>,
  id?: string,
  volumeFactor = 1,
): Routine {
  const goals = getEffectiveGoals(profile.goals ?? []);
  const generated = generateRoutine(
    split,
    profile.mode,
    goals,
    profile.experience_level,
    profile.home_equipment,
    volumeFactor,
  );
  const now = new Date().toISOString();
  return {
    id: id ?? `generated_${split.id}_${Date.now()}`,
    name: generated.name,
    day_of_week: [],
    mode: profile.mode,
    exercises: generated.exercises,
    created_at: now,
    updated_at: now,
    source: 'algorithm',
  };
}

export function getRoutineSource(routine: Routine): NonNullable<Routine['source']> {
  if (routine.source) return routine.source;
  if (routine.id.startsWith('default_')) return 'default';
  return 'default';
}
