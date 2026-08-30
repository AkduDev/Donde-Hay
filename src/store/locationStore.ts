/**
 * Dónde Hay - Location Store
 * Estado global de geolocalización del usuario
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserLocation {
  latitude: number;
  longitude: number;
  city?: string;
  province?: string;
}

interface LocationState {
  userLocation: UserLocation | null;
  selectedRadius: number;
  recentSearches: {
    latitude: number;
    longitude: number;
    label: string;
    timestamp: number;
  }[];

  setUserLocation: (location: UserLocation | null) => void;
  setSelectedRadius: (radius: number) => void;
  addRecentSearch: (search: {
    latitude: number;
    longitude: number;
    label: string;
  }) => void;
  clearRecentSearches: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      userLocation: null,
      selectedRadius: 25,
      recentSearches: [],

      setUserLocation: (location) => set({ userLocation: location }),

      setSelectedRadius: (radius) => set({ selectedRadius: radius }),

      addRecentSearch: (search) =>
        set((state) => ({
          recentSearches: [
            { ...search, timestamp: Date.now() },
            ...state.recentSearches.slice(0, 9),
          ],
        })),

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'location-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useLocationStore;
