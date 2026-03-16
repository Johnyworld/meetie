'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface VideoStartButtonProps {
  meetingId: string;
  currentUserId: string;
  participants: string[];
}

export function VideoStartButton({ meetingId, currentUserId, participants }: VideoStartButtonProps) {
  const router = useRouter();

  const handleStart = async () => {
    const { data: room, error } = await supabase
      .from('video_rooms')
      .insert({
        host_user_id: currentUserId,
        participants: [currentUserId],
        status: 'waiting',
        started_at: null,
        ended_at: null,
      })
      .select()
      .single();

    if (error) {
      console.error('[VideoStartButton]', error);
      return;
    }
    router.push(`/rooms/${room.id}`);
  };

  return (
    <button
      onClick={handleStart}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
    >
      화상 시작
    </button>
  );
}
