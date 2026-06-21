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
  updateRoutineExercise: (routineId: string, exerciseId: string, updates: Partial<RoutineExercise>) => void;
  moveExercise: (routineId: string, exerciseId: string, direction: 'up' | 'down') => void;
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
      updateRoutineExercise: (routineId, exerciseId, updates) =>
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === routineId
              ? {
                  ...r,
                  exercises: r.exercises.map((e) =>
                    e.exercise_id === exerciseId ? { ...e, ...updates } : e
                  ),
                  updated_at: new Date().toISOString(),
                }
              : r
          ),
        })),
      moveExercise: (routineId, exerciseId, direction) =>
        set((state) => ({
          routines: state.routines.map((r) => {
            if (r.id !== routineId) return r;
            const idx = r.exercises.findIndex((e) => e.exercise_id === exerciseId);
            if (idx === -1) return r;
            const target = direction === 'up' ? idx - 1 : idx + 1;
            if (target < 0 || target >= r.exercises.length) return r;
            const reordered = [...r.exercises];
            [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
            const withOrder = reordered.map((e, i) => ({ ...e, order: i }));
            return { ...r, exercises: withOrder, updated_at: new Date().toISOString() };
          }),
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
