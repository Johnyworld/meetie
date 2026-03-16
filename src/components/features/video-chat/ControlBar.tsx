'use client';

interface ControlBarProps {
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  unreadCount: number;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onLeave: () => void;
}

export function ControlBar({
  isCameraOn,
  isMicOn,
  isScreenSharing,
  isChatOpen,
  unreadCount,
  onToggleCamera,
  onToggleMic,
  onToggleScreenShare,
  onToggleChat,
  onLeave,
}: ControlBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gray-900/90 flex items-center justify-center gap-4 px-4">
      <button
        onClick={onToggleMic}
        className={`p-3 rounded-full text-white text-sm font-medium transition-colors ${
          isMicOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'
        }`}
        title={isMicOn ? '마이크 끄기' : '마이크 켜기'}
      >
        {isMicOn ? '마이크 ON' : '마이크 OFF'}
      </button>

      <button
        onClick={onToggleCamera}
        className={`p-3 rounded-full text-white text-sm font-medium transition-colors ${
          isCameraOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'
        }`}
        title={isCameraOn ? '카메라 끄기' : '카메라 켜기'}
      >
        {isCameraOn ? '카메라 ON' : '카메라 OFF'}
      </button>

      <button
        onClick={onToggleScreenShare}
        className={`p-3 rounded-full text-white text-sm font-medium transition-colors ${
          isScreenSharing ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'
        }`}
        title={isScreenSharing ? '화면 공유 중지' : '화면 공유'}
      >
        {isScreenSharing ? '공유 중' : '화면 공유'}
      </button>

      <button
        onClick={onToggleChat}
        className={`relative p-3 rounded-full text-white text-sm font-medium transition-colors ${
          isChatOpen ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'
        }`}
        title={isChatOpen ? '채팅 닫기' : '채팅 열기'}
      >
        채팅
        {!isChatOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <button
        onClick={onLeave}
        className="p-3 rounded-full bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
        title="통화 종료"
      >
        종료
      </button>
    </div>
  );
}
