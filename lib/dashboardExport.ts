import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { WorkoutSession, PersonalRecord, Achievement } from '../types';
import { UserProfile } from '../types';
import { Routine } from '../types';
import { getExerciseById } from '../data/exercises';
import { BodyWeightEntry } from '../stores/useProgressStore';

// ─── Schema del Dashboard Export ──────────────────────────────────────────────
// Versión 1.0 — cada campo está documentado para que el dashboard pueda
// consumirlo directamente sin procesar datos crudos.

export interface DashboardExercisePR {
  exercise_id: string;
  exercise_name: string;
  weight_kg: number;
  reps: number;
  date: string;
  estimated_1rm: number;
}

export interface DashboardWeeklySummary {
  week_start: string; // ISO date del lunes de la semana
  sessions: number;
  volume_kg: number;
  muscles_trained: string[];
  avg_mood: number | null;
  sets_completed: number;
}

export interface DashboardMuscleSummary {
  muscle: string;
  label: string;
  sessions_last_30d: number;
  volume_last_30d: number;
  volume_prev_30d: number;
  trend: 'up' | 'stable' | 'down' | 'none';
}

export interface DashboardExport {
  schema_version: '1.0';
  app: 'FitProgress';
  exported_at: string;

  // ── Perfil ──────────────────────────────────────────────────
  user: {
    name: string;
    mode: 'home' | 'gym';
    experience_level: string;
    goals: string[];
    days_per_week: number;
  };

  // ── Resumen global ──────────────────────────────────────────
  summary: {
    total_sessions: number;
    total_volume_kg: number;
    total_sets: number;
    streak: number;
    best_streak: number;
    avg_session_duration_min: number;
    avg_sets_per_session: number;
    avg_mood: number | null;
    first_session_date: string | null;
    last_session_date: string | null;
    active_days: number;
  };

  // ── Peso corporal ───────────────────────────────────────────
  body_weight: BodyWeightEntry[];

  // ── Récords personales procesados ──────────────────────────
  personal_records: DashboardExercisePR[];

  // ── Últimas 12 semanas ──────────────────────────────────────
  weekly_summaries: DashboardWeeklySummary[];

  // ── Desglose por músculo (últimos 60d) ─────────────────────
  muscle_breakdown: DashboardMuscleSummary[];

  // ── Logros ──────────────────────────────────────────────────
  achievements: { id: string; title: string; unlocked: boolean; unlocked_at?: string }[];

  // ── Historial completo (para re-importar o análisis custom) ─
  sessions: WorkoutSession[];
  routines: Routine[];
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecho', back: 'Espalda', shoulders: 'Hombros',
  biceps: 'Bíceps', triceps: 'Tríceps', legs: 'Piernas',
  quads: 'Cuádriceps', hamstrings: 'Isquios', glutes: 'Glúteos',
  calves: 'Gemelos', core: 'Core', cardio: 'Cardio',
};

function estimated1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

function getMondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function buildWeeklySummaries(sessions: WorkoutSession[]): DashboardWeeklySummary[] {
  const byWeek: Record<string, DashboardWeeklySummary> = {};

  for (const s of sessions) {
    const week = getMondayOf(new Date(s.date));
    if (!byWeek[week]) {
      byWeek[week] = { week_start: week, sessions: 0, volume_kg: 0, muscles_trained: [], avg_mood: null, sets_completed: 0 };
    }
    const entry = byWeek[week];
    entry.sessions += 1;
    entry.sets_completed += s.sets.filter((set) => set.completed).length;
    entry.volume_kg += s.sets.reduce((t, set) => t + set.reps * set.weight_kg, 0);
    if (s.mood != null) {
      entry.avg_mood = entry.avg_mood == null
        ? s.mood
        : (entry.avg_mood + s.mood) / 2;
    }
    for (const set of s.sets) {
      const ex = getExerciseById(set.exercise_id);
      if (ex && !entry.muscles_trained.includes(ex.muscle_group)) {
        entry.muscles_trained.push(ex.muscle_group);
      }
    }
  }

  // Últimas 12 semanas
  return Object.values(byWeek)
    .sort((a, b) => b.week_start.localeCompare(a.week_start))
    .slice(0, 12)
    .map((w) => ({ ...w, volume_kg: Math.round(w.volume_kg) }));
}

function buildMuscleBreakdown(sessions: WorkoutSession[]): DashboardMuscleSummary[] {
  const now = new Date();
  const cut30 = new Date(now); cut30.setDate(cut30.getDate() - 30);
  const cut60 = new Date(now); cut60.setDate(cut60.getDate() - 60);

  const muscles = Object.keys(MUSCLE_LABELS);
  return muscles.map((muscle) => {
    const sessions30 = sessions.filter((s) => new Date(s.date) >= cut30);
    const sessions31_60 = sessions.filter((s) => {
      const d = new Date(s.date);
      return d >= cut60 && d < cut30;
    });

    const volFor = (slist: WorkoutSession[]) =>
      slist.reduce((t, s) =>
        t + s.sets
          .filter((set) => getExerciseById(set.exercise_id)?.muscle_group === muscle)
          .reduce((tt, set) => tt + set.reps * set.weight_kg, 0), 0);

    const sessCount = sessions30.filter((s) =>
      s.sets.some((set) => getExerciseById(set.exercise_id)?.muscle_group === muscle)
    ).length;

    const vol30 = Math.round(volFor(sessions30));
    const vol60 = Math.round(volFor(sessions31_60));

    let trend: 'up' | 'stable' | 'down' | 'none' = 'none';
    if (vol30 === 0 && vol60 === 0) trend = 'none';
    else if (vol60 === 0) trend = 'up';
    else {
      const pct = (vol30 - vol60) / vol60;
      trend = pct > 0.05 ? 'up' : pct < -0.05 ? 'down' : 'stable';
    }

    return {
      muscle,
      label: MUSCLE_LABELS[muscle],
      sessions_last_30d: sessCount,
      volume_last_30d: vol30,
      volume_prev_30d: vol60,
      trend,
    };
  }).filter((m) => m.sessions_last_30d > 0 || m.volume_last_30d > 0 || m.volume_prev_30d > 0);
}

function buildPRs(personalRecords: Record<string, PersonalRecord>): DashboardExercisePR[] {
  return Object.entries(personalRecords)
    .map(([id, pr]) => {
      const ex = getExerciseById(id);
      return {
        exercise_id: id,
        exercise_name: ex?.name ?? id,
        weight_kg: pr.weight_kg,
        reps: pr.reps,
        date: pr.date,
        estimated_1rm: estimated1RM(pr.weight_kg, pr.reps),
      };
    })
    .sort((a, b) => b.estimated_1rm - a.estimated_1rm);
}

export function buildDashboardExport(params: {
  profile: UserProfile;
  routines: Routine[];
  sessions: WorkoutSession[];
  personalRecords: Record<string, PersonalRecord>;
  achievements: Achievement[];
  bodyWeight: BodyWeightEntry[];
  streak: number;
  bestStreak: number;
}): DashboardExport {
  const { profile, routines, sessions, personalRecords, achievements, bodyWeight, streak, bestStreak } = params;

  const completedSets = sessions.flatMap((s) => s.sets.filter((set) => set.completed));
  const totalVolume = Math.round(completedSets.reduce((t, s) => t + s.reps * s.weight_kg, 0));
  const moods = sessions.map((s) => s.mood).filter((m): m is number => m != null);
  const avgMood = moods.length > 0 ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null;

  const durations = sessions
    .filter((s) => s.finished_at)
    .map((s) => Math.floor((new Date(s.finished_at!).getTime() - new Date(s.started_at).getTime()) / 60000));
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  return {
    schema_version: '1.0',
    app: 'FitProgress',
    exported_at: new Date().toISOString(),

    user: {
      name: profile.name,
      mode: profile.mode,
      experience_level: profile.experience_level,
      goals: profile.goals ?? [],
      days_per_week: profile.days_per_week ?? 4,
    },

    summary: {
      total_sessions: sessions.length,
      total_volume_kg: totalVolume,
      total_sets: completedSets.length,
      streak,
      best_streak: bestStreak,
      avg_session_duration_min: avgDuration,
      avg_sets_per_session: sessions.length > 0 ? Math.round(completedSets.length / sessions.length) : 0,
      avg_mood: avgMood,
      first_session_date: sortedSessions[0]?.date ?? null,
      last_session_date: sortedSessions[sortedSessions.length - 1]?.date ?? null,
      active_days: new Set(sessions.map((s) => s.date)).size,
    },

    body_weight: bodyWeight,
    personal_records: buildPRs(personalRecords),
    weekly_summaries: buildWeeklySummaries(sessions),
    muscle_breakdown: buildMuscleBreakdown(sessions),
    achievements: achievements.map(({ id, title, unlocked, unlocked_at }) => ({ id, title, unlocked, unlocked_at })),
    sessions,
    routines,
  };
}

export async function exportForDashboard(params: Parameters<typeof buildDashboardExport>[0]): Promise<void> {
  const data = buildDashboardExport(params);
  const json = JSON.stringify(data, null, 2);
  const date = new Date().toISOString().split('T')[0];
  const fileName = `fitprogress_dashboard_${date}.json`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('El compartir no está disponible en este dispositivo.');

  await Sharing.shareAsync(filePath, {
    mimeType: 'application/json',
    dialogTitle: 'Exportar datos para Dashboard',
    UTI: 'public.json',
  });
}
