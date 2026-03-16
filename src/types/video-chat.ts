import { BaseDocument } from './index';

export interface VideoRoom extends BaseDocument {
  name: string;
  host_user_id: string;
  participants: string[];
  is_public: boolean;
  status: 'waiting' | 'active' | 'ended';
  started_at: string | null;
  ended_at: string | null;
}

// WebSocket 시그널링 메시지 타입

export type ClientSignalMessage =
  | { type: 'join'; roomId: string; userId: string }
  | { type: 'offer'; to: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; to: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; to: string; candidate: RTCIceCandidateInit }
  | { type: 'leave'; roomId: string; userId: string };

export type ServerSignalMessage =
  | { type: 'user-joined'; userId: string; participants: string[] }
  | { type: 'user-left'; userId: string; participants: string[] }
  | { type: 'offer'; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; from: string; candidate: RTCIceCandidateInit };
