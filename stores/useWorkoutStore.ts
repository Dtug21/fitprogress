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
  restEndsAt: number | null; // epoch ms — permite que el descanso siga si se bloquea el celular

  startSession: (session: WorkoutSession, exercises: RoutineExercise[]) => void;
  endSession: (mood?: 1 | 2 | 3 | 4 | 5) => WorkoutSession | null;
  addSet: (set: WorkoutSet) => void;
  addExerciseToSession: (exercise: RoutineExercise) => void;
  incrementCurrentExerciseSets: () => void;
  updateSet: (setId: string, updates: Partial<WorkoutSet>) => void;
  removeSet: (setId: string) => void;
  nextExercise: () => void;
  prevExercise: () => void;
  nextSet: () => void;
  startRest: (seconds: number) => void;
  addRestSeconds: (delta: number) => void;
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
      restEndsAt: null,

      startSession: (session, exercises) =>
        set({
          activeSession: session,
          sessionExercises: exercises,
          currentExerciseIndex: 0,
          currentSetIndex: 0,
          isResting: false,
          restSecondsRemaining: 0,
          restEndsAt: null,
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

      // Agrega un ejercicio a la sesión en curso (entrenamiento libre o extra).
      // No toca currentSetIndex: si estás a mitad de un ejercicio sigues ahí;
      // el nuevo queda al final de la cola.
      addExerciseToSession: (exercise) =>
        set((state) => ({
          sessionExercises: [...state.sessionExercises, exercise],
        })),

      // Suma una serie al ejercicio actual (rutina o libre)
      incrementCurrentExerciseSets: () =>
        set((state) => ({
          sessionExercises: state.sessionExercises.map((ex, i) =>
            i === state.currentExerciseIndex
              ? { ...ex, target_sets: ex.target_sets + 1 }
              : ex
          ),
        })),

      // Corrige una serie ya registrada
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

      // Borra una serie registrada por error
      removeSet: (setId) =>
        set((state) => {
          if (!state.activeSession) return state;
          return {
            activeSession: {
              ...state.activeSession,
              sets: state.activeSession.sets.filter((s) => s.id !== setId),
            },
          };
        }),

      nextExercise: () =>
        set((state) => ({
          currentExerciseIndex: state.currentExerciseIndex + 1,
          currentSetIndex: 0,
          isResting: false,
          restSecondsRemaining: 0,
          restEndsAt: null,
        })),

      prevExercise: () =>
        set((state) => ({
          currentExerciseIndex: Math.max(0, state.currentExerciseIndex - 1),
          currentSetIndex: 0,
          isResting: false,
          restSecondsRemaining: 0,
          restEndsAt: null,
        })),

      nextSet: () =>
        set((state) => ({ currentSetIndex: state.currentSetIndex + 1 })),

      // El descanso se basa en un timestamp objetivo, no en un contador.
      // Así sigue corriendo aunque la app se suspenda o el celular se bloquee.
      startRest: (seconds) =>
        set({ isResting: true, restSecondsRemaining: seconds, restEndsAt: Date.now() + seconds * 1000 }),

      addRestSeconds: (delta) =>
        set((state) => {
          if (!state.isResting || state.restEndsAt == null) return state;
          const newEnd = Math.max(Date.now(), state.restEndsAt + delta * 1000);
          return {
            restEndsAt: newEnd,
            restSecondsRemaining: Math.max(0, Math.round((newEnd - Date.now()) / 1000)),
          };
        }),

      stopRest: () =>
        set({ isResting: false, restSecondsRemaining: 0, restEndsAt: null }),

      tickRest: () =>
        set((state) => {
          if (!state.isResting || state.restEndsAt == null) return state;
          const remaining = Math.max(0, Math.round((state.restEndsAt - Date.now()) / 1000));
          if (remaining <= 0) return { isResting: false, restSecondsRemaining: 0, restEndsAt: null };
          return { restSecondsRemaining: remaining };
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
          restEndsAt: null,
        })),
    }),
    {
      name: 'fitprogress-workout',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
