'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPeerConnection } from '@/lib/webrtc';
import { useVideoSignaling } from './useVideoSignaling';

type Signaling = ReturnType<typeof useVideoSignaling>;

export function useWebRTC(
  localStream: MediaStream | null,
  userId: string,
  signaling: Signaling,
) {
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const getOrCreatePeer = useCallback((targetUserId: string): RTCPeerConnection => {
    if (peersRef.current.has(targetUserId)) {
      return peersRef.current.get(targetUserId)!;
    }

    const pc = createPeerConnection();

    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => new Map(prev).set(targetUserId, event.streams[0]));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signaling.sendIceCandidate(targetUserId, event.candidate.toJSON());
      }
    };

    peersRef.current.set(targetUserId, pc);
    return pc;
  }, [localStream, signaling]);

  const createOffer = useCallback(async (targetUserId: string) => {
    const pc = getOrCreatePeer(targetUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    signaling.sendOffer(targetUserId, offer);
  }, [getOrCreatePeer, signaling]);

  const handleOffer = useCallback(async (from: string, sdp: RTCSessionDescriptionInit) => {
    const pc = getOrCreatePeer(from);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    signaling.sendAnswer(from, answer);
  }, [getOrCreatePeer, signaling]);

  const handleAnswer = useCallback((from: string, sdp: RTCSessionDescriptionInit) => {
    peersRef.current.get(from)?.setRemoteDescription(new RTCSessionDescription(sdp));
  }, []);

  const handleIceCandidate = useCallback((from: string, candidate: RTCIceCandidateInit) => {
    peersRef.current.get(from)?.addIceCandidate(new RTCIceCandidate(candidate));
  }, []);

  const closePeer = useCallback((targetUserId: string) => {
    peersRef.current.get(targetUserId)?.close();
    peersRef.current.delete(targetUserId);
    setRemoteStreams((prev) => {
      const next = new Map(prev);
      next.delete(targetUserId);
      return next;
    });
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
    };
  }, []);

  return { remoteStreams, createOffer, handleOffer, handleAnswer, handleIceCandidate, closePeer };
}
