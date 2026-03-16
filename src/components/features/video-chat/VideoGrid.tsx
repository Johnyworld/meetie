'use client';

import { useEffect, useRef } from 'react';

interface RemoteVideoProps {
  stream: MediaStream;
  userId: string;
}

function RemoteVideo({ stream, userId }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <span className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-0.5 rounded">
        {userId}
      </span>
    </div>
  );
}

interface VideoGridProps {
  remoteStreams: Map<string, MediaStream>;
}

export function VideoGrid({ remoteStreams }: VideoGridProps) {
  const entries = Array.from(remoteStreams.entries());
  const count = entries.length;

  const gridClass =
    count === 0 ? 'flex items-center justify-center' :
    count === 1 ? 'grid grid-cols-1' :
    count === 2 ? 'grid grid-cols-2' :
    'grid grid-cols-2 grid-rows-2';

  return (
    <div className={`w-full h-full gap-2 p-2 ${gridClass}`}>
      {count === 0 ? (
        <p className="text-white/50 text-sm">참여자를 기다리는 중...</p>
      ) : (
        entries.map(([userId, stream]) => (
          <RemoteVideo key={userId} stream={stream} userId={userId} />
        ))
      )}
    </div>
  );
}
