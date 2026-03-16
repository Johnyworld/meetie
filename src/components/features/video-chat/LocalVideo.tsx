'use client';

import { useEffect, useRef } from 'react';

interface LocalVideoProps {
  stream: MediaStream | null;
  isCameraOn: boolean;
}

export function LocalVideo({ stream, isCameraOn }: LocalVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="absolute bottom-20 right-4 w-36 h-24 rounded-lg overflow-hidden bg-gray-800 border-2 border-white shadow-lg z-10">
      {isCameraOn ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white text-xs">
          카메라 꺼짐
        </div>
      )}
    </div>
  );
}
