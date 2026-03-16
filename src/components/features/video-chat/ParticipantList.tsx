'use client';

interface ParticipantListProps {
  participants: string[];
  currentUserId: string;
}

export function ParticipantList({ participants, currentUserId }: ParticipantListProps) {
  return (
    <div className="absolute right-4 z-10 w-36 bg-gray-900/80 rounded-lg px-3 py-2"
      style={{ bottom: 'calc(5rem + 6rem + 0.5rem)' }} // LocalVideo(bottom-20 + h-24) 바로 위
    >
      <p className="text-xs text-gray-400 mb-1.5">참여자 {participants.length}명</p>
      <div className="flex flex-col gap-1">
        {participants.map((id) => (
          <div key={id} className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
            <span className={`text-xs truncate ${id === currentUserId ? 'text-blue-400 font-medium' : 'text-gray-300'}`}>
              {id === currentUserId ? `${id} (나)` : id}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
