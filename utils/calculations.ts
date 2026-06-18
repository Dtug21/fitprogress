import { WorkoutSet } from '../types';

export function calculateTotalVolume(sets: WorkoutSet[]): number {
  return sets.reduce((total, s) => total + s.reps * s.weight_kg, 0);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getWeeklyVolume(
  sessions: { sets: WorkoutSet[]; date: string }[],
  weeksBack = 1
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeksBack * 7);
  const weekSessions = sessions.filter((s) => new Date(s.date) >= cutoff);
  return weekSessions.reduce((total, s) => total + calculateTotalVolume(s.sets), 0);
}
