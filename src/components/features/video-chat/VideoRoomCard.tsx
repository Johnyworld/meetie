'use client';

import { useRouter } from 'next/navigation';
import { VideoRoom } from '@/types/video-chat';

const MAX_PARTICIPANTS = 4;

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return '방금 전';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  return `${hours}시간 전`;
}

interface VideoRoomCardProps {
  room: VideoRoom;
}

export function VideoRoomCard({ room }: VideoRoomCardProps) {
  const router = useRouter();
  const isFull = room.participants.length >= MAX_PARTICIPANTS;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-gray-800 p-4 transition-colors hover:bg-gray-750">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white leading-snug line-clamp-2">{room.name}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            room.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-300'
          }`}
        >
          {room.status === 'active' ? '진행 중' : '대기'}
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-400">
        <span>
          참여자 {room.participants.length}/{MAX_PARTICIPANTS}
        </span>
        <span>·</span>
        <span>{timeAgo(room.created_at)}</span>
      </div>

      <button
        onClick={() => router.push(`/rooms/${room.id}`)}
        disabled={isFull}
        className={`mt-1 w-full rounded-lg py-2 text-sm font-medium transition-colors ${
          isFull
            ? 'cursor-not-allowed bg-gray-700 text-gray-500'
            : 'bg-blue-600 text-white hover:bg-blue-500'
        }`}
      >
        {isFull ? '만석' : '입장'}
      </button>
    </div>
  );
}
