import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSession, WorkoutSet } from '../types';

interface WorkoutState {
  activeSession: WorkoutSession | null;
  currentExerciseIndex: number;
  currentSetIndex: number;
  isResting: boolean;
  restSecondsRemaining: number;
  startSession: (session: WorkoutSession) => void;
  endSession: (mood?: 1 | 2 | 3 | 4 | 5) => WorkoutSession | null;
  addSet: (set: WorkoutSet) => void;
  updateSet: (setId: string, updates: Partial<WorkoutSet>) => void;
  nextExercise: () => void;
  nextSet: () => void;
  startRest: (seconds: number) => void;
  stopRest: () => void;
  tickRest: () => void;
  replaceExercise: (index: number, newExerciseId: string) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      isResting: false,
      restSecondsRemaining: 0,

      startSession: (session) =>
        set({ activeSession: session, currentExerciseIndex: 0, currentSetIndex: 0 }),

      endSession: (mood) => {
        const { activeSession } = get();
        if (!activeSession) return null;
        const finished = {
          ...activeSession,
          finished_at: new Date().toISOString(),
          mood,
        };
        set({ activeSession: null, currentExerciseIndex: 0, currentSetIndex: 0 });
        return finished;
      },

      addSet: (workoutSet) =>
        set((state) => {
          if (!state.activeSession) return state;
          return {
            activeSession: {
              ...state.activeSession,
              sets: [...state.activeSession.sets, workoutSet],
            },
          };
        }),

      updateSet: (setId, updates) =>
        set((state) => {
          if (!state.activeSession) return state;
          return {
            activeSession: {
              ...state.activeSession,
              sets: state.activeSession.sets.map((s) =>
                s.id === setId ? { ...s, ...updates } : s
              ),
            },
          };
        }),

      nextExercise: () =>
        set((state) => ({
          currentExerciseIndex: state.currentExerciseIndex + 1,
          currentSetIndex: 0,
        })),

      nextSet: () =>
        set((state) => ({ currentSetIndex: state.currentSetIndex + 1 })),

      startRest: (seconds) =>
        set({ isResting: true, restSecondsRemaining: seconds }),

      stopRest: () =>
        set({ isResting: false, restSecondsRemaining: 0 }),

      tickRest: () =>
        set((state) => {
          const next = state.restSecondsRemaining - 1;
          if (next <= 0) return { isResting: false, restSecondsRemaining: 0 };
          return { restSecondsRemaining: next };
        }),

      replaceExercise: (index, newExerciseId) =>
        set((state) => {
          if (!state.activeSession) return state;
          const exercises = [...state.activeSession.sets];
          return {
            activeSession: {
              ...state.activeSession,
              sets: exercises,
            },
          };
        }),
    }),
    {
      name: 'fitprogress-workout',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
