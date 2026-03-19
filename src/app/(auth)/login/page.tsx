'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/features/auth/LoginForm';
import { RegisterForm } from '@/components/features/auth/RegisterForm';
import { GoogleLoginButton } from '@/components/features/auth/GoogleLoginButton';
import { useAuthStore } from '@/stores/auth-store';

type Tab = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('login');

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">meetie</h1>
          <p className="mt-1 text-sm text-gray-400">화상 채팅을 시작하세요</p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          {/* 탭 */}
          <div className="mb-6 flex rounded-xl bg-gray-800 p-1">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                tab === 'login' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                tab === 'register' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              회원가입
            </button>
          </div>

          {tab === 'login' ? <LoginForm /> : <RegisterForm />}

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-700" />
            <span className="text-xs text-gray-500">또는</span>
            <div className="h-px flex-1 bg-gray-700" />
          </div>

          <GoogleLoginButton />
        </div>
      </div>
    </div>
  );
}
