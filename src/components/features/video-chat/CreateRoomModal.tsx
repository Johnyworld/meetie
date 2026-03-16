'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTempUserId } from '@/lib/user';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('방 이름을 입력해주세요.');
      return;
    }
    if (trimmed.length > 30) {
      setError('방 이름은 30자 이내로 입력해주세요.');
      return;
    }

    setIsCreating(true);
    setError('');
    try {
      const userId = getTempUserId();
      const { data: room, error: supabaseError } = await supabase
        .from('video_rooms')
        .insert({
          name: trimmed,
          host_user_id: userId,
          participants: [userId],
          is_public: true,
          status: 'waiting',
          started_at: null,
          ended_at: null,
        })
        .select()
        .single();

      if (supabaseError) throw supabaseError;
      onClose();
      router.push(`/rooms/${room.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(`방 생성 실패: ${message}`);
      console.error('[CreateRoom]', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">새 채팅방 만들기</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            ✕
          </button>
        </div>

        <label className="mb-1 block text-sm font-medium text-gray-300">방 이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          placeholder="예: 팀 스터디"
          maxLength={30}
          autoFocus
          className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-white placeholder-gray-500 outline-none ring-1 ring-gray-700 focus:ring-blue-500"
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        <p className="mt-1 text-right text-xs text-gray-600">{name.length}/30</p>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-800 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700"
          >
            취소
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {isCreating ? '생성 중...' : '만들기'}
          </button>
        </div>
      </div>
    </div>
  );
}
