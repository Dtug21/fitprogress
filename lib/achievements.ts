import type { Achievement, PersonalRecord, WorkoutSession } from '../types';
import type { BodyWeightEntry } from '../stores/useProgressStore';

export type AchievementIcon =
  | 'footsteps-outline'
  | 'barbell-outline'
  | 'flame-outline'
  | 'trophy-outline'
  | 'ribbon-outline'
  | 'medal-outline'
  | 'star-outline'
  | 'trending-up-outline'
  | 'fitness-outline'
  | 'calendar-outline'
  | 'sunny-outline'
  | 'moon-outline'
  | 'happy-outline'
  | 'scale-outline'
  | 'flash-outline'
  | 'walk-outline'
  | 'checkmark-done-outline'
  | 'layers-outline'
  | 'rocket-outline';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { id: 'first_workout', title: 'Primer paso', description: 'Completaste tu primera sesión', icon: 'footsteps-outline' },
  { id: 'workouts_10', title: 'Constante', description: '10 sesiones completadas', icon: 'barbell-outline' },
  { id: 'workouts_25', title: 'Veterano', description: '25 sesiones completadas', icon: 'fitness-outline' },
  { id: 'workouts_50', title: 'Imparable', description: '50 sesiones completadas', icon: 'medal-outline' },
  { id: 'workouts_100', title: 'Leyenda', description: '100 sesiones completadas', icon: 'trophy-outline' },
  { id: 'streak_3', title: 'Buen arranque', description: '3 días seguidos entrenando', icon: 'flame-outline' },
  { id: 'streak_7', title: 'Una semana firme', description: '7 días seguidos entrenando', icon: 'flame-outline' },
  { id: 'streak_14', title: 'Dos semanas', description: '14 días seguidos entrenando', icon: 'ribbon-outline' },
  { id: 'streak_30', title: 'Un mes de hierro', description: '30 días seguidos entrenando', icon: 'star-outline' },
  { id: 'best_streak_14', title: 'Racha histórica', description: 'Tu mejor racha llegó a 14 días', icon: 'rocket-outline' },
  { id: 'first_pr', title: 'Primer PR', description: 'Batiste tu primer récord personal', icon: 'trending-up-outline' },
  { id: 'prs_5', title: 'Cazador de PRs', description: '5 ejercicios con récord personal', icon: 'trending-up-outline' },
  { id: 'prs_15', title: 'Rompe récords', description: '15 ejercicios con récord personal', icon: 'trophy-outline' },
  { id: 'pr_session_3', title: 'Sesión de oro', description: '3 PRs en una sola sesión', icon: 'checkmark-done-outline' },
  { id: 'sets_100', title: 'Centenas', description: '100 series registradas en total', icon: 'layers-outline' },
  { id: 'sets_500', title: 'Máquina de series', description: '500 series registradas en total', icon: 'layers-outline' },
  { id: 'volume_25k', title: '25 toneladas', description: 'Moviste 25.000 kg en volumen total', icon: 'barbell-outline' },
  { id: 'volume_100k', title: 'Cien toneladas', description: 'Moviste 100.000 kg en volumen total', icon: 'barbell-outline' },
  { id: 'week_4', title: 'Semana completa', description: '4 o más sesiones en 7 días', icon: 'calendar-outline' },
  { id: 'month_12', title: 'Mes activo', description: '12 sesiones en un mismo mes', icon: 'calendar-outline' },
  { id: 'exercises_15', title: 'Explorador', description: '15 ejercicios distintos en tu historial', icon: 'walk-outline' },
  { id: 'exercises_40', title: 'Multiverso', description: '40 ejercicios distintos en tu historial', icon: 'walk-outline' },
  { id: 'early_bird', title: 'Madrugador', description: 'Entrenaste antes de las 8:00', icon: 'sunny-outline' },
  { id: 'night_owl', title: 'Búho del gym', description: 'Entrenaste después de las 21:00', icon: 'moon-outline' },
  { id: 'mood_great', title: 'Energía máxima', description: '5 sesiones terminadas con ánimo al máximo', icon: 'happy-outline' },
  { id: 'body_weight', title: 'En la balanza', description: 'Registraste tu peso corporal', icon: 'scale-outline' },
  { id: 'freestyle_3', title: 'Libre como el viento', description: '3 entrenamientos libres completados', icon: 'flash-outline' },
  { id: 'weekend_warrior', title: 'Guerrero de finde', description: 'Entrenaste sábado y domingo la misma semana', icon: 'fitness-outline' },
];

export function createDefaultAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    id: def.id,
    title: def.title,
    description: def.description,
    icon: def.icon,
    unlocked: false,
  }));
}

/** Fusiona logros guardados con nuevas definiciones (usuarios existentes). */
export function mergeAchievements(stored: Achievement[] | undefined): Achievement[] {
  const byId = new Map((stored ?? []).map((a) => [a.id, a]));
  return ACHIEVEMENT_DEFINITIONS.map((def) => {
    const existing = byId.get(def.id);
    if (existing) {
      return {
        ...def,
        unlocked: existing.unlocked,
        unlocked_at: existing.unlocked_at,
      };
    }
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      unlocked: false,
    };
  });
}

function completedSets(sessions: WorkoutSession[]) {
  return sessions.reduce(
    (total, session) => total + session.sets.filter((set) => set.completed).length,
    0,
  );
}

function totalVolumeKg(sessions: WorkoutSession[]) {
  return sessions.reduce(
    (total, session) =>
      total + session.sets.reduce((t, set) => t + (set.completed ? set.reps * set.weight_kg : 0), 0),
    0,
  );
}

function distinctExercises(sessions: WorkoutSession[]) {
  return new Set(
    sessions.flatMap((s) => s.sets.filter((set) => set.completed).map((set) => set.exercise_id)),
  ).size;
}

function sessionsInLastDays(sessions: WorkoutSession[], days: number) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  cutoff.setHours(0, 0, 0, 0);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return sessions.filter((s) => s.date >= cutoffStr).length;
}

function maxSessionsInAnyMonth(sessions: WorkoutSession[]) {
  const byMonth = new Map<string, number>();
  for (const session of sessions) {
    const key = session.date.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
  return Math.max(0, ...byMonth.values());
}

function prCountOnSessionDate(session: WorkoutSession, personalRecords: Record<string, PersonalRecord>) {
  const exerciseIds = new Set(
    session.sets.filter((set) => set.completed).map((set) => set.exercise_id),
  );
  let count = 0;
  for (const exId of exerciseIds) {
    const pr = personalRecords[exId];
    if (!pr) continue;
    const prDay = pr.date.includes('T') ? pr.date.split('T')[0] : pr.date;
    if (prDay === session.date) count += 1;
  }
  return count;
}

function maxPrsInSingleSession(sessions: WorkoutSession[], personalRecords: Record<string, PersonalRecord>) {
  return Math.max(0, ...sessions.map((s) => prCountOnSessionDate(s, personalRecords)));
}

function hasWeekendWarriorWeek(sessions: WorkoutSession[]) {
  const byWeek = new Map<string, Set<number>>();
  for (const session of sessions) {
    const date = new Date(session.date + 'T12:00:00');
    const day = date.getDay();
    if (day !== 0 && day !== 6) continue;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - day);
    const key = weekStart.toISOString().split('T')[0];
    if (!byWeek.has(key)) byWeek.set(key, new Set());
    byWeek.get(key)!.add(day);
  }
  return [...byWeek.values()].some((days) => days.has(0) && days.has(6));
}

function sessionHour(iso: string) {
  return new Date(iso).getHours();
}

export interface AchievementEvalContext {
  sessions: WorkoutSession[];
  personalRecords: Record<string, PersonalRecord>;
  bodyWeight: BodyWeightEntry[];
  streak: number;
  bestStreak: number;
}

export function evaluateAchievementUnlocks(ctx: AchievementEvalContext): string[] {
  const { sessions, personalRecords, bodyWeight, streak, bestStreak } = ctx;
  const total = sessions.length;
  const prCount = Object.keys(personalRecords).length;
  const sets = completedSets(sessions);
  const volume = totalVolumeKg(sessions);
  const exercises = distinctExercises(sessions);
  const freestyle = sessions.filter((s) => s.routine_id === 'freestyle').length;
  const mood5 = sessions.filter((s) => s.mood === 5).length;
  const maxPrSession = maxPrsInSingleSession(sessions, personalRecords);

  const unlock: string[] = [];

  if (total >= 1) unlock.push('first_workout');
  if (total >= 10) unlock.push('workouts_10');
  if (total >= 25) unlock.push('workouts_25');
  if (total >= 50) unlock.push('workouts_50');
  if (total >= 100) unlock.push('workouts_100');

  if (streak >= 3) unlock.push('streak_3');
  if (streak >= 7) unlock.push('streak_7');
  if (streak >= 14) unlock.push('streak_14');
  if (streak >= 30) unlock.push('streak_30');
  if (bestStreak >= 14) unlock.push('best_streak_14');

  if (prCount >= 1) unlock.push('first_pr');
  if (prCount >= 5) unlock.push('prs_5');
  if (prCount >= 15) unlock.push('prs_15');
  if (maxPrSession >= 3) unlock.push('pr_session_3');

  if (sets >= 100) unlock.push('sets_100');
  if (sets >= 500) unlock.push('sets_500');
  if (volume >= 25_000) unlock.push('volume_25k');
  if (volume >= 100_000) unlock.push('volume_100k');

  if (sessionsInLastDays(sessions, 7) >= 4) unlock.push('week_4');
  if (maxSessionsInAnyMonth(sessions) >= 12) unlock.push('month_12');

  if (exercises >= 15) unlock.push('exercises_15');
  if (exercises >= 40) unlock.push('exercises_40');

  if (sessions.some((s) => sessionHour(s.started_at) < 8)) unlock.push('early_bird');
  if (sessions.some((s) => sessionHour(s.started_at) >= 21)) unlock.push('night_owl');

  if (mood5 >= 5) unlock.push('mood_great');
  if (bodyWeight.length >= 1) unlock.push('body_weight');
  if (freestyle >= 3) unlock.push('freestyle_3');
  if (hasWeekendWarriorWeek(sessions)) unlock.push('weekend_warrior');

  return unlock;
}

export function getAchievementIcon(id: string, unlocked: boolean): AchievementIcon {
  const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
  if (def) return def.icon;
  return unlocked ? 'trophy-outline' : 'ribbon-outline';
}
