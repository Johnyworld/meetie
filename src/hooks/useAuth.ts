import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const { user, isLoading, signIn, signUp, signInWithGoogle, signOut } = useAuthStore();

  return { user, isLoading, signIn, signUp, signInWithGoogle, signOut };
}
