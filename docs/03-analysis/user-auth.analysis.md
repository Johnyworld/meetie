# Gap Analysis: user-auth

## 분석 요약

| 항목 | 점수 | 상태 |
|------|:----:|:----:|
| FR 요구사항 | 100% | ✅ |
| API 설계 | 86% | ⚠️ |
| 컴포넌트 구조 | 90% | ✅ |
| 라우팅 | 100% | ✅ |
| 상태 관리 | 75% | ⚠️ (문서화 이슈) |
| 에러 처리 | 100% | ✅ |
| 구현 단계 | 93% | ✅ |
| **전체 Match Rate** | **91%** | **✅** |

> 분석 일시: 2026-03-19
> 분석 기준: docs/02-design/features/user-auth.design.md

---

## 1. FR 구현 현황 (9/9 — 100%)

| ID | 요구사항 | 상태 | 구현 위치 |
|----|---------|:----:|---------|
| FR-01 | 이메일 + 비밀번호 회원가입 | ✅ | `RegisterForm.tsx`, `auth-store.ts:signUp` |
| FR-02 | 이메일 + 비밀번호 로그인 | ✅ | `LoginForm.tsx`, `auth-store.ts:signIn` |
| FR-03 | 구글 OAuth 로그인 | ✅ | `GoogleLoginButton.tsx`, `auth-store.ts:signInWithGoogle`, `callback/route.ts` |
| FR-04 | 닉네임 필수 입력 | ✅ | `RegisterForm.tsx` nickname field, 2~20자 validation |
| FR-05 | 로그아웃 | ✅ | `auth-store.ts:signOut`, `page.tsx` 로그아웃 버튼 |
| FR-06 | 인증 상태 유지 | ✅ | `AuthInitializer` → `fetchMe()`, Zustand `persist` |
| FR-07 | Protected Route | ✅ | `ProtectedRoute.tsx` (`/`, `/rooms/[roomId]` 적용) |
| FR-08 | 비밀번호 최소 8자 | ✅ | `RegisterForm.tsx:validate()` |
| FR-09 | 이메일 중복 방지 | ✅ | `RegisterForm.tsx` 에러 핸들링 |

---

## 2. Design 섹션별 Gap

### 2.1 데이터 모델

| 항목 | Design | 구현 | 상태 |
|------|--------|------|:----:|
| `Profile` 타입 | `{id, email, nickname, provider, created_at, updated_at}` | `types/index.ts:17-24` 일치 | ✅ |
| `AuthUser` 타입 | `{id, email, nickname, provider}` | `types/index.ts:26-31` 일치 | ✅ |
| 기존 `User` 타입 | 언급 없음 | `types/index.ts:9-14` 잔존 (레거시) | ⚠️ |

### 2.2 API 호출

| API | 상태 | 비고 |
|-----|:----:|------|
| signUp with nickname | ✅ | `auth-store.ts:53-56` |
| signInWithPassword | ✅ | `auth-store.ts:28` |
| signInWithOAuth (google) | ✅ | `auth-store.ts:75-79` |
| OAuth Callback exchangeCodeForSession | ✅ | `callback/route.ts` |
| profiles UPDATE (닉네임) | ✅ | `setup-profile/page.tsx:35-38` |
| signOut | ✅ | `auth-store.ts:84-87` |
| 세션 복구 | ⚠️ | Design: `getSession()` → 구현: `getUser()` (보안상 개선) |

### 2.3 컴포넌트

| Design 파일 | 구현 파일 | 상태 |
|------------|---------|:----:|
| `LoginForm.tsx` | `components/features/auth/LoginForm.tsx` | ✅ |
| `RegisterForm.tsx` | `components/features/auth/RegisterForm.tsx` | ✅ |
| `GoogleLoginButton.tsx` | `components/features/auth/GoogleLoginButton.tsx` | ✅ |
| `ProtectedRoute.tsx` | `components/ui/ProtectedRoute.tsx` | ✅ |
| `useAuth.ts` | `hooks/useAuth.ts` | ✅ |
| `auth-store.ts` | `stores/auth-store.ts` | ✅ |
| `login/page.tsx` | `app/(auth)/login/page.tsx` | ✅ |
| `setup-profile/page.tsx` | `app/(auth)/setup-profile/page.tsx` | ✅ |
| `auth/callback/route.ts` | `app/auth/callback/route.ts` | ✅ |
| (미설계) | `components/ui/AuthInitializer.tsx` | 🟡 추가됨 |

### 2.4 라우팅 (5/5 — 100%)

모든 라우트 설계대로 구현됨.

### 2.5 에러 처리 (5/5 — 100%)

모든 에러 메시지 설계대로 구현됨.

---

## 3. Gap 목록

### 수정 완료 (이번 분석 중 처리)

| # | 내용 | 처리 |
|---|------|------|
| G-01 | `CreateRoomModal.tsx`에서 `getTempUserId()` 미교체 | ✅ 수정 완료 |

### 문서화 차이 (코드는 정상, 설계서 업데이트 권장)

| # | 내용 | 영향 |
|---|------|------|
| G-02 | `getSession()` → `getUser()` 로 변경 (보안 개선) | 낮음 |
| G-03 | `AuthInitializer` 컴포넌트 추가 (layout.tsx Server Component 분리) | 낮음 |
| G-04 | Zustand `persist` 미들웨어 사용 (설계서 미반영) | 낮음 |

### 아키텍처 개선 권장

| # | 내용 | 우선순위 |
|---|------|---------|
| G-05 | `setup-profile/page.tsx`에서 Supabase 직접 호출 → auth-store 경유 권장 | 낮음 |
| G-06 | `callback/route.ts`에서 `createClient()` 인라인 → 공유 클라이언트 사용 권장 | 낮음 |

---

## 4. 결론

**Match Rate: 91% (≥ 90% 기준 통과)**

- FR 9/9 모두 구현 완료
- 주요 Gap(G-01 `getTempUserId` 교체)은 분석 중 즉시 수정
- 나머지는 문서화 차이 또는 아키텍처 개선 권장 사항 (기능 동작에 영향 없음)
- `/pdca report user-auth` 진행 가능
