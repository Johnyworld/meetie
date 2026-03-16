'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ServerSignalMessage } from '@/types/video-chat';

export function useVideoSignaling(
  roomId: string,
  userId: string,
  onMessage: (msg: ServerSignalMessage) => void,
) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const isSubscribed = useRef(false);

  useEffect(() => {
    const channel = supabase.channel(`video-room:${roomId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'user-joined' }, ({ payload }) => {
        if (payload.userId !== userId) {
          onMessageRef.current({ type: 'user-joined', userId: payload.userId, participants: payload.participants });
        }
      })
      .on('broadcast', { event: 'user-left' }, ({ payload }) => {
        onMessageRef.current({ type: 'user-left', userId: payload.userId, participants: payload.participants });
      })
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribed.current = true;
          channel.send({
            type: 'broadcast',
            event: 'user-joined',
            payload: { userId, participants: [] },
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.send({
        type: 'broadcast',
        event: 'user-left',
        payload: { userId, participants: [] },
      });
      supabase.removeChannel(channel);
      isSubscribed.current = false;
    };
  }, [roomId, userId]);

  const sendOffer = useCallback((to: string, sdp: RTCSessionDescriptionInit) => {
    channelRef.current?.send({ type: 'broadcast', event: 'offer', payload: { from: userId, to, sdp } });
  }, [userId]);

  const sendAnswer = useCallback((to: string, sdp: RTCSessionDescriptionInit) => {
    channelRef.current?.send({ type: 'broadcast', event: 'answer', payload: { from: userId, to, sdp } });
  }, [userId]);

  const sendIceCandidate = useCallback((to: string, candidate: RTCIceCandidateInit) => {
    channelRef.current?.send({ type: 'broadcast', event: 'ice-candidate', payload: { from: userId, to, candidate } });
  }, [userId]);

  return {
    isConnected: isSubscribed.current,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
  };
}
