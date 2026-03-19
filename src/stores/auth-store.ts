import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      isLoading: false,

      setUser: user => set({ user }),

      signIn: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          set({
            user: {
              id: data.user.id,
              email: data.user.email!,
              nickname: profile?.nickname ?? email.split('@')[0],
              provider: 'email',
            },
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signUp: async (email, password, nickname) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { nickname } },
          });
          if (error) throw error;
          const isAlreadyRegisteredByEmail = data.user?.email_confirmed_at;
          const isAlreadyRegisteredByOAuth = data.user?.identities?.length === 0;
          if (isAlreadyRegisteredByEmail || isAlreadyRegisteredByOAuth) {
            throw new Error('already registered');
          }
          set({
            user: {
              id: data.user!.id,
              email: data.user!.email!,
              nickname,
              provider: 'email',
            },
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signInWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null });
      },

      fetchMe: async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          set({ user: null });
          return;
        }
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        set({
          user: {
            id: user.id,
            email: user.email!,
            nickname: profile?.nickname ?? user.email!.split('@')[0],
            provider: (profile?.provider ?? 'email') as 'email' | 'google',
          },
        });
      },
    }),
    {
      name: 'meetie-auth',
      version: 1,
      migrate: () => ({ user: null, isLoading: false }),
    },
  ),
);
