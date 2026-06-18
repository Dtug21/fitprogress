import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSession, PersonalRecord, Achievement } from '../types';

export interface BodyWeightEntry {
  date: string;
  weight_kg: number;
}

interface ProgressState {
  sessions: WorkoutSession[];
  personalRecords: Record<string, PersonalRecord>;
  achievements: Achievement[];
  streak: number;
  bestStreak: number;
  lastWorkoutDate: string | null;
  lastDeloadDate: string | null;
  bodyWeight: BodyWeightEntry[];

  saveSession: (session: WorkoutSession) => void;
  updatePersonalRecord: (exerciseId: string, pr: PersonalRecord) => void;
  unlockAchievement: (id: string) => void;
  getExerciseHistory: (exerciseId: string) => WorkoutSession[];
  calculateStreak: () => void;
  addBodyWeight: (entry: BodyWeightEntry) => void;
  setLastDeloadDate: (date: string) => void;
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_workout', title: 'Primer entrenamiento', description: 'Completaste tu primer sesión', unlocked: false },
  { id: 'streak_7', title: 'Racha de 7 días', description: '7 días consecutivos entrenando', unlocked: false },
  { id: 'first_pr', title: 'Primer PR', description: 'Lograste un récord personal', unlocked: false },
  { id: 'workouts_10', title: '10 entrenamientos', description: 'Completaste 10 sesiones', unlocked: false },
  { id: 'all_pr_session', title: 'Sesión perfecta', description: 'Subiste peso en todos los ejercicios de una sesión', unlocked: false },
  { id: 'streak_30', title: 'Racha de 30 días', description: '30 días consecutivos entrenando', unlocked: false },
];

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      sessions: [],
      personalRecords: {},
      achievements: DEFAULT_ACHIEVEMENTS,
      streak: 0,
      bestStreak: 0,
      lastWorkoutDate: null,
      lastDeloadDate: null,
      bodyWeight: [],

      saveSession: (session) => {
        set((state) => ({
          sessions: [...state.sessions, session],
          lastWorkoutDate: session.date,
        }));
        get().calculateStreak();
        // Desbloquear logros automáticamente
        const total = get().sessions.length;
        if (total === 1) get().unlockAchievement('first_workout');
        if (total >= 10) get().unlockAchievement('workouts_10');
        const streak = get().streak;
        if (streak >= 7) get().unlockAchievement('streak_7');
        if (streak >= 30) get().unlockAchievement('streak_30');
      },

      updatePersonalRecord: (exerciseId, pr) =>
        set((state) => ({
          personalRecords: { ...state.personalRecords, [exerciseId]: pr },
        })),

      unlockAchievement: (id) =>
        set((state) => ({
          achievements: state.achievements.map((a) =>
            a.id === id && !a.unlocked
              ? { ...a, unlocked: true, unlocked_at: new Date().toISOString() }
              : a
          ),
        })),

      getExerciseHistory: (exerciseId) =>
        get().sessions.filter((s) =>
          s.sets.some((set) => set.exercise_id === exerciseId)
        ),

      calculateStreak: () => {
        const { sessions, bestStreak } = get();
        if (sessions.length === 0) { set({ streak: 0 }); return; }

        const dates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        let current = new Date(today);

        for (const date of dates) {
          const sessionDate = new Date(date);
          const diff = Math.floor(
            (current.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diff <= 1) { streak++; current = sessionDate; }
          else break;
        }
        set({ streak, bestStreak: Math.max(streak, bestStreak) });
      },

      addBodyWeight: (entry) =>
        set((state) => {
          const filtered = state.bodyWeight.filter((e) => e.date !== entry.date);
          return { bodyWeight: [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)) };
        }),

      setLastDeloadDate: (date) => set({ lastDeloadDate: date }),
    }),
    {
      name: 'fitprogress-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
