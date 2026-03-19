'use client';

import { use } from 'react';
import { VideoRoomPage } from '@/components/features/video-chat/VideoRoomPage';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import { useAuthStore } from '@/stores/auth-store';

interface PageProps {
  params: Promise<{ roomId: string }>;
}

function RoomContent({ roomId }: { roomId: string }) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.nickname ?? user?.id ?? 'unknown';

  return <VideoRoomPage roomId={roomId} userId={userId} />;
}

export default function RoomPage({ params }: PageProps) {
  const { roomId } = use(params);

  return (
    <ProtectedRoute>
      <RoomContent roomId={roomId} />
    </ProtectedRoute>
  );
}
