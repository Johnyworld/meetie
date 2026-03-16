'use client';

import { ChatMessage } from '@/types/chat';

interface MessageItemProps {
  message: ChatMessage;
  isMine: boolean;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function MessageItem({ message, isMine }: MessageItemProps) {
  return (
    <div className={`flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
      {!isMine && (
        <span className="text-xs text-gray-400 px-1">{message.sender_name}</span>
      )}
      <div className={`flex items-end gap-1.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        <div
          className={`max-w-[200px] px-3 py-2 rounded-2xl text-sm break-words ${
            isMine
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-700 text-gray-100 rounded-bl-sm'
          }`}
        >
          {message.content}
        </div>
        <span className="text-xs text-gray-500 shrink-0 pb-0.5">
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}
