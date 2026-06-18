import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Routine, RoutineExercise } from '../types';

interface RoutineState {
  routines: Routine[];
  addRoutine: (routine: Routine) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  addExerciseToRoutine: (routineId: string, exercise: RoutineExercise) => void;
  removeExerciseFromRoutine: (routineId: string, exerciseId: string) => void;
  reorderExercises: (routineId: string, exercises: RoutineExercise[]) => void;
  getRoutineById: (id: string) => Routine | undefined;
  getTodayRoutine: (dayOfWeek: number) => Routine | undefined;
}

export const useRoutineStore = create<RoutineState>()(
  persist(
    (set, get) => ({
      routines: [],
      addRoutine: (routine) =>
        set((state) => ({ routines: [...state.routines, routine] })),
      updateRoutine: (id, updates) =>
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r
          ),
        })),
      deleteRoutine: (id) =>
        set((state) => ({ routines: state.routines.filter((r) => r.id !== id) })),
      addExerciseToRoutine: (routineId, exercise) =>
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === routineId
              ? {
                  ...r,
                  exercises: [...r.exercises, exercise],
                  updated_at: new Date().toISOString(),
                }
              : r
          ),
        })),
      removeExerciseFromRoutine: (routineId, exerciseId) =>
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === routineId
              ? {
                  ...r,
                  exercises: r.exercises.filter((e) => e.exercise_id !== exerciseId),
                  updated_at: new Date().toISOString(),
                }
              : r
          ),
        })),
      reorderExercises: (routineId, exercises) =>
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === routineId
              ? { ...r, exercises, updated_at: new Date().toISOString() }
              : r
          ),
        })),
      getRoutineById: (id) => get().routines.find((r) => r.id === id),
      getTodayRoutine: (dayOfWeek) =>
        get().routines.find((r) => r.day_of_week.includes(dayOfWeek)),
    }),
    {
      name: 'fitprogress-routines',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
