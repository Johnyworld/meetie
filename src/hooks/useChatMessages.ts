'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatMessage } from '@/types/chat';

export function useChatMessages(roomId: string, senderId: string, senderName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const isChatOpenRef = useRef(false);
  const lastCreatedAtRef = useRef<string | null>(null);

  const mergeNewMessages = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !existingIds.has(m.id));
      if (fresh.length === 0) return prev;
      if (!isChatOpenRef.current) setUnreadCount((c) => c + fresh.length);
      return [...prev, ...fresh];
    });
    lastCreatedAtRef.current = incoming[incoming.length - 1].created_at;
  }, []);

  // 입장 시 최근 50건 로드
  useEffect(() => {
    supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMessages(data as ChatMessage[]);
          lastCreatedAtRef.current = data[data.length - 1].created_at;
        }
        setIsLoading(false);
      });

    // Realtime 구독 (작동 시 즉시 반영)
    const subscription = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg.room_id !== roomId) return;
          mergeNewMessages([newMsg]);
        }
      )
      .subscribe();

    // 3초 polling 폴백 (Realtime이 작동하지 않을 경우 대비)
    const interval = setInterval(async () => {
      const query = supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      if (lastCreatedAtRef.current) {
        query.gt('created_at', lastCreatedAtRef.current);
      }
      const { data } = await query;
      if (data && data.length > 0) mergeNewMessages(data as ChatMessage[]);
    }, 3000);

    return () => {
      supabase.removeChannel(subscription);
      clearInterval(interval);
    };
  }, [roomId, mergeNewMessages]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const { data } = await supabase
        .from('chat_messages')
        .insert({ room_id: roomId, sender_id: senderId, sender_name: senderName, content: trimmed })
        .select()
        .single();
      // 낙관적 업데이트: 내 메시지는 즉시 추가
      if (data) setMessages((prev) => [...prev, data as ChatMessage]);
    },
    [roomId, senderId, senderName]
  );

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
    isChatOpenRef.current = true;
  }, []);

  const markAsClosed = useCallback(() => {
    isChatOpenRef.current = false;
  }, []);

  return { messages, isLoading, sendMessage, unreadCount, markAsRead, markAsClosed };
}
