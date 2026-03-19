'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';

export default function SetupProfilePage() {
  const router = useRouter();
  const { fetchMe, user } = useAuthStore();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 로그인 상태 확인
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (user === null) router.replace('/login');
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nickname.trim()) { setError('닉네임을 입력해주세요.'); return; }
    if (nickname.trim().length < 2 || nickname.trim().length > 20) {
      setError('닉네임은 2~20자여야 합니다.'); return;
    }
    setIsLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ nickname: nickname.trim() })
        .eq('id', authUser.id);
      if (updateError) throw updateError;
      await fetchMe();
      router.replace('/');
    } catch {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">닉네임 설정</h1>
          <p className="mt-1 text-sm text-gray-400">meetie에서 사용할 닉네임을 입력해주세요</p>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
            )}
            <div>
              <label className="mb-1.5 block text-sm text-gray-400">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                placeholder="2~20자 닉네임을 입력하세요"
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? '저장 중...' : '시작하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
