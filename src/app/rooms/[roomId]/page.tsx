'use client';

import { use } from 'react';
import { VideoRoomPage } from '@/components/features/video-chat/VideoRoomPage';
import { getTempUserId } from '@/lib/user';

interface PageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const { roomId } = use(params);
  const userId = getTempUserId();

  return <VideoRoomPage roomId={roomId} userId={userId} />;
}
