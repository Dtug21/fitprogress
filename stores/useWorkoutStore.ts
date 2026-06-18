import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSession, WorkoutSet, RoutineExercise } from '../types';

interface WorkoutState {
  activeSession: WorkoutSession | null;
  sessionExercises: RoutineExercise[]; // ejercicios de la sesión (pueden ser reemplazados)
  currentExerciseIndex: number;
  currentSetIndex: number;
  isResting: boolean;
  restSecondsRemaining: number;

  startSession: (session: WorkoutSession, exercises: RoutineExercise[]) => void;
  endSession: (mood?: 1 | 2 | 3 | 4 | 5) => WorkoutSession | null;
  addSet: (set: WorkoutSet) => void;
  nextExercise: () => void;
  nextSet: () => void;
  startRest: (seconds: number) => void;
  stopRest: () => void;
  tickRest: () => void;
  replaceSessionExercise: (index: number, newExerciseId: string) => void;
  skipExercise: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      sessionExercises: [],
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      isResting: false,
      restSecondsRemaining: 0,

      startSession: (session, exercises) =>
        set({
          activeSession: session,
          sessionExercises: exercises,
          currentExerciseIndex: 0,
          currentSetIndex: 0,
          isResting: false,
          restSecondsRemaining: 0,
        }),

      endSession: (mood) => {
        const { activeSession } = get();
        if (!activeSession) return null;
        const finished: WorkoutSession = {
          ...activeSession,
          finished_at: new Date().toISOString(),
          mood,
        };
        set({
          activeSession: null,
          sessionExercises: [],
          currentExerciseIndex: 0,
          currentSetIndex: 0,
          isResting: false,
        });
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

      nextExercise: () =>
        set((state) => ({
          currentExerciseIndex: state.currentExerciseIndex + 1,
          currentSetIndex: 0,
          isResting: false,
          restSecondsRemaining: 0,
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

      replaceSessionExercise: (index, newExerciseId) =>
        set((state) => ({
          sessionExercises: state.sessionExercises.map((ex, i) =>
            i === index ? { ...ex, exercise_id: newExerciseId } : ex
          ),
          currentSetIndex: 0,
        })),

      skipExercise: () =>
        set((state) => ({
          currentExerciseIndex: state.currentExerciseIndex + 1,
          currentSetIndex: 0,
          isResting: false,
          restSecondsRemaining: 0,
        })),
    }),
    {
      name: 'fitprogress-workout',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
