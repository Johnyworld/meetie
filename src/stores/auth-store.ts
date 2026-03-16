import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

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
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          const u = data.user;
          set({ user: { id: u.id, email: u.email!, name: u.user_metadata?.name }, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null });
      },

      fetchMe: async () => {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const u = data.user;
          set({ user: { id: u.id, email: u.email!, name: u.user_metadata?.name } });
        } else {
          set({ user: null });
        }
      },
    }),
    { name: 'meetie-auth' }
  )
);
