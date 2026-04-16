import { create } from 'zustand';

interface LoaderState {
  isLoading: boolean;
  message: string;
  showLoader: (msg?: string) => void;
  hideLoader: () => void;
}

export const useLoaderStore = create<LoaderState>((set) => ({
  isLoading: false,
  message: 'Loading...',
  showLoader: (msg = 'Loading...') => set({ isLoading: true, message: msg }),
  hideLoader: () => set({ isLoading: false }),
}));