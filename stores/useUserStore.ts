import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Equipment, Goal } from '../types';

const DEFAULT_HOME_EQUIPMENT: Equipment[] = [
  'dumbbells',
  'adjustable_bench',
  'straight_barbell',
  'ez_bar',
  'w_bar',
  'long_bands',
  'short_bands',
  'ab_wheel',
  'jump_rope',
  'hand_grippers',
  'bodyweight',
];

interface UserState {
  profile: UserProfile;
  setName: (name: string) => void;
  setMode: (mode: 'home' | 'gym') => void;
  setEquipment: (equipment: Equipment[]) => void;
  setGoals: (goals: Goal[]) => void;
  completeOnboarding: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: {
        name: '',
        mode: 'gym',
        experience_level: 'intermediate',
        goals: [],
        home_equipment: DEFAULT_HOME_EQUIPMENT,
        onboarding_completed: false,
        days_per_week: 4,
      },
      setName: (name) =>
        set((state) => ({ profile: { ...state.profile, name } })),
      setMode: (mode) =>
        set((state) => ({ profile: { ...state.profile, mode } })),
      setEquipment: (equipment) =>
        set((state) => ({ profile: { ...state.profile, home_equipment: equipment } })),
      setGoals: (goals) =>
        set((state) => ({ profile: { ...state.profile, goals } })),
      completeOnboarding: () =>
        set((state) => ({ profile: { ...state.profile, onboarding_completed: true } })),
      updateProfile: (updates) =>
        set((state) => ({ profile: { ...state.profile, ...updates } })),
    }),
    {
      name: 'fitprogress-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
