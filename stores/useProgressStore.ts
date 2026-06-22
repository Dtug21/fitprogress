import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSession, PersonalRecord, Achievement } from '../types';
import {
  createDefaultAchievements,
  evaluateAchievementUnlocks,
  mergeAchievements,
} from '../lib/achievements';

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
  syncAchievements: () => void;
  getExerciseHistory: (exerciseId: string) => WorkoutSession[];
  calculateStreak: () => void;
  addBodyWeight: (entry: BodyWeightEntry) => void;
  setLastDeloadDate: (date: string) => void;
}

function applyAchievementUnlocks(
  set: (fn: (state: ProgressState) => Partial<ProgressState>) => void,
  get: () => ProgressState,
) {
  const state = get();
  const toUnlock = evaluateAchievementUnlocks({
    sessions: state.sessions,
    personalRecords: state.personalRecords,
    bodyWeight: state.bodyWeight,
    streak: state.streak,
    bestStreak: state.bestStreak,
  });
  const unlockSet = new Set(toUnlock);
  set((s) => ({
    achievements: s.achievements.map((a) =>
      unlockSet.has(a.id) && !a.unlocked
        ? { ...a, unlocked: true, unlocked_at: new Date().toISOString() }
        : a,
    ),
  }));
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      sessions: [],
      personalRecords: {},
      achievements: createDefaultAchievements(),
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
        applyAchievementUnlocks(set, get);
      },

      updatePersonalRecord: (exerciseId, pr) => {
        set((state) => ({
          personalRecords: { ...state.personalRecords, [exerciseId]: pr },
        }));
        applyAchievementUnlocks(set, get);
      },

      unlockAchievement: (id) =>
        set((state) => ({
          achievements: state.achievements.map((a) =>
            a.id === id && !a.unlocked
              ? { ...a, unlocked: true, unlocked_at: new Date().toISOString() }
              : a,
          ),
        })),

      syncAchievements: () => applyAchievementUnlocks(set, get),

      getExerciseHistory: (exerciseId) =>
        get().sessions.filter((s) =>
          s.sets.some((set) => set.exercise_id === exerciseId),
        ),

      calculateStreak: () => {
        const { sessions, bestStreak } = get();
        if (sessions.length === 0) {
          set({ streak: 0 });
          return;
        }

        const dates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        let current = new Date(today);

        for (const date of dates) {
          const sessionDate = new Date(date);
          const diff = Math.floor(
            (current.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (diff <= 1) {
            streak++;
            current = sessionDate;
          } else break;
        }
        set({ streak, bestStreak: Math.max(streak, bestStreak) });
      },

      addBodyWeight: (entry) => {
        set((state) => {
          const filtered = state.bodyWeight.filter((e) => e.date !== entry.date);
          return {
            bodyWeight: [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date)),
          };
        });
        applyAchievementUnlocks(set, get);
      },

      setLastDeloadDate: (date) => set({ lastDeloadDate: date }),
    }),
    {
      name: 'fitprogress-progress',
      storage: createJSONStorage(() => AsyncStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<ProgressState> | undefined;
        return {
          ...current,
          ...p,
          achievements: mergeAchievements(p?.achievements),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.achievements = mergeAchievements(state.achievements);
          state.calculateStreak();
          state.syncAchievements();
        }
      },
    },
  ),
);
