'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ServerSignalMessage } from '@/types/video-chat';

export function useVideoSignaling(roomId: string, userId: string, onMessage: (msg: ServerSignalMessage) => void) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const isSubscribed = useRef(false);

  useEffect(() => {
    const channel = supabase.channel(`video-room:${roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: userId },
      },
    });

    channel
      // Presence: 브라우저 강제 종료 포함 disconnect 자동 감지
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('[Presence] join raw:', JSON.stringify(newPresences));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        newPresences.forEach((p: any) => {
          if (p.userId !== userId) {
            onMessageRef.current({ type: 'user-joined', userId: p.userId, participants: [] });
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('[Presence] leave raw:', JSON.stringify(leftPresences));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        leftPresences.forEach((p: any) => {
          if (p.userId !== userId) {
            console.log('[Presence] user left, calling removeParticipant for:', p.userId);
            onMessageRef.current({ type: 'user-left', userId: p.userId, participants: [] });
          }
        });
      })
      // WebRTC 시그널링 (P2P 메시지)
      .on('broadcast', { event: 'offer' }, ({ payload }) => {
        if (payload.to === userId) {
          onMessageRef.current({ type: 'offer', from: payload.from, sdp: payload.sdp });
        }
      })
      .on('broadcast', { event: 'answer' }, ({ payload }) => {
        if (payload.to === userId) {
          onMessageRef.current({ type: 'answer', from: payload.from, sdp: payload.sdp });
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
        if (payload.to === userId) {
          onMessageRef.current({ type: 'ice-candidate', from: payload.from, candidate: payload.candidate });
        }
      })
      .subscribe(async status => {
        console.log('[Signaling] channel status:', status);
        if (status === 'SUBSCRIBED') {
          isSubscribed.current = true;
          const trackResult = await channel.track({ userId });
          console.log('[Signaling] track result:', trackResult);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      isSubscribed.current = false;
    };
  }, [roomId, userId]);

  const sendOffer = useCallback(
    (to: string, sdp: RTCSessionDescriptionInit) => {
      channelRef.current?.send({ type: 'broadcast', event: 'offer', payload: { from: userId, to, sdp } });
    },
    [userId],
  );

  const sendAnswer = useCallback(
    (to: string, sdp: RTCSessionDescriptionInit) => {
      channelRef.current?.send({ type: 'broadcast', event: 'answer', payload: { from: userId, to, sdp } });
    },
    [userId],
  );

  const sendIceCandidate = useCallback(
    (to: string, candidate: RTCIceCandidateInit) => {
      channelRef.current?.send({ type: 'broadcast', event: 'ice-candidate', payload: { from: userId, to, candidate } });
    },
    [userId],
  );

  return {
    isConnected: isSubscribed.current,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
  };
}
