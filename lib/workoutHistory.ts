import { Routine, RoutineExercise, WorkoutSession } from '../types';
import { getExerciseById } from '../data/exercises';
import { generateId } from '../utils/calculations';

const FREESTYLE_ID = 'freestyle';

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getSessionLabel(session: WorkoutSession, routines: Routine[]): string {
  if (session.routine_name) return session.routine_name;
  if (session.routine_id === FREESTYLE_ID) return 'Entrenamiento libre';
  const saved = routines.find((r) => r.id === session.routine_id);
  return saved?.name ?? 'Sesión de entrenamiento';
}

export function summarizeSession(session: WorkoutSession) {
  const completed = session.sets.filter((s) => s.completed);
  const exerciseIds = [...new Set(completed.map((s) => s.exercise_id))];
  const volume = completed.reduce((t, s) => t + s.reps * s.weight_kg, 0);
  const durationSec = session.finished_at
    ? Math.floor(
        (new Date(session.finished_at).getTime() - new Date(session.started_at).getTime()) / 1000,
      )
    : 0;
  return {
    exerciseCount: exerciseIds.length,
    setCount: completed.length,
    volumeKg: Math.round(volume),
    durationSec,
    topExercises: exerciseIds.slice(0, 3).map((id) => getExerciseById(id)?.name ?? id),
  };
}

export function getRecentSessions(sessions: WorkoutSession[], limit = 8): WorkoutSession[] {
  return [...sessions]
    .filter((s) => s.finished_at && s.sets.some((set) => set.completed))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export function getYesterdaySession(sessions: WorkoutSession[]): WorkoutSession | undefined {
  const yesterday = getYesterdayDateString();
  return [...sessions]
    .filter((s) => s.date === yesterday && s.sets.some((set) => set.completed))
    .sort((a, b) => (b.finished_at ?? '').localeCompare(a.finished_at ?? ''))[0];
}

export function buildRoutineFromSession(
  session: WorkoutSession,
  sessionExercises: RoutineExercise[],
  routines: Routine[],
  customName?: string,
): Routine {
  const baseName = customName?.trim() || getSessionLabel(session, routines);
  const dateSuffix = session.date.slice(5).replace('-', '/');
  const exerciseIds = sessionExercises.length > 0
    ? sessionExercises
    : deriveExercisesFromSets(session);

  const exercises: RoutineExercise[] = exerciseIds.map((re, idx) => {
    const logged = session.sets.filter((s) => s.exercise_id === re.exercise_id && s.completed);
    const lastSet = logged[logged.length - 1];
    const heaviest = logged.reduce(
      (best, s) => (s.weight_kg > best ? s.weight_kg : best),
      0,
    );
    return {
      ...re,
      order: idx,
      target_weight_kg: heaviest > 0 ? heaviest : re.target_weight_kg,
      target_sets: Math.max(re.target_sets, logged.length),
      target_reps: lastSet?.reps ? String(lastSet.reps) : re.target_reps,
    };
  });

  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: `${baseName} · ${dateSuffix}`,
    day_of_week: [],
    mode: session.mode,
    exercises,
    created_at: now,
    updated_at: now,
    source: 'manual',
  };
}

function deriveExercisesFromSets(session: WorkoutSession): RoutineExercise[] {
  const seen = new Set<string>();
  const result: RoutineExercise[] = [];
  for (const set of session.sets) {
    if (!set.completed || seen.has(set.exercise_id)) continue;
    seen.add(set.exercise_id);
    result.push({
      exercise_id: set.exercise_id,
      order: result.length,
      target_sets: 3,
      target_reps: String(set.reps || 8),
      rest_seconds: set.rest_seconds || 90,
      target_weight_kg: set.weight_kg > 0 ? set.weight_kg : undefined,
    });
  }
  return result;
}
