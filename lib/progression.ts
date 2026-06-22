/**
 * lib/progression.ts
 *
 * Motor de progresión de FitProgress — basado en evidencia científica 2025-2026.
 *
 * FUENTES:
 * - ACSM Position Stand 2026 (137 revisiones sistemáticas, 30,000+ participantes)
 * - Umbrella review volumen: ~10 series/semana/grupo muscular óptimo (PMC9302196)
 * - Huang et al. 2025: autorregulación RIR superior a % fijo de 1RM (PMC12336695)
 * - Epley (1985): 1RM = peso × (1 + reps/30), validada para rangos submáximos
 */

import { WorkoutSession, MuscleGroup, RIR, Exercise } from '../types';
import { getExerciseById } from '../data/exercises';

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

export type MuscleGroupClass = 'upper_body' | 'lower_body' | 'core';

export interface SetLog {
  reps: number;
  weight_kg: number;
  rir: RIR;
  completed: boolean;
}

export interface ExerciseSessionLog {
  date: string;
  exercise_id: string;
  sets: SetLog[];
}

export interface TargetRepRange {
  min: number;
  max: number;
}

export type ProgressionAction =
  | 'increase_weight'
  | 'maintain_high_effort'
  | 'maintain_more_reps'
  | 'deload';

export interface ProgressionSuggestion {
  action: ProgressionAction;
  new_weight_kg: number;
  message: string;
  reasoning: string;
}

export interface WeeklyVolumeEntry {
  muscle_group: MuscleGroup;
  completed_sets: number;
  target_sets: number;
  status: 'below' | 'on_target' | 'above';
  percent_of_target: number;
}

export interface DeloadCheckResult {
  shouldDeload: boolean;
  weeksSinceLastDeload: number;
  message: string;
  volumeFactor: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const HYPERTROPHY_WEEKLY_VOLUME_TARGET = 10;

export const WEIGHT_INCREMENTS_KG: Record<MuscleGroupClass, number> = {
  upper_body: 2.5,
  lower_body: 2.5,
  core: 0,
};

export const MUSCLE_GROUP_CLASS: Record<MuscleGroup, MuscleGroupClass> = {
  chest: 'upper_body',
  back: 'upper_body',
  shoulders: 'upper_body',
  biceps: 'upper_body',
  triceps: 'upper_body',
  legs: 'lower_body',
  quads: 'lower_body',
  hamstrings: 'lower_body',
  glutes: 'lower_body',
  calves: 'lower_body',
  core: 'core',
  cardio: 'lower_body',
  full_body: 'upper_body',
};

export const RIR_LABELS: Record<RIR, string> = {
  0: 'Al límite',
  1: 'Difícil',
  2: 'Moderado',
  3: 'Fácil',
  4: 'Muy fácil',
};

const RIR_THRESHOLD_FOR_PROGRESSION = 2;
const EXERCISE_DELOAD_FACTOR = 0.9;
const WEEKLY_DELOAD_VOLUME_FACTOR = 0.6;
export const DELOAD_FREQUENCY_WEEKS = { min: 4, max: 6 };

// ============================================================================
// ADAPTADORES — convierte tipos de la app al formato interno del motor
// ============================================================================

/** Convierte WorkoutSession[] en ExerciseSessionLog[] para un ejercicio concreto */
export function adaptSessionsToHistory(
  sessions: WorkoutSession[],
  exerciseId: string,
): ExerciseSessionLog[] {
  return sessions
    .filter((s) => s.sets.some((set) => set.exercise_id === exerciseId))
    .map((s) => ({
      date: s.date,
      exercise_id: exerciseId,
      sets: s.sets
        .filter((set) => set.exercise_id === exerciseId)
        .map((set) => ({
          reps: set.reps,
          weight_kg: set.weight_kg,
          rir: (set.rir ?? 2) as RIR, // retrocompat: sesiones sin RIR asumen 2 (moderado)
          completed: set.completed,
        })),
    }));
}

/** Parsea "8-12", "AMRAP", "10" → TargetRepRange */
export function parseRepRange(target: string): TargetRepRange {
  if (target === 'AMRAP') return { min: 1, max: 999 };
  if (target.includes('-')) {
    const [min, max] = target.split('-').map(Number);
    return { min, max };
  }
  const n = Number(target);
  return { min: n, max: n };
}

// ============================================================================
// 1. MOTOR DE DOBLE PROGRESIÓN CON RIR
// ============================================================================

/**
 * Determina el peso para la próxima sesión según el desempeño de la última.
 *
 * Lógica:
 * 1. Tope de reps con RIR ≥ 2 en todas las series → sube peso
 * 2. Tope de reps pero RIR < 2 (esfuerzo muy alto) → consolida, mismo peso
 * 3. Falló mínimo de reps 2 sesiones seguidas → deload -10%
 * 4. Default → mismo peso, busca más reps
 */
export function suggestNextWeight(
  exerciseHistory: ExerciseSessionLog[],
  targetRepRange: TargetRepRange,
  muscleGroup: MuscleGroup,
): ProgressionSuggestion {
  if (exerciseHistory.length === 0) {
    return {
      action: 'maintain_more_reps',
      new_weight_kg: 0,
      message: 'Primera vez con este ejercicio — elige un peso con el que puedas hacer las reps cómodamente.',
      reasoning: 'No history available.',
    };
  }

  const lastSession = exerciseHistory[exerciseHistory.length - 1];
  const completedSets = lastSession.sets.filter((s) => s.completed);

  if (completedSets.length === 0) {
    return {
      action: 'maintain_more_reps',
      new_weight_kg: lastSession.sets[0]?.weight_kg ?? 0,
      message: 'No se registraron series completas la última vez. Repetimos el peso.',
      reasoning: 'No completed sets in last session.',
    };
  }

  const currentWeight = completedSets[0].weight_kg;
  const muscleClass = MUSCLE_GROUP_CLASS[muscleGroup];
  const increment = WEIGHT_INCREMENTS_KG[muscleClass];

  const allSetsAtMaxReps = completedSets.every((s) => s.reps >= targetRepRange.max);
  const allSetsAtMaxRepsWithMargin = completedSets.every(
    (s) => s.reps >= targetRepRange.max && s.rir >= RIR_THRESHOLD_FOR_PROGRESSION,
  );
  const failedMinRepsThisSession = completedSets.some((s) => s.reps < targetRepRange.min);

  if (allSetsAtMaxRepsWithMargin && increment > 0) {
    const next = roundToNearestHalf(currentWeight + increment);
    return {
      action: 'increase_weight',
      new_weight_kg: next,
      message: `¡Subimos a ${next} kg! Llegaste con margen de sobra.`,
      reasoning: `All sets ≥${targetRepRange.max} reps with RIR ≥${RIR_THRESHOLD_FOR_PROGRESSION}.`,
    };
  }

  if (allSetsAtMaxReps && !allSetsAtMaxRepsWithMargin) {
    return {
      action: 'maintain_high_effort',
      new_weight_kg: currentWeight,
      message: 'Llegaste a las reps objetivo pero al límite. Repetimos el peso una sesión más.',
      reasoning: `All sets reached max reps but RIR <${RIR_THRESHOLD_FOR_PROGRESSION}.`,
    };
  }

  if (failedMinRepsThisSession && failedMinRepsInPreviousSession(exerciseHistory, targetRepRange)) {
    const deloadWeight = roundToNearestHalf(currentWeight * EXERCISE_DELOAD_FACTOR);
    return {
      action: 'deload',
      new_weight_kg: deloadWeight,
      message: `Bajamos a ${deloadWeight} kg para consolidar técnica y volver a progresar.`,
      reasoning: 'Failed minimum reps in two consecutive sessions.',
    };
  }

  return {
    action: 'maintain_more_reps',
    new_weight_kg: currentWeight,
    message: `Mismo peso (${currentWeight} kg). Busca llegar a ${targetRepRange.max} reps con buen margen.`,
    reasoning: 'No condition for weight change met.',
  };
}

function failedMinRepsInPreviousSession(
  exerciseHistory: ExerciseSessionLog[],
  targetRepRange: TargetRepRange,
): boolean {
  if (exerciseHistory.length < 2) return false;
  const previousSession = exerciseHistory[exerciseHistory.length - 2];
  const completedSets = previousSession.sets.filter((s) => s.completed);
  if (completedSets.length === 0) return false;
  return completedSets.some((s) => s.reps < targetRepRange.min);
}

function roundToNearestHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

// ============================================================================
// 2. ESTIMACIÓN DE 1RM Y PESO INICIAL
// ============================================================================

/** Epley (1985): 1RM = peso × (1 + reps/30) */
export function estimate1RM(weight_kg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight_kg;
  const cappedReps = Math.min(reps, 12);
  return weight_kg * (1 + cappedReps / 30);
}

/** Alias para compatibilidad con el código anterior */
export const estimateOneRepMax = estimate1RM;

/**
 * Puntaje comparable de récord para CUALQUIER ejercicio, incluido peso corporal.
 *
 * - Peso libre / máquina: 1RM estimado del peso levantado.
 * - Peso corporal: usa (peso corporal + peso añadido) como carga, así una dominada
 *   lastrada con +10 kg supera a una sin lastre, y más reps siempre puntúan más.
 * - Si no conocemos el peso corporal y no hay lastre, caemos a "reps" como puntaje,
 *   para que igual se registren récords de repeticiones (flexiones, plancha, etc.).
 */
export function exercisePRScore(
  exercise: Exercise,
  weightAddedKg: number,
  reps: number,
  bodyweightKg?: number,
): number {
  const isBodyweight = exercise.equipment_required.includes('bodyweight');
  const load = isBodyweight ? (bodyweightKg ?? 0) + weightAddedKg : weightAddedKg;
  if (load <= 0) return reps; // récord por repeticiones
  return estimate1RM(load, reps);
}

/** Volumen efectivo de una serie, contando el peso corporal cuando aplica. */
export function effectiveSetVolume(
  exercise: Exercise,
  weightAddedKg: number,
  reps: number,
  bodyweightKg?: number,
): number {
  const isBodyweight = exercise.equipment_required.includes('bodyweight');
  const load = isBodyweight ? (bodyweightKg ?? 0) + weightAddedKg : weightAddedKg;
  return load * reps;
}

export function suggestWeightFromRelated1RM(
  related1RM: number,
  targetRepRange: TargetRepRange,
): number {
  const avgReps = (targetRepRange.min + targetRepRange.max) / 2;
  const pct = estimatePercentOf1RMFromReps(avgReps);
  return roundToNearestHalf(related1RM * pct);
}

function estimatePercentOf1RMFromReps(reps: number): number {
  if (reps <= 3) return 0.93;
  if (reps <= 6) return 0.87;
  if (reps <= 8) return 0.80;
  if (reps <= 12) return 0.72;
  if (reps <= 15) return 0.65;
  return 0.60;
}

export function suggestInitialWeight(
  relatedExerciseHistory: ExerciseSessionLog[] | null,
  targetRepRange: TargetRepRange,
): { weight_kg: number; source: 'related_exercise' } | { weight_kg: null; source: 'manual_input_required' } {
  if (!relatedExerciseHistory || relatedExerciseHistory.length === 0) {
    return { weight_kg: null, source: 'manual_input_required' };
  }
  const bestSet = findBestRecentSet(relatedExerciseHistory);
  if (!bestSet) return { weight_kg: null, source: 'manual_input_required' };
  const related1RM = estimate1RM(bestSet.weight_kg, bestSet.reps);
  return { weight_kg: suggestWeightFromRelated1RM(related1RM, targetRepRange), source: 'related_exercise' };
}

function findBestRecentSet(history: ExerciseSessionLog[]): SetLog | null {
  const recentSessions = history.slice(-3);
  let best: SetLog | null = null;
  let bestEstimated1RM = 0;
  for (const session of recentSessions) {
    for (const set of session.sets) {
      if (!set.completed) continue;
      const estimated = estimate1RM(set.weight_kg, set.reps);
      if (estimated > bestEstimated1RM) {
        bestEstimated1RM = estimated;
        best = set;
      }
    }
  }
  return best;
}

// ============================================================================
// 3. VOLUMEN SEMANAL POR GRUPO MUSCULAR
// ============================================================================

interface SessionWithMuscleGroups {
  date: string;
  sets: Array<{ muscle_group: MuscleGroup; completed: boolean }>;
}

/** Adapta WorkoutSession[] al formato requerido por calculateWeeklyVolume */
export function adaptSessionsToMuscleGroups(sessions: WorkoutSession[]): SessionWithMuscleGroups[] {
  return sessions.map((s) => ({
    date: s.date,
    sets: s.sets.map((set) => {
      const ex = getExerciseById(set.exercise_id);
      return {
        muscle_group: (ex?.muscle_group ?? 'core') as MuscleGroup,
        completed: set.completed,
      };
    }),
  }));
}

export function calculateWeeklyVolume(
  sessions: SessionWithMuscleGroups[],
  weekStartDate: Date,
  weekEndDate: Date,
): WeeklyVolumeEntry[] {
  const setsInRange = sessions
    .filter((s) => {
      const d = new Date(s.date);
      return d >= weekStartDate && d <= weekEndDate;
    })
    .flatMap((s) => s.sets)
    .filter((s) => s.completed);

  const counts = new Map<MuscleGroup, number>();
  for (const set of setsInRange) {
    counts.set(set.muscle_group, (counts.get(set.muscle_group) ?? 0) + 1);
  }

  const muscles: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core'];
  return muscles.map((muscle) => {
    const completed = counts.get(muscle) ?? 0;
    const target = HYPERTROPHY_WEEKLY_VOLUME_TARGET;
    const pct = Math.round((completed / target) * 100);
    let status: WeeklyVolumeEntry['status'] = 'on_target';
    if (completed < target * 0.7) status = 'below';
    else if (completed > target * 1.5) status = 'above';
    return { muscle_group: muscle, completed_sets: completed, target_sets: target, status, percent_of_target: pct };
  });
}

// ============================================================================
// 4. DELOAD PROGRAMADO
// ============================================================================

export function checkIfDeloadNeeded(
  lastDeloadDate: string | null,
  currentDate: Date = new Date(),
): DeloadCheckResult {
  if (!lastDeloadDate) {
    return { shouldDeload: false, weeksSinceLastDeload: 0, message: 'Aún no toca deload.', volumeFactor: 1 };
  }
  const weeksSince = weeksBetween(new Date(lastDeloadDate), currentDate);
  if (weeksSince >= DELOAD_FREQUENCY_WEEKS.max) {
    return {
      shouldDeload: true,
      weeksSinceLastDeload: weeksSince,
      message: `Llevas ${weeksSince} semanas entrenando sin descanso. Esta semana bajamos el volumen para recuperar.`,
      volumeFactor: WEEKLY_DELOAD_VOLUME_FACTOR,
    };
  }
  if (weeksSince >= DELOAD_FREQUENCY_WEEKS.min) {
    return {
      shouldDeload: true,
      weeksSinceLastDeload: weeksSince,
      message: `Ya van ${weeksSince} semanas desde tu último deload. Es un buen momento para bajar volumen.`,
      volumeFactor: WEEKLY_DELOAD_VOLUME_FACTOR,
    };
  }
  return {
    shouldDeload: false,
    weeksSinceLastDeload: weeksSince,
    message: `Llevas ${weeksSince} semana(s) desde tu último deload. Seguimos con normalidad.`,
    volumeFactor: 1,
  };
}

function weeksBetween(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export function applyDeloadToTargetSets(originalSets: number, volumeFactor: number): number {
  return Math.max(1, Math.round(originalSets * volumeFactor));
}

// ============================================================================
// UTILS — compatibilidad con código anterior
// ============================================================================

export function calculateVolume(sets: { reps: number; weight_kg: number }[]): number {
  return sets.reduce((total, s) => total + s.reps * s.weight_kg, 0);
}
