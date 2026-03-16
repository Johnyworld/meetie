'use client';

import { useVideoRoomList } from '@/hooks/useVideoRoomList';
import { VideoRoomCard } from './VideoRoomCard';

export function VideoRoomList() {
  const { rooms, isLoading } = useVideoRoomList();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-800" />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-700 py-16 text-center">
        <p className="text-gray-400">아직 열린 방이 없습니다.</p>
        <p className="mt-1 text-sm text-gray-600">첫 번째 방을 만들어보세요!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <VideoRoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
