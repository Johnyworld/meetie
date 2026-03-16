'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useVideoRoom } from '@/hooks/useVideoRoom';
import { useVideoSignaling } from '@/hooks/useVideoSignaling';
import { useWebRTC } from '@/hooks/useWebRTC';
import { getUserMedia, getDisplayMedia } from '@/lib/webrtc';
import { ServerSignalMessage } from '@/types/video-chat';
import { VideoGrid } from './VideoGrid';
import { LocalVideo } from './LocalVideo';
import { ControlBar } from './ControlBar';
import { ChatPanel } from './ChatPanel';
import { ParticipantList } from './ParticipantList';
import { useChatMessages } from '@/hooks/useChatMessages';

interface VideoRoomPageProps {
  roomId: string;
  userId: string;
}

export function VideoRoomPage({ roomId, userId }: VideoRoomPageProps) {
  const router = useRouter();
  const { room, isLoading, joinRoom, leaveRoom, addParticipant, removeParticipant } = useVideoRoom(roomId);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { messages, sendMessage, unreadCount, markAsRead, markAsClosed } = useChatMessages(
    roomId,
    userId,
    userId // senderName으로 userId 사용 (인증 미구현 시)
  );

  // ref에 최신 핸들러를 저장 - stale closure 방지
  const handlersRef = useRef({
    createOffer: (_userId: string) => {},
    handleOffer: (_from: string, _sdp: RTCSessionDescriptionInit) => {},
    handleAnswer: (_from: string, _sdp: RTCSessionDescriptionInit) => {},
    handleIceCandidate: (_from: string, _candidate: RTCIceCandidateInit) => {},
    closePeer: (_userId: string) => {},
    addParticipant: (_userId: string) => {},
    removeParticipant: (_userId: string) => {},
  });

  const handleSignalMessage = useCallback((msg: ServerSignalMessage) => {
    switch (msg.type) {
      case 'user-joined':
        handlersRef.current.createOffer(msg.userId);
        handlersRef.current.addParticipant(msg.userId);
        break;
      case 'offer':         handlersRef.current.handleOffer(msg.from, msg.sdp); break;
      case 'answer':        handlersRef.current.handleAnswer(msg.from, msg.sdp); break;
      case 'ice-candidate': handlersRef.current.handleIceCandidate(msg.from, msg.candidate); break;
      case 'user-left':
        handlersRef.current.closePeer(msg.userId);
        handlersRef.current.removeParticipant(msg.userId);
        break;
    }
  }, []);

  const signaling = useVideoSignaling(roomId, userId, handleSignalMessage);
  const { remoteStreams, createOffer, handleOffer, handleAnswer, handleIceCandidate, closePeer } =
    useWebRTC(localStream, userId, signaling);

  // 매 렌더마다 ref 최신화
  handlersRef.current = { createOffer, handleOffer, handleAnswer, handleIceCandidate, closePeer, addParticipant, removeParticipant };

  // 브라우저 강제 종료 시 sendBeacon으로 서버에 퇴장 알림
  useEffect(() => {
    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        '/api/rooms/leave',
        new Blob([JSON.stringify({ roomId, userId })], { type: 'application/json' }),
      );
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [roomId, userId]);

  // 로컬 스트림 초기화
  useEffect(() => {
    getUserMedia().then(setLocalStream);
    return () => {
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 방 입장
  useEffect(() => {
    if (!isLoading && room) {
      joinRoom(userId);
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCamera = useCallback(() => {
    localStream?.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCameraOn((prev) => !prev);
  }, [localStream]);

  const toggleMic = useCallback(() => {
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMicOn((prev) => !prev);
  }, [localStream]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // 화면 공유 중지 → 카메라로 복귀
      const camStream = await getUserMedia({ video: true, audio: false });
      const videoTrack = camStream.getVideoTracks()[0];
      setLocalStream((prev) => {
        if (!prev) return camStream;
        const next = new MediaStream([...prev.getAudioTracks(), videoTrack]);
        return next;
      });
      setIsScreenSharing(false);
    } else {
      const screenStream = await getDisplayMedia();
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrack.onended = () => setIsScreenSharing(false);
      setLocalStream((prev) => {
        if (!prev) return screenStream;
        const next = new MediaStream([...prev.getAudioTracks(), screenTrack]);
        return next;
      });
      setIsScreenSharing(true);
    }
  }, [isScreenSharing]);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      if (!prev) {
        markAsRead();
      } else {
        markAsClosed();
      }
      return !prev;
    });
  }, [markAsRead, markAsClosed]);

  const handleLeave = useCallback(async () => {
    localStream?.getTracks().forEach((t) => t.stop());
    await leaveRoom(userId);
    router.back();
  }, [localStream, leaveRoom, userId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        방에 입장 중...
      </div>
    );
  }

  if (!room || room.status === 'ended') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        종료된 통화입니다.
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen bg-gray-900 overflow-hidden">
      {/* 영상 영역 */}
      <div className="relative flex-1 overflow-hidden">
        <VideoGrid remoteStreams={remoteStreams} />
        <ParticipantList participants={room.participants} currentUserId={userId} />
        <LocalVideo stream={localStream} isCameraOn={isCameraOn} />
        <ControlBar
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          isScreenSharing={isScreenSharing}
          isChatOpen={isChatOpen}
          unreadCount={unreadCount}
          onToggleCamera={toggleCamera}
          onToggleMic={toggleMic}
          onToggleScreenShare={toggleScreenShare}
          onToggleChat={toggleChat}
          onLeave={handleLeave}
        />
      </div>
      {/* 채팅 패널 */}
      <ChatPanel
        messages={messages}
        currentUserId={userId}
        isOpen={isChatOpen}
        onClose={toggleChat}
        onSend={sendMessage}
      />
    </div>
  );
}
