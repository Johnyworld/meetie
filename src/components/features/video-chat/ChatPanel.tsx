'use client';

import { ChatMessage } from '@/types/chat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onSend: (content: string) => void;
}

export function ChatPanel({ messages, currentUserId, isOpen, onClose, onSend }: ChatPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="w-80 h-full bg-gray-800 border-l border-gray-700 flex flex-col shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <span className="text-white text-sm font-medium">채팅</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-lg leading-none transition-colors"
          title="채팅 닫기"
        >
          ×
        </button>
      </div>
      <MessageList messages={messages} currentUserId={currentUserId} />
      <MessageInput onSend={onSend} />
    </div>
  );
}
