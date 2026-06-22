import { UserProfile, WorkoutSession, MuscleGroup } from '../types';
import {
  SplitOption,
  SPLIT_OPTIONS,
  scoreSplit,
  generateRoutine,
  getEffectiveGoals,
} from './routineOptimizer';
import {
  checkIfDeloadNeeded,
  adaptSessionsToMuscleGroups,
  calculateWeeklyVolume,
} from './progression';

export type IntensityLevel = 1 | 2 | 3 | 4 | 5;

export interface IntensityMeta {
  level: IntensityLevel;
  label: string;
  icon: 'leaf-outline' | 'walk-outline' | 'fitness-outline' | 'flame-outline' | 'flash';
  color: string;
}

export type SessionVariant = 'ideal' | 'moderate' | 'light';

export interface SessionRecommendation {
  id: string;
  split: SplitOption;
  variant: SessionVariant;
  isIdeal: boolean;
  intensity: IntensityMeta;
  title: string;
  subtitle: string;
  rationale: string;
  exerciseCount: number;
  totalSets: number;
  estimatedMinutes: number;
  volumeFactor: number;
}

const INTENSITY_LABELS: Record<IntensityLevel, string> = {
  1: 'Muy suave',
  2: 'Suave',
  3: 'Moderada',
  4: 'Alta',
  5: 'Máxima',
};

const INTENSITY_ICONS: Record<IntensityLevel, IntensityMeta['icon']> = {
  1: 'leaf-outline',
  2: 'walk-outline',
  3: 'fitness-outline',
  4: 'flame-outline',
  5: 'flash',
};

const INTENSITY_COLORS: Record<IntensityLevel, string> = {
  1: '#54D27A',
  2: '#7DD3A8',
  3: '#FBA94C',
  4: '#FF8C42',
  5: '#C6F24E',
};

function muscleOverlap(a: SplitOption, b: SplitOption): number {
  const setB = new Set(b.muscles);
  const shared = a.muscles.filter((m) => setB.has(m)).length;
  return shared / Math.max(a.muscles.length, 1);
}

function rankSplits(
  profile: UserProfile,
  sessions: WorkoutSession[],
): { split: SplitOption; score: number }[] {
  const recentMuscles = getUnderworkedMuscleBonus(sessions);

  return [...SPLIT_OPTIONS]
    .map((split) => {
      let score = scoreSplit(split, profile);
      for (const mg of split.muscles) {
        const deficit = recentMuscles.get(mg) ?? 0;
        if (deficit > 0) score += deficit * 3;
      }
      return { split, score };
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score);
}

/** Músculos con menos series en la última semana → bonus para el split que los incluye */
function getUnderworkedMuscleBonus(sessions: WorkoutSession[]): Map<MuscleGroup, number> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const adapted = adaptSessionsToMuscleGroups(sessions);
  const volume = calculateWeeklyVolume(adapted, weekStart, now);
  const bonus = new Map<MuscleGroup, number>();
  for (const entry of volume) {
    if (entry.status === 'below') {
      bonus.set(entry.muscle_group, Math.min(3, entry.target_sets - entry.completed_sets));
    }
  }
  return bonus;
}

function sessionsThisWeek(sessions: WorkoutSession[]): number {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return sessions.filter((s) => {
    const d = new Date(s.date);
    return d >= start && s.sets.some((set) => set.completed);
  }).length;
}

function lastSessionMood(sessions: WorkoutSession[]): number | null {
  const completed = [...sessions].reverse().find((s) => s.finished_at && s.sets.some((set) => set.completed));
  return completed?.mood ?? null;
}

function estimateMinutes(exerciseCount: number, totalSets: number, restAvg = 75): number {
  return Math.round(exerciseCount * 2 + (totalSets * (30 + restAvg)) / 60);
}

function buildIntensity(level: IntensityLevel): IntensityMeta {
  return {
    level,
    label: INTENSITY_LABELS[level],
    icon: INTENSITY_ICONS[level],
    color: INTENSITY_COLORS[level],
  };
}

function computeIntensityLevel(
  volumeFactor: number,
  split: SplitOption,
  deload: boolean,
): IntensityLevel {
  if (deload || volumeFactor <= 0.62) return 2;
  if (volumeFactor <= 0.82) return 3;
  const heavySplits: SplitOption['id'][] = ['push', 'pull', 'legs', 'chest_triceps', 'back_biceps'];
  if (heavySplits.includes(split.id)) return 5;
  if (['push_pull', 'upper_lower'].includes(split.id)) return 4;
  if (split.id === 'core_cardio') return 2;
  return 4;
}

function previewSession(
  split: SplitOption,
  profile: UserProfile,
  volumeFactor: number,
) {
  const goals = getEffectiveGoals(profile.goals ?? []);
  const generated = generateRoutine(
    split,
    profile.mode,
    goals,
    profile.experience_level,
    profile.home_equipment,
    volumeFactor,
  );
  const totalSets = generated.exercises.reduce((t, re) => t + re.target_sets, 0);
  const restAvg =
    generated.exercises.reduce((t, re) => t + re.rest_seconds, 0) /
    Math.max(generated.exercises.length, 1);
  return {
    generated,
    exerciseCount: generated.exercises.length,
    totalSets,
    estimatedMinutes: estimateMinutes(generated.exercises.length, totalSets, restAvg),
  };
}

function pickLightSplit(ideal: SplitOption, ranked: SplitOption[]): SplitOption {
  const fullBody = SPLIT_OPTIONS.find((s) => s.id === 'full_body')!;
  const coreCardio = SPLIT_OPTIONS.find((s) => s.id === 'core_cardio')!;

  if (ideal.id === 'core_cardio' || ideal.id === 'full_body') {
    return coreCardio;
  }

  const similar = ranked.find(
    (s) => s.id !== ideal.id && muscleOverlap(s, ideal) >= 0.25 && s.id !== 'core_cardio',
  );
  if (similar && ['full_body', 'upper_lower', 'push_pull'].includes(similar.id)) {
    return similar;
  }

  return muscleOverlap(fullBody, ideal) > 0.2 ? fullBody : coreCardio;
}

export function getSessionRecommendations(
  profile: UserProfile,
  sessions: WorkoutSession[],
  lastDeloadDate: string | null,
): SessionRecommendation[] {
  const ranked = rankSplits(profile, sessions);
  if (ranked.length === 0) {
    const fallback = SPLIT_OPTIONS.find((s) => s.id === 'full_body')!;
    const preview = previewSession(fallback, profile, 1);
    return [{
      id: 'ideal_full_body',
      split: fallback,
      variant: 'ideal',
      isIdeal: true,
      intensity: buildIntensity(4),
      title: 'Full Body',
      subtitle: 'Rutina ideal para empezar',
      rationale: preview.generated.rationale,
      exerciseCount: preview.exerciseCount,
      totalSets: preview.totalSets,
      estimatedMinutes: preview.estimatedMinutes,
      volumeFactor: 1,
    }];
  }

  const deload = checkIfDeloadNeeded(lastDeloadDate).shouldDeload;
  const weekSessions = sessionsThisWeek(sessions);
  const daysTarget = profile.days_per_week ?? 4;
  const mood = lastSessionMood(sessions);
  const fatigued = mood != null && mood <= 2;
  const highWeeklyLoad = weekSessions >= daysTarget;

  let idealVolume = 1;
  let idealNote = '';

  if (deload) {
    idealVolume = 0.6;
    idealNote = 'Semana de recuperación: volumen reducido según tu progreso reciente.';
  } else if (fatigued) {
    idealVolume = 0.85;
    idealNote = 'Tu última sesión fue exigente — ajustamos la carga ideal.';
  } else if (highWeeklyLoad) {
    idealVolume = 0.9;
    idealNote = 'Ya completaste varias sesiones esta semana — volumen optimizado.';
  }

  const idealSplit = ranked[0].split;
  const rankedSplits = ranked.map((r) => r.split);
  const lightSplit = pickLightSplit(idealSplit, rankedSplits);

  const idealPreview = previewSession(idealSplit, profile, idealVolume);
  const moderatePreview = previewSession(idealSplit, profile, 0.82);
  const lightPreview = previewSession(lightSplit, profile, lightSplit.id === idealSplit.id ? 0.65 : 0.75);

  const underworked = getUnderworkedMuscleBonus(sessions);
  const muscleHint = [...underworked.entries()]
    .filter(([, v]) => v > 0)
    .map(([mg]) => mg)
    .slice(0, 2);

  let idealRationale = idealPreview.generated.rationale;
  if (idealNote) idealRationale = `${idealNote} ${idealRationale}`;
  if (muscleHint.length > 0) {
    idealRationale += ` Prioriza grupos con menos volumen esta semana.`;
  }

  const recommendations: SessionRecommendation[] = [
    {
      id: `ideal_${idealSplit.id}`,
      split: idealSplit,
      variant: 'ideal',
      isIdeal: true,
      intensity: buildIntensity(computeIntensityLevel(idealVolume, idealSplit, deload)),
      title: idealSplit.label,
      subtitle: deload ? 'Rutina ideal hoy · recuperación activa' : 'Rutina ideal según tu progreso',
      rationale: idealRationale,
      exerciseCount: idealPreview.exerciseCount,
      totalSets: idealPreview.totalSets,
      estimatedMinutes: idealPreview.estimatedMinutes,
      volumeFactor: idealVolume,
    },
    {
      id: `moderate_${idealSplit.id}`,
      split: idealSplit,
      variant: 'moderate',
      isIdeal: false,
      intensity: buildIntensity(computeIntensityLevel(0.82, idealSplit, false)),
      title: `${idealSplit.label} · versión moderada`,
      subtitle: 'Misma estructura, menos series y descansos más cortos',
      rationale: `Alternativa similar a la rutina ideal con ~18% menos volumen. Útil si quieres entrenar sin llegar al límite (RIR más alto, adherencia ACSM).`,
      exerciseCount: moderatePreview.exerciseCount,
      totalSets: moderatePreview.totalSets,
      estimatedMinutes: moderatePreview.estimatedMinutes,
      volumeFactor: 0.82,
    },
    {
      id: `light_${lightSplit.id}`,
      split: lightSplit,
      variant: 'light',
      isIdeal: false,
      intensity: buildIntensity(computeIntensityLevel(0.7, lightSplit, false)),
      title: lightSplit.id === idealSplit.id
        ? `${idealSplit.label} · versión suave`
        : lightSplit.label,
      subtitle: lightSplit.id === idealSplit.id
        ? 'Mismos músculos, intensidad baja'
        : 'Enfoque parecido con menor demanda',
      rationale: lightSplit.id === idealSplit.id
        ? 'Misma división muscular con menos ejercicios y series. Ideal si vienes cansado o quieres una sesión de mantenimiento.'
        : `${lightSplit.desc} Opción más ligera que mantiene el estímulo sin la carga de la sesión ideal.`,
      exerciseCount: lightPreview.exerciseCount,
      totalSets: lightPreview.totalSets,
      estimatedMinutes: lightPreview.estimatedMinutes,
      volumeFactor: lightSplit.id === idealSplit.id ? 0.65 : 0.75,
    },
  ];

  return recommendations;
}
