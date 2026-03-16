import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { bkend } from '@/lib/bkend';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { user, accessToken, refreshToken } = await bkend.auth.signin({ email, password });
          localStorage.setItem('bkend_access_token', accessToken);
          localStorage.setItem('bkend_refresh_token', refreshToken);
          set({ user, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await bkend.auth.signout();
        } finally {
          localStorage.removeItem('bkend_access_token');
          localStorage.removeItem('bkend_refresh_token');
          set({ user: null });
        }
      },

      fetchMe: async () => {
        try {
          const user = await bkend.auth.me();
          set({ user });
        } catch {
          set({ user: null });
        }
      },
    }),
    { name: 'meetie-auth' }
  )
);
