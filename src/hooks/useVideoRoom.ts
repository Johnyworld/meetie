'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { VideoRoom } from '@/types/video-chat';

export function useVideoRoom(roomId: string) {
  const [room, setRoom] = useState<VideoRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 초기 fetch
    supabase
      .from('video_rooms')
      .select('*')
      .eq('id', roomId)
      .single()
      .then(({ data }) => {
        setRoom(data);
        setIsLoading(false);
      });

    // Realtime DB 구독 - 다른 유저의 변경사항 실시간 반영 (클라이언트 필터링)
    const subscription = supabase
      .channel(`room-db:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'video_rooms' },
        (payload) => {
          const updated = payload.new as VideoRoom;
          if (updated.id !== roomId) return;
          setRoom(updated);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
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

  // 다른 유저가 강제 종료 시 해당 유저를 participants에서 제거
  const removeParticipant = useCallback(async (participantId: string) => {
    const { data: current } = await supabase
      .from('video_rooms')
      .select('participants')
      .eq('id', roomId)
      .single();
    if (!current) return;
    const remaining = current.participants.filter((id: string) => id !== participantId);
    const update = {
      participants: remaining,
      ...(remaining.length === 0 && {
        status: 'ended' as const,
        ended_at: new Date().toISOString(),
      }),
    };
    await supabase.from('video_rooms').update(update).eq('id', roomId);
    // Realtime 외에 로컬 state도 즉시 반영
    setRoom((prev) => (prev ? { ...prev, ...update } : prev));
  }, [roomId]);

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

  const addParticipant = useCallback((participantId: string) => {
    setRoom((prev) => {
      if (!prev || prev.participants.includes(participantId)) return prev;
      return { ...prev, participants: [...prev.participants, participantId] };
    });
  }, []);

  return { room, isLoading, joinRoom, leaveRoom, addParticipant, removeParticipant, endRoom };
}
