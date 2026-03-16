'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatMessage } from '@/types/chat';

export function useChatMessages(roomId: string, senderId: string, senderName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const isChatOpenRef = useRef(false);

  // 입장 시 최근 50건 로드
  useEffect(() => {
    supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[]);
        setIsLoading(false);
      });

    // Realtime 구독 - 새 메시지 실시간 수신 (클라이언트 필터링이 더 안정적)
    const subscription = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (newMsg.room_id !== roomId) return;
          // 이미 추가된 메시지(낙관적 업데이트) 중복 방지
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            if (!isChatOpenRef.current) setUnreadCount((c) => c + 1);
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [roomId]);

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
