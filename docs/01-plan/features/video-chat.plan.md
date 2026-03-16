# video-chat Feature Plan

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | video-chat |
| 작성일 | 2026-03-16 (v3 업데이트) |
| Phase | Plan |
| 레벨 | Dynamic |

### Value Delivered (4-Perspective)

| 관점 | 내용 |
|------|------|
| **Problem** | 화상 통화를 하려면 외부 툴(Zoom, Meet)이 필요하고, 별도 초대 없이 공개적으로 대화할 수 있는 공간이 없다. |
| **Solution** | 메인 화면에서 누구나 채팅방을 생성하고, 공개 채팅방 리스트에서 자유롭게 입장하는 오픈 화상 채팅 제공. |
| **Function & UX Effect** | 메인 화면에서 방 만들기 → 채팅방 리스트 확인 → 1클릭 입장 후, 화상 통화와 텍스트 채팅을 동시에 활용하는 통합 소통 UX 제공. |
| **Core Value** | meetie를 일정 조율 툴을 넘어 화상+텍스트 채팅을 한 화면에서 즐길 수 있는 통합 오픈 채팅 플랫폼으로 확장한다. |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1 | 2026-03-16 | 초기 Plan (미팅 연동, 초대 기반) |
| v2 | 2026-03-16 | **메인 화면 채팅방 생성 + 공개 리스트 + 누구나 입장**으로 범위 확장 |
| v3 | 2026-03-16 | **방 내 텍스트 채팅** 기능 In Scope로 추가 |

---

## 1. 기능 개요

### 1.1 목적
meetie 메인 화면에서 누구나 화상 채팅방을 만들고, 공개 방 목록을 보고, 자유롭게 입장할 수 있는 오픈 화상 채팅 기능을 구현한다.

### 1.2 범위 (In Scope)
- **메인 페이지에서 채팅방 생성** (방 이름 입력 → 바로 생성)
- **공개 채팅방 리스트** (현재 활성화된 방 목록 표시)
- **누구나 입장** (초대 없이 리스트에서 클릭으로 입장)
- 방 참여자 수 실시간 표시
- 1:1 및 소그룹(최대 4명) 화상 통화
- 카메라/마이크 on/off 토글
- 화면 공유
- **방 내 텍스트 채팅** (같은 방 참여자끼리 실시간 메시지 전송) ← **NEW v3**
- 방 종료 (모든 참여자 퇴장 시 자동 종료)

### 1.3 범위 제외 (Out of Scope)
- 비공개/초대 전용 방 (v1 요구사항 제거, 추후 재검토)
- 대규모 웨비나 (5명 이상)
- 통화 녹화/저장
- 채팅 메시지 영구 저장 / 히스토리 (MVP에서는 미구현)
- 모바일 앱

---

## 2. 사용자 스토리

| ID | 사용자 | 목적 | 가치 |
|----|--------|------|------|
| US-01 | 방문자 | 메인 화면에서 채팅방 리스트를 보고 싶다 | 현재 열린 방을 한눈에 파악 |
| US-02 | 방문자 | 방 이름을 입력해서 새 채팅방을 만들고 싶다 | 즉시 화상 채팅 시작 |
| US-03 | 방문자 | 리스트에서 원하는 방에 클릭으로 입장하고 싶다 | 초대 없이 자유 입장 |
| US-04 | 참여자 | 현재 방에 몇 명이 있는지 보고 싶다 | 입장 전 인원 파악 |
| US-05 | 참여자 | 카메라/마이크를 제어하고 싶다 | 상황에 맞게 미디어 제어 |
| US-06 | 참여자 | 화면을 공유하고 싶다 | 자료 공유하며 대화 |
| US-07 | 참여자 | 같은 방 사람들과 텍스트 메시지를 주고받고 싶다 | 음성 없이도 소통 가능 |
| US-08 | 참여자 | 새 메시지가 오면 알림 표시를 보고 싶다 | 채팅 패널 닫혀 있어도 메시지 확인 |

---

## 3. 기술 요구사항

### 3.1 핵심 기술
- **WebRTC**: 네이티브 RTCPeerConnection (P2P 실시간 미디어 스트림)
- **Signaling**: bkend.ai WebSocket (방 입장/퇴장 시그널링)
- **STUN/TURN**: 방화벽 NAT 통과 (Google STUN)
- **Polling/WS**: 채팅방 리스트 실시간 갱신 (bkend.ai REST polling 또는 WS)

### 3.2 데이터 모델 (v2)

```
VideoRoom
├── _id: string
├── name: string              # 방 이름 (NEW - v2)
├── hostUserId: string        # 방 생성자
├── participants: string[]    # 현재 참여자 userId 배열
├── isPublic: boolean         # 항상 true (v2 - 누구나 입장)
├── status: 'waiting' | 'active' | 'ended'
├── startedAt: string | null
├── endedAt: string | null
├── createdAt: string
└── updatedAt: string

※ meetingId 제거 (v2에서 미팅 연동 불필요)

ChatMessage  ← NEW v3
├── _id: string
├── roomId: string            # VideoRoom._id 참조
├── senderId: string          # 발신자 (userId 또는 익명 식별자)
├── senderName: string        # 표시 이름
├── content: string           # 메시지 내용
└── createdAt: string
```

### 3.3 API 엔드포인트
| Method | Path | 설명 |
|--------|------|------|
| GET | `/data/video-rooms?status=waiting,active` | 공개 방 리스트 |
| POST | `/data/video-rooms` | 방 생성 (name 포함) |
| GET | `/data/video-rooms/:id` | 방 정보 조회 |
| PATCH | `/data/video-rooms/:id` | 방 상태/참여자 업데이트 |
| WS | `/ws/video-rooms/:id` | 시그널링 + 채팅 WebSocket |
| GET | `/data/chat-messages?roomId=:id` | 채팅 메시지 조회 (최근 N건) ← NEW v3 |
| POST | `/data/chat-messages` | 채팅 메시지 전송 ← NEW v3 |

---

## 4. UI/UX 흐름

```
메인 페이지 (/)
├── [+ 방 만들기] 버튼
│    └─ 방 이름 입력 모달
│         └─ [생성] 클릭
│              └─ POST /data/video-rooms
│                   └─ redirect → /rooms/:roomId
│
└── 채팅방 리스트 (활성 방 목록)
     ├─ 방 카드: 방 이름 | 참여자 수 | [입장] 버튼
     ├─ 실시간 갱신 (polling 5s 또는 WS)
     └─ [입장] 클릭
          └─ redirect → /rooms/:roomId

VideoRoom 페이지 (/rooms/:roomId)
├─ 로컬 카메라/마이크 초기화
├─ WebSocket 시그널링 + 채팅 연결
├─ WebRTC Peer 연결
└─ 통합 UI (화상 + 텍스트 채팅)
    ├─ VideoArea (좌측)
    │   ├─ VideoGrid (참여자 비디오)
    │   ├─ LocalVideo PiP (내 화면)
    │   └─ ControlBar (카메라/마이크/화면공유/채팅토글/종료)
    └─ ChatPanel (우측, 토글 가능) ← NEW v3
        ├─ MessageList (메시지 목록, 스크롤)
        └─ MessageInput (텍스트 입력 + 전송 버튼)
```

---

## 5. 구현 순서 (PDCA Do Phase)

1. **Phase 1 - 데이터 모델 수정**
   - `VideoRoom` 타입에 `name`, `isPublic` 추가, `meetingId` 제거
   - bkend.ai `video-rooms` 테이블 스키마 업데이트

2. **Phase 2 - 메인 페이지**
   - `VideoRoomList` 컴포넌트 (공개 방 목록, polling)
   - `CreateRoomModal` 컴포넌트 (방 이름 입력)
   - 메인 `page.tsx`에 통합

3. **Phase 3 - 입장 로직 수정**
   - `VideoStartButton` → 삭제 또는 메인으로 이동
   - `useVideoRoom`의 `joinRoom`: 인증 없이 누구나 참여 가능하도록 수정

4. **Phase 4 - VideoRoom 페이지 유지**
   - 기존 구현 재사용 (타입만 업데이트)

5. **Phase 5 - 텍스트 채팅 (NEW v3)**
   - `ChatMessage` 타입 정의 (`src/types/chat.ts`)
   - `useChatMessages` 커스텀 훅 (메시지 조회 + 전송 + 실시간 구독)
   - `ChatPanel` 컴포넌트 (`MessageList` + `MessageInput`)
   - `ControlBar`에 채팅 패널 토글 버튼 추가
   - VideoRoom 레이아웃을 좌(영상)+우(채팅) 분할 구조로 변경

---

## 6. 수용 기준 (Acceptance Criteria)

- [ ] 메인 페이지에 채팅방 리스트가 표시된다
- [ ] 빈 상태일 때 "아직 열린 방이 없습니다" 문구 표시
- [ ] [+ 방 만들기] 클릭 → 방 이름 입력 모달 표시
- [ ] 방 이름 입력 후 생성 시 `/rooms/:id`로 이동
- [ ] 리스트의 방 카드에 방 이름, 참여자 수 표시
- [ ] [입장] 버튼 클릭으로 누구나 방에 입장 가능
- [ ] 방 참여자 수가 실시간으로 업데이트
- [ ] 모든 참여자 퇴장 시 방 status = 'ended', 리스트에서 제거
- [ ] 화상 통화 (카메라/마이크/화면공유/종료) 정상 작동
- [ ] ControlBar에 채팅 토글 버튼이 표시된다
- [ ] 채팅 패널 열기/닫기가 토글로 동작한다
- [ ] 텍스트 입력 후 전송 시 같은 방 참여자 모두에게 메시지가 표시된다
- [ ] 메시지에 발신자 이름과 시각이 표시된다
- [ ] 새 메시지 수신 시 채팅 패널이 닫혀 있으면 미읽음 뱃지가 표시된다
- [ ] Enter 키로도 메시지 전송이 가능하다

---

## 7. 리스크 및 의존성

| 리스크 | 심각도 | 대응 방안 |
|--------|--------|----------|
| WebRTC NAT 통과 실패 | 높음 | TURN 서버 구성 (coturn) |
| 공개 방 어뷰징 (무분별한 생성) | 중간 | MVP에서는 허용, 이후 rate limit 추가 |
| bkend.ai WS 시그널링 지원 여부 | 중간 | REST polling 폴백 고려 |
| 리스트 실시간성 (polling 딜레이) | 낮음 | 5초 polling으로 MVP 충분 |
| 채팅 메시지 실시간 동기화 | 중간 | bkend.ai WS 구독 또는 polling 폴백 |
| 채팅 패널로 인한 영상 영역 축소 | 낮음 | 패널 토글 기본 닫힘, 반응형 레이아웃 |

---

**다음 단계**: `/pdca design video-chat` 으로 v3 설계 문서 업데이트
