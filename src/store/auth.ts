import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  referralCode: string;
  emailVerified?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  login: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hu_token', token);
      localStorage.setItem('hu_user', JSON.stringify(user));
    }
    set({ user, token, isLoading: false });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hu_token');
      localStorage.removeItem('hu_user');
    }
    set({ user: null, token: null, isLoading: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
  updateUser: (updates) =>
    set((state) => {
      const newUser = state.user ? { ...state.user, ...updates } : null;
      if (typeof window !== 'undefined' && newUser) {
        localStorage.setItem('hu_user', JSON.stringify(newUser));
      }
      return { user: newUser };
    }),
}));
