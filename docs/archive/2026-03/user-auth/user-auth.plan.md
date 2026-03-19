# user-auth Feature Plan

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | user-auth |
| 작성일 | 2026-03-19 |
| Phase | Plan |
| 레벨 | Dynamic |

### Value Delivered (4-Perspective)

| 관점 | 내용 |
|------|------|
| **Problem** | 로그인/회원가입 없이 meetie 서비스를 이용할 수 없어, 개인화된 기능(채팅방 생성, 참여자 식별 등)을 제공할 수 없다. |
| **Solution** | 이메일+비밀번호 회원가입/로그인 및 구글 OAuth 로그인을 제공해 사용자가 빠르게 인증하고 서비스에 진입할 수 있게 한다. |
| **Function & UX Effect** | 로그인 페이지에서 이메일 또는 구글 로그인 선택 → 회원가입 시 이메일/비밀번호/닉네임 입력 → 인증 완료 후 메인 화면 자동 이동. |
| **Core Value** | 사용자 인증 기반을 마련해 채팅방 생성자/참여자 식별, 향후 개인화 기능 확장의 토대를 구축한다. |

---

## 1. 개요

### 1.1 목적
meetie 서비스의 인증 기반 구축. 이메일/비밀번호 로그인과 구글 OAuth 로그인을 모두 지원하며, 닉네임을 포함한 기본 회원정보를 관리한다.

### 1.2 배경
현재 meetie는 화상 채팅, 텍스트 채팅, 참여자 리스트 기능이 구현되어 있으나 인증 시스템이 없어 사용자 식별이 불가능하다. 인증 도입으로 채팅방 생성자/참여자 구분, 향후 마이페이지, 미팅 기록 등 개인화 기능 확장이 가능해진다.

---

## 2. 요구사항

### 2.1 Functional Requirements

| ID | 기능 | 우선순위 |
|----|------|---------|
| FR-01 | 이메일 + 비밀번호 회원가입 | Must |
| FR-02 | 이메일 + 비밀번호 로그인 | Must |
| FR-03 | 구글 OAuth 로그인 (신규 가입 포함) | Must |
| FR-04 | 닉네임 설정 (회원가입 시 필수 입력) | Must |
| FR-05 | 로그아웃 | Must |
| FR-06 | 인증 상태 유지 (세션/토큰 관리) | Must |
| FR-07 | Protected Route — 미로그인 시 로그인 페이지로 리다이렉트 | Must |
| FR-08 | 비밀번호 유효성 검사 (최소 8자, 확인 필드 일치) | Should |
| FR-09 | 이메일 중복 가입 방지 — 이메일/패스워드 가입자 및 Google OAuth 가입자 모두 처리 | Should |

### 2.2 Non-Functional Requirements

- 보안: Supabase Auth 사용으로 비밀번호 직접 저장 없음
- UX: 로그인/회원가입 전환 탭 제공 (한 페이지에서 처리)
- 반응형: 모바일/데스크톱 모두 지원

### 2.3 Out of Scope

- 비밀번호 찾기 / 이메일 인증 메일 발송
- 소셜 로그인 (카카오, 네이버 등) — 구글만 1차 지원
- 프로필 이미지 업로드
- 회원탈퇴

---

## 3. 사용자 플로우

### 3.1 이메일 회원가입
```
로그인 페이지 진입
  → "회원가입" 탭 클릭
  → 이메일 / 비밀번호 / 닉네임 입력
  → 가입 버튼 클릭
  → Supabase Auth signUp 호출
  → 성공 시 메인 화면("/") 리다이렉트
```

### 3.2 이메일 로그인
```
로그인 페이지 진입
  → 이메일 / 비밀번호 입력
  → 로그인 버튼 클릭
  → Supabase Auth signInWithPassword 호출
  → 성공 시 메인 화면("/") 리다이렉트
```

### 3.3 구글 OAuth 로그인
```
로그인 페이지 진입
  → "구글로 계속하기" 버튼 클릭
  → Supabase Auth signInWithOAuth (provider: 'google') 호출
  → 구글 동의 화면
  → Callback URL 처리 (/auth/callback)
  → 신규 유저면 닉네임 설정 페이지 이동
  → 기존 유저면 메인 화면("/") 리다이렉트
```

### 3.4 Protected Route
```
미인증 사용자가 "/" 접근 시
  → ProtectedRoute 컴포넌트 감지
  → "/login" 리다이렉트
```

---

## 4. 데이터 모델 (개요)

### users (Supabase Auth 기본 테이블 확장)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Supabase Auth user id (PK) |
| email | TEXT | 이메일 |
| nickname | TEXT | 닉네임 (필수) |
| provider | TEXT | 'email' \| 'google' |
| created_at | TIMESTAMP | 생성일 |

> Supabase `auth.users` 와 연결된 `public.profiles` 테이블로 구현

---

## 5. 기술 스택

| 영역 | 선택 | 이유 |
|------|------|------|
| 인증 | Supabase Auth | 이미 프로젝트에 세팅됨, OAuth 내장 지원 |
| 상태 관리 | Zustand (useAuthStore) | 전역 user/session 상태 관리 |
| 라우팅 | Next.js App Router | ProtectedRoute 미들웨어 활용 |
| UI | Tailwind CSS + shadcn/ui | 기존 컨벤션 유지 |

---

## 6. 구현 범위 (파일 목록)

| 파일 | 역할 |
|------|------|
| `src/app/(auth)/login/page.tsx` | 로그인/회원가입 페이지 |
| `src/components/features/auth/LoginForm.tsx` | 이메일 로그인 폼 |
| `src/components/features/auth/RegisterForm.tsx` | 이메일 회원가입 폼 |
| `src/components/features/auth/GoogleLoginButton.tsx` | 구글 OAuth 버튼 |
| `src/app/auth/callback/route.ts` | OAuth Callback 처리 |
| `src/app/(auth)/setup-profile/page.tsx` | OAuth 신규가입 닉네임 설정 |
| `src/hooks/useAuth.ts` | 인증 관련 커스텀 훅 |
| `src/stores/authStore.ts` | Zustand auth 스토어 |
| `src/components/ui/ProtectedRoute.tsx` | 인증 가드 컴포넌트 |
| `src/lib/supabase.ts` | Supabase 클라이언트 (기존 활용) |

---

## 7. 성공 지표

| 지표 | 목표 |
|------|------|
| 이메일 로그인 성공률 | 100% (올바른 정보 입력 시) |
| OAuth 로그인 성공률 | 100% |
| Protected Route 차단율 | 100% |
| Gap Analysis Match Rate | ≥ 90% |
