'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
}

function formatDateLabel(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm px-4 text-center">
        아직 메시지가 없습니다.
        <br />첫 메시지를 보내보세요!
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
      {messages.map((msg, index) => {
        const showDateSeparator =
          index === 0 || !isSameDay(messages[index - 1].created_at, msg.created_at);
        return (
          <div key={msg.id} className="flex flex-col gap-3">
            {showDateSeparator && (
              <div className="flex items-center gap-2 my-1">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-xs text-gray-500 shrink-0">
                  {formatDateLabel(msg.created_at)}
                </span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>
            )}
            <MessageItem message={msg} isMine={msg.sender_id === currentUserId} />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
