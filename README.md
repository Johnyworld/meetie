# meetie

누구나 참여할 수 있는 오픈 화상 채팅 플랫폼

🔗 **Live**: https://meetie-pink.vercel.app

## 주요 기능

- **오픈 채팅방** — 로그인 없이 방 생성 및 자유 입장
- **화상 통화** — WebRTC 기반 1:1 및 소그룹(최대 4명) 화상 통화
- **텍스트 채팅** — 통화 중 실시간 텍스트 메시지 (날짜 구분선, 미읽음 뱃지)
- **참여자 리스트** — 현재 접속 중인 참여자 실시간 표시
- **미디어 제어** — 카메라 / 마이크 on·off, 화면 공유

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (PostgreSQL + Realtime + Auth) |
| 실시간 통신 | WebRTC (RTCPeerConnection), Supabase Realtime |
| 상태 관리 | Zustand, TanStack Query |
| 배포 | Vercel |

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일을 생성하고 아래 값을 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

### 3. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.


## 배포

```bash
vercel --prod
```
