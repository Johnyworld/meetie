'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface RegisterFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
}

export function RegisterForm({ email, setEmail, password, setPassword }: RegisterFormProps) {
  const router = useRouter();
  const { signUp, isLoading } = useAuth();
  const [nickname, setNickname] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const validate = () => {
    if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    if (password !== confirmPassword) return '비밀번호가 일치하지 않습니다.';
    if (!nickname.trim()) return '닉네임을 입력해주세요.';
    if (nickname.trim().length < 2 || nickname.trim().length > 20) return '닉네임은 2~20자여야 합니다.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      await signUp(email, password, nickname.trim());
      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('already registered') || message.includes('already been registered')) {
        setError('이미 사용 중인 이메일입니다.');
      } else {
        setError('오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>
      )}
      <div>
        <label className="mb-1.5 block text-sm text-gray-400">이메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="이메일을 입력하세요"
          className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-gray-400">비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="8자 이상 입력하세요"
          className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-gray-400">비밀번호 확인</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="비밀번호를 다시 입력하세요"
          className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
        />
      </div>
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
        {isLoading ? '가입 중...' : '회원가입'}
      </button>
    </form>
  );
}
