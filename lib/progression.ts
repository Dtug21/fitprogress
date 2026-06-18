import { WorkoutSet, ProgressionSuggestion, MuscleGroup } from '../types';

function getWeightIncrement(muscleGroup: MuscleGroup): number {
  const lowerBody: MuscleGroup[] = ['legs', 'quads', 'hamstrings', 'glutes', 'calves'];
  return lowerBody.includes(muscleGroup) ? 5 : 2.5;
}

function parseRepRange(target: string): { min: number; max: number } {
  if (target === 'AMRAP') return { min: 1, max: 999 };
  if (target.includes('-')) {
    const [min, max] = target.split('-').map(Number);
    return { min, max };
  }
  const n = Number(target);
  return { min: n, max: n };
}

export function suggestNextWeight(
  exerciseHistory: WorkoutSet[][],
  targetReps: string,
  muscleGroup: MuscleGroup
): ProgressionSuggestion {
  if (exerciseHistory.length === 0) {
    return { action: 'maintain', new_weight: 0, message: 'Primer entrenamiento — elige un peso con el que puedas hacer el rango de reps cómodamente.' };
  }

  const lastSession = exerciseHistory[exerciseHistory.length - 1];
  const { min, max } = parseRepRange(targetReps);

  const allSetsAtMax = lastSession.every((s) => s.reps >= max);
  const anySetBelowMin = lastSession.some((s) => s.reps < min);

  const lastWeight = lastSession[0]?.weight_kg ?? 0;
  const increment = getWeightIncrement(muscleGroup);

  if (allSetsAtMax) {
    return {
      action: 'increase_weight',
      new_weight: lastWeight + increment,
      message: `¡Subimos peso! Estás listo para ${lastWeight + increment}kg.`,
    };
  }

  if (anySetBelowMin && exerciseHistory.length >= 2) {
    const prevSession = exerciseHistory[exerciseHistory.length - 2];
    const prevAlsoFailed = prevSession.some((s) => s.reps < min);
    if (prevAlsoFailed) {
      const deloadWeight = Math.round((lastWeight * 0.9) / 2.5) * 2.5;
      return {
        action: 'deload',
        new_weight: deloadWeight,
        message: 'Bajamos un poco para consolidar la técnica.',
      };
    }
  }

  return {
    action: 'maintain',
    new_weight: lastWeight,
    message: 'Mismo peso, busca más reps.',
  };
}

export function isDeloadWeek(sessionCount: number): boolean {
  // Cada 4 semanas (~16 sesiones de 4 días por semana)
  return sessionCount > 0 && sessionCount % 16 === 0;
}

export function calculateVolume(sets: WorkoutSet[]): number {
  return sets.reduce((total, s) => total + s.reps * s.weight_kg, 0);
}

export function estimateOneRepMax(weight: number, reps: number): number {
  // Fórmula de Brzycki
  if (reps === 1) return weight;
  return Math.round(weight * (36 / (37 - reps)));
}
