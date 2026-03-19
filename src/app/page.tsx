'use client';

import { useState } from 'react';
import { VideoRoomList } from '@/components/features/video-chat/VideoRoomList';
import { CreateRoomModal } from '@/components/features/video-chat/CreateRoomModal';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import { useAuthStore } from '@/stores/auth-store';

function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, signOut } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">meetie</h1>
            <p className="mt-1 text-sm text-gray-400">누구나 참여할 수 있는 화상 채팅</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{user?.nickname}</span>
            <button
              onClick={signOut}
              className="rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              로그아웃
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
            >
              + 방 만들기
            </button>
          </div>
        </header>

        <section>
          <h2 className="mb-4 text-sm font-medium text-gray-400 uppercase tracking-wider">
            열린 채팅방
          </h2>
          <VideoRoomList />
        </section>
      </div>

      <CreateRoomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  );
}
