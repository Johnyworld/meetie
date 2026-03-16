# video-chat Design Document (v3)

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | video-chat |
| 작성일 | 2026-03-16 (v3 업데이트) |
| Phase | Design |
| 참조 Plan | docs/01-plan/features/video-chat.plan.md (v3) |

### Value Delivered (4-Perspective)

| 관점 | 내용 |
|------|------|
| **Problem** | 화상 통화에 외부 툴이 필요하고, 통화 중 텍스트로 링크나 메모를 공유할 방법이 없다 |
| **Solution** | 메인 화면에서 누구나 채팅방 생성 + 화상 통화 중 실시간 텍스트 채팅 패널 제공 |
| **Function & UX Effect** | 방 만들기 → 입장 → 화상+텍스트 채팅 병행의 통합 소통 UX |
| **Core Value** | meetie를 화상+텍스트 채팅을 한 화면에서 즐기는 통합 오픈 채팅 플랫폼으로 확장 |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1 | 2026-03-16 | 초기 Design (미팅 연동, 초대 기반) |
| v2 | 2026-03-16 | 메인 페이지 채팅방 리스트 + 오픈 입장으로 전면 개편 |
| v3 | 2026-03-16 | **방 내 텍스트 채팅** (ChatMessage, ChatPanel, useChatMessages) 추가 |

---

## 1. 아키텍처 개요

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js Frontend                    │
│                                                         │
│  메인 페이지 (/)                                         │
│  ├─ VideoRoomList (공개 방 목록, 5s polling)             │
│  │   └─ VideoRoomCard × N (방 이름, 참여자 수, [입장])   │
│  └─ CreateRoomModal (방 이름 입력 → POST)                │
│       └─ redirect → /rooms/:roomId                      │
│                                                         │
│  VideoRoom 페이지 (/rooms/[roomId])                         │
│  ├─ useVideoRoom      (방 상태 CRUD)                        │
│  ├─ useVideoSignaling (WebSocket 시그널링)                  │
│  ├─ useWebRTC         (Peer 연결, 미디어 스트림)            │
│  ├─ useChatMessages   (채팅 메시지 CRUD + 실시간) ← NEW v3  │
│  └─ VideoRoomUI                                             │
│      ├─ VideoArea                                           │
│      │   ├─ VideoGrid   (원격 참여자 비디오)                │
│      │   ├─ LocalVideo  (내 화면 PiP)                      │
│      │   └─ ControlBar  (카메라/마이크/화면공유/채팅/종료)  │
│      └─ ChatPanel (우측, 토글) ← NEW v3                    │
│          ├─ MessageList  (메시지 목록)                      │
│          └─ MessageInput (입력창 + 전송)                    │
└─────────────────────────────────────────────────────────────┘
       │ REST (방 목록/생성/업데이트/채팅)  │ WebSocket (시그널링)
       ▼                                   ▼
    ┌──────────────────────────────────────────────────┐
    │                  bkend.ai                        │
    │  GET  /data/video-rooms         (방 리스트)      │
    │  POST /data/video-rooms         (방 생성)        │
    │  PATCH /data/video-rooms/:id    (방 업데이트)    │
    │  WS   /ws/video-rooms/:id       (시그널링)       │
    │  GET  /data/chat-messages?roomId=:id ← NEW v3   │
    │  POST /data/chat-messages            ← NEW v3   │
    └──────────────────────────────────────────────────┘
```

---

## 2. 데이터 모델

### 2.1 VideoRoom (v2 - bkend.ai 테이블)

```typescript
interface VideoRoom {
  _id: string;
  name: string;                           // 방 이름 (NEW v2)
  hostUserId: string;                     // 방 생성자 ID (표시용)
  participants: string[];                 // 현재 참여자 userId 배열
  isPublic: true;                         // 항상 공개 (v2)
  status: 'waiting' | 'active' | 'ended';
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // meetingId 제거 (v2)
}
```

**bkend.ai 테이블명**: `video-rooms`

**인덱스**: `status`, `createdAt` (리스트 정렬용)

### 2.2 ChatMessage (NEW v3 - bkend.ai 테이블)

```typescript
interface ChatMessage {
  _id: string;
  roomId: string;        // VideoRoom._id 참조
  senderId: string;      // getTempUserId() 또는 auth userId
  senderName: string;    // 표시 이름 (e.g. "user_abc123")
  content: string;       // 메시지 본문 (최대 500자)
  createdAt: string;     // ISO 8601
}
```

**bkend.ai 테이블명**: `chat-messages`

**인덱스**: `roomId`, `createdAt` (방별 시간순 조회용)

**조회 전략**:
- 입장 시 최근 50건 로드 (`GET /data/chat-messages?roomId=:id&sort=-createdAt&limit=50`)
- 이후 3초 polling으로 신규 메시지 갱신 (`createdAt > lastFetched`)

---

### 2.3 WebSocket 시그널링 메시지 (v1과 동일)

```typescript
type ClientSignalMessage =
  | { type: 'join'; roomId: string; userId: string }
  | { type: 'offer'; to: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; to: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; to: string; candidate: RTCIceCandidateInit }
  | { type: 'leave'; roomId: string; userId: string };

type ServerSignalMessage =
  | { type: 'user-joined'; userId: string; participants: string[] }
  | { type: 'user-left'; userId: string; participants: string[] }
  | { type: 'offer'; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; from: string; sdp: RTCSessionDescriptionInit }
  | { type: 'ice-candidate'; from: string; candidate: RTCIceCandidateInit };
```

---

## 3. 파일 구조 (v3 변경사항)

```
src/
├── app/
│   ├── page.tsx                           # 메인 페이지 (VideoRoomList 통합) ← 수정
│   └── rooms/
│       └── [roomId]/
│           └── page.tsx                   # VideoRoom 페이지 (기존 유지)
│
├── components/
│   └── features/
│       └── video-chat/
│           ├── VideoRoomList.tsx          # 공개 채팅방 목록 (v2)
│           ├── VideoRoomCard.tsx          # 채팅방 카드 컴포넌트 (v2)
│           ├── CreateRoomModal.tsx        # 방 만들기 모달 (v2)
│           ├── VideoRoomPage.tsx          # 수정: ChatPanel + 레이아웃 변경 ← v3
│           ├── VideoGrid.tsx              # 기존 유지
│           ├── LocalVideo.tsx             # 기존 유지
│           ├── ControlBar.tsx             # 수정: 채팅 토글 버튼 추가 ← v3
│           ├── ChatPanel.tsx              # NEW v3: 채팅 패널 컨테이너
│           ├── MessageList.tsx            # NEW v3: 메시지 목록
│           ├── MessageItem.tsx            # NEW v3: 개별 메시지 행
│           ├── MessageInput.tsx           # NEW v3: 텍스트 입력 + 전송
│           └── VideoStartButton.tsx       # 미사용 (삭제 가능)
│
├── hooks/
│   ├── useVideoRoomList.ts                # 공개 방 목록 polling (v2)
│   ├── useVideoRoom.ts                    # 수정 (name 필드, meetingId 제거) (v2)
│   ├── useVideoSignaling.ts               # 기존 유지
│   ├── useWebRTC.ts                       # 기존 유지
│   └── useChatMessages.ts                 # NEW v3: 채팅 메시지 CRUD + polling
│
├── lib/
│   ├── bkend.ts                           # 기존 유지
│   └── webrtc.ts                          # 기존 유지
│
└── types/
    ├── index.ts                           # 기존 유지
    ├── video-chat.ts                      # VideoRoom 타입 (v2)
    └── chat.ts                            # NEW v3: ChatMessage 타입
```

---

## 4. 컴포넌트 설계 (신규)

### 4.1 메인 페이지 (`app/page.tsx`)

```typescript
// 전체 레이아웃
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <header>
        <h1>meetie</h1>
        <CreateRoomButton />   {/* 모달 트리거 */}
      </header>
      <VideoRoomList />
    </main>
  );
}
```

### 4.2 VideoRoomList

```typescript
interface VideoRoomListProps {}

// 역할: 5초 polling으로 active/waiting 방 목록 갱신
// 사용 훅: useVideoRoomList()
// 빈 상태: "아직 열린 방이 없습니다. 첫 번째 방을 만들어보세요!"

function VideoRoomList() {
  const { rooms, isLoading } = useVideoRoomList();
  // rooms: VideoRoom[] (status !== 'ended', createdAt 역순)
}
```

### 4.3 VideoRoomCard

```typescript
interface VideoRoomCardProps {
  room: VideoRoom;
}

// 표시: 방 이름 | 참여자 수 (N/4) | 생성 시각 | [입장] 버튼
// [입장] 클릭 → router.push(`/rooms/${room._id}`)
// 참여자 4명이면 [입장] 버튼 비활성화 + "만석" 표시
```

### 4.4 CreateRoomModal

```typescript
interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 입력: 방 이름 (필수, 최대 30자)
// [생성] 클릭:
//   1. POST /data/video-rooms { name, hostUserId, participants: [userId], isPublic: true, status: 'waiting' }
//   2. router.push(`/rooms/${room._id}`)
// 유효성: 빈 이름 불가
```

---

## 5. 훅 설계 (신규/수정)

### 5.1 useVideoRoomList (NEW)

```typescript
function useVideoRoomList() {
  return {
    rooms: VideoRoom[],    // status !== 'ended', createdAt DESC
    isLoading: boolean,
    refresh: () => void,   // 수동 갱신
  };
}

// 구현: 5초 polling
// GET /data/video-rooms?status=waiting,active&sort=-createdAt
useEffect(() => {
  const fetch = () => bkend.data.list('video-rooms', { status: 'waiting,active' });
  fetch();
  const interval = setInterval(fetch, 5000);
  return () => clearInterval(interval);
}, []);
```

### 5.2 useVideoRoom (수정)

```typescript
// v2 변경사항:
// - joinRoom: 인증 없이 임시 userId(nanoid) 사용 가능
// - createRoom: name 파라미터 추가, meetingId 제거
function useVideoRoom(roomId: string) {
  // ... 기존 구조 유지
}
```

### 5.3 useChatMessages (NEW v3)

```typescript
interface UseChatMessagesReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  unreadCount: number;        // 채팅 패널 닫힌 상태에서 새 메시지 수
  markAsRead: () => void;     // 패널 열 때 호출
}

function useChatMessages(roomId: string, senderId: string, senderName: string): UseChatMessagesReturn;
```

**구현 전략**:

```typescript
// 1. 입장 시 최근 50건 로드
useEffect(() => {
  const load = async () => {
    const data = await bkend.data.list('chat-messages', {
      roomId,
      sort: 'createdAt',
      limit: 50,
    });
    setMessages(data);
    setLastFetched(new Date().toISOString());
  };
  load();
}, [roomId]);

// 2. 3초 polling으로 신규 메시지
useEffect(() => {
  const poll = async () => {
    const newMsgs = await bkend.data.list('chat-messages', {
      roomId,
      createdAt_gt: lastFetched,
      sort: 'createdAt',
    });
    if (newMsgs.length > 0) {
      setMessages(prev => [...prev, ...newMsgs]);
      setLastFetched(new Date().toISOString());
      if (!isChatOpen) setUnreadCount(c => c + newMsgs.length);
    }
  };
  const interval = setInterval(poll, 3000);
  return () => clearInterval(interval);
}, [roomId, lastFetched, isChatOpen]);

// 3. 메시지 전송
const sendMessage = async (content: string) => {
  const msg: Omit<ChatMessage, '_id' | 'createdAt'> = {
    roomId, senderId, senderName, content,
  };
  await bkend.data.create('chat-messages', msg);
};
```

---

## 6. API 명세 (v3)

### 6.1 공개 방 리스트

**GET `/data/video-rooms`**
```
Query: status=waiting,active&sort=-createdAt
Response: VideoRoom[]
```

### 6.2 방 생성 (v2)

**POST `/data/video-rooms`**
```json
// Request
{
  "name": "팀 미팅",
  "hostUserId": "user_abc",
  "participants": ["user_abc"],
  "isPublic": true,
  "status": "waiting",
  "startedAt": null,
  "endedAt": null
}
// Response: VideoRoom
```

### 6.3 방 입장 (참여자 추가)

**PATCH `/data/video-rooms/:id`**
```json
{
  "participants": ["user_abc", "user_xyz"],
  "status": "active",
  "startedAt": "2026-03-16T10:00:00Z"
}
```

### 6.4 방 퇴장

**PATCH `/data/video-rooms/:id`**
```json
// 참여자 남음
{ "participants": ["user_abc"] }
// 마지막 참여자 퇴장
{ "participants": [], "status": "ended", "endedAt": "2026-03-16T10:30:00Z" }
```

### 6.5 채팅 메시지 조회 (NEW v3)

**GET `/data/chat-messages`**
```
Query: roomId=:id&sort=createdAt&limit=50
Response: ChatMessage[]
```

**신규 메시지 polling용**:
```
Query: roomId=:id&createdAt_gt=:lastFetched&sort=createdAt
Response: ChatMessage[]
```

### 6.6 채팅 메시지 전송 (NEW v3)

**POST `/data/chat-messages`**
```json
// Request
{
  "roomId": "room_abc",
  "senderId": "user_xyz",
  "senderName": "user_xyz",
  "content": "안녕하세요!"
}
// Response: ChatMessage
```

---

## 4-2. 컴포넌트 설계 (v3 신규)

### ChatPanel

```typescript
interface ChatPanelProps {
  roomId: string;
  senderId: string;
  senderName: string;
  isOpen: boolean;
  onClose: () => void;
}

// 역할: MessageList + MessageInput 통합 컨테이너
// 너비: 320px (고정), 우측 슬라이드-인
// isOpen=false 시 DOM에는 존재하되 display:none
```

### MessageList

```typescript
interface MessageListProps {
  messages: ChatMessage[];
}

// 역할: 스크롤 가능한 메시지 목록
// 새 메시지 수신 시 자동 스크롤 (scrollIntoView)
// 날짜 구분선 표시 (같은 날짜 메시지 그룹화)
```

### MessageItem

```typescript
interface MessageItemProps {
  message: ChatMessage;
  isMine: boolean;  // senderId === currentUserId
}

// isMine=true  → 우측 정렬, 파란색 말풍선
// isMine=false → 좌측 정렬, 회색 말풍선 + 이름 표시
// 시각: HH:mm 형식
```

### MessageInput

```typescript
interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

// textarea (1줄, 최대 500자)
// Enter: 전송, Shift+Enter: 줄바꿈
// 전송 후 입력창 초기화
```

### ControlBar (수정)

```typescript
// 기존 버튼 + 채팅 토글 버튼 추가
// 채팅 토글 버튼: unreadCount > 0 시 뱃지 표시
// 아이콘: MessageSquare (lucide-react)
```

---

## 7. UI 레이아웃

### 7.1 메인 페이지

```
┌────────────────────────────────────────────────────────┐
│  meetie                          [+ 방 만들기]         │
│  ─────────────────────────────────────────────         │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ 팀 스터디     │  │ 자유 잡담     │  │ 코드 리뷰   │  │
│  │ 참여자: 2/4  │  │ 참여자: 1/4  │  │ 참여자: 4/4 │  │
│  │ 3분 전       │  │ 1분 전       │  │ 10분 전     │  │
│  │ [입장]       │  │ [입장]       │  │ [만석]      │  │
│  └──────────────┘  └──────────────┘  └─────────────┘  │
│                                                        │
│  (빈 상태 시)                                           │
│  아직 열린 방이 없습니다. 첫 번째 방을 만들어보세요!     │
└────────────────────────────────────────────────────────┘
```

### 7.2 방 만들기 모달

```
┌────────────────────────────┐
│  새 채팅방 만들기    [×]   │
│  ──────────────────────    │
│  방 이름                   │
│  ┌──────────────────────┐  │
│  │ 예: 팀 스터디        │  │
│  └──────────────────────┘  │
│                            │
│  [취소]          [만들기]  │
└────────────────────────────┘
```

### 7.3 VideoRoom 페이지 (v3 - 화상+채팅 분할 레이아웃)

```
┌──────────────────────────────────────────────────────────────┐
│ /rooms/:roomId                                               │
│                                                              │
│  ┌──────────────────────────────────┐  ┌──────────────────┐  │
│  │         VideoArea (flex-1)       │  │  ChatPanel 320px │  │
│  │                                  │  │  ─────────────── │  │
│  │  ┌────────┐  ┌────────┐          │  │  [발신자] 10:23  │  │
│  │  │ 참여자A │  │ 참여자B │          │  │  안녕하세요!     │  │
│  │  └────────┘  └────────┘          │  │                  │  │
│  │                                  │  │  [나] 10:24      │  │
│  │  ┌──────────────────────────┐    │  │  반갑습니다       │  │
│  │  │ 내 화면 (PiP)            │    │  │                  │  │
│  │  └──────────────────────────┘    │  │  ─────────────── │  │
│  │                                  │  │  ┌────────────┐  │  │
│  │  ─────────────────────────────── │  │  │ 메시지 입력│  │  │
│  │  [카메라][마이크][화면공유][💬1][종료]│  │  └────────────┘  │  │
│  └──────────────────────────────────┘  └──────────────────┘  │
│                                        ↑ 토글로 열기/닫기     │
└──────────────────────────────────────────────────────────────┘
```

**채팅 패널 닫힌 상태** (기본):
```
[카메라][마이크][화면공유][💬 3][종료]
                           ↑ 미읽음 뱃지
```

---

## 8. userId 처리 전략 (인증 미구현 대응)

인증 기능이 아직 없으므로 임시 userId 전략 사용:

```typescript
// src/lib/user.ts (NEW)
export function getTempUserId(): string {
  if (typeof window === 'undefined') return 'server';
  const key = 'meetie_temp_user_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `user_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(key, id);
  }
  return id;
}
```

- 브라우저 localStorage에 임시 ID 저장
- 같은 브라우저에서는 동일 ID 유지
- 인증 기능 구현 후 auth-store의 userId로 교체

---

## 9. 구현 체크리스트 (Do Phase 참조)

### 수정 항목 (v2 기존)
- [ ] `src/types/video-chat.ts` — `name` 추가, `meetingId` 제거
- [ ] `src/hooks/useVideoRoom.ts` — v2 타입 반영
- [ ] `src/app/page.tsx` — VideoRoomList + CreateRoomModal 통합
- [ ] `src/app/rooms/[roomId]/page.tsx` — getTempUserId() 사용

### 신규 항목 (v2)
- [ ] `src/lib/user.ts` — getTempUserId() 유틸
- [ ] `src/hooks/useVideoRoomList.ts` — 5초 polling
- [ ] `src/components/features/video-chat/VideoRoomList.tsx`
- [ ] `src/components/features/video-chat/VideoRoomCard.tsx`
- [ ] `src/components/features/video-chat/CreateRoomModal.tsx`

### 신규 항목 (v3 - 텍스트 채팅)
- [ ] `src/types/chat.ts` — `ChatMessage` 인터페이스
- [ ] `src/hooks/useChatMessages.ts` — 채팅 CRUD + 3초 polling
- [ ] `src/components/features/video-chat/ChatPanel.tsx`
- [ ] `src/components/features/video-chat/MessageList.tsx`
- [ ] `src/components/features/video-chat/MessageItem.tsx`
- [ ] `src/components/features/video-chat/MessageInput.tsx`
- [ ] `src/components/features/video-chat/ControlBar.tsx` — 채팅 토글 + 뱃지 추가
- [ ] `src/app/rooms/[roomId]/page.tsx` — 화상+채팅 분할 레이아웃

---

**다음 단계**: `/pdca do video-chat` 으로 v3 구현 시작
