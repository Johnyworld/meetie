'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { VideoRoom } from '@/types/video-chat';

export function useVideoRoom(roomId: string) {
  const [room, setRoom] = useState<VideoRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('video_rooms')
      .select('*')
      .eq('id', roomId)
      .single()
      .then(({ data }) => {
        setRoom(data);
        setIsLoading(false);
      });
  }, [roomId]);

  const joinRoom = useCallback(async (userId: string) => {
    if (!room) return;
    const { data } = await supabase
      .from('video_rooms')
      .update({
        participants: [...new Set([...room.participants, userId])],
        status: 'active',
        started_at: room.started_at ?? new Date().toISOString(),
      })
      .eq('id', roomId)
      .select()
      .single();
    if (data) setRoom(data);
  }, [room, roomId]);

  const leaveRoom = useCallback(async (userId: string) => {
    if (!room) return;
    const remaining = room.participants.filter((id) => id !== userId);
    const { data } = await supabase
      .from('video_rooms')
      .update({
        participants: remaining,
        ...(remaining.length === 0 && {
          status: 'ended',
          ended_at: new Date().toISOString(),
        }),
      })
      .eq('id', roomId)
      .select()
      .single();
    if (data) setRoom(data);
  }, [room, roomId]);

  const endRoom = useCallback(async () => {
    const { data } = await supabase
      .from('video_rooms')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
        participants: [],
      })
      .eq('id', roomId)
      .select()
      .single();
    if (data) setRoom(data);
  }, [roomId]);

  return { room, isLoading, joinRoom, leaveRoom, endRoom };
}
