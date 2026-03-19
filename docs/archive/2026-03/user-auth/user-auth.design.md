# user-auth Feature Design

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | user-auth |
| 작성일 | 2026-03-19 |
| Phase | Design |
| Plan 참조 | docs/01-plan/features/user-auth.plan.md |

---

## 1. 데이터 모델

### 1.1 Supabase DB 스키마

#### `public.profiles` 테이블
Supabase `auth.users` 와 1:1 연결되는 프로필 테이블.

```sql
CREATE TABLE public.profiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email     TEXT NOT NULL,
  nickname  TEXT NOT NULL,
  provider  TEXT NOT NULL DEFAULT 'email',  -- 'email' | 'google'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 본인 프로필만 조회 가능
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 본인 프로필만 수정 가능
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 회원가입 시 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'provider', 'email')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 1.2 TypeScript 타입

```typescript
// src/types/index.ts 에 추가
export interface Profile {
  id: string;
  email: string;
  nickname: string;
  provider: 'email' | 'google';
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  provider: 'email' | 'google';
}
```

---

## 2. API 설계 (Supabase Auth)

### 2.1 이메일 회원가입

```typescript
// Supabase Auth signUp
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { nickname }  // user_metadata에 저장 → 트리거가 profiles에 insert
  }
});
// 성공 시 data.user 반환
// 에러: 이메일 중복 → "User already registered"
```

### 2.2 이메일 로그인

```typescript
// Supabase Auth signInWithPassword
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
// 성공 시 data.session, data.user 반환
// 에러: 잘못된 자격증명 → "Invalid login credentials"
```

### 2.3 구글 OAuth 로그인

```typescript
// Supabase Auth signInWithOAuth
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});
// 구글 동의 화면 → /auth/callback?code=... 으로 리다이렉트
```

### 2.4 OAuth Callback 처리 (서버 라우트)

```typescript
// src/app/auth/callback/route.ts
// GET /auth/callback?code=...
// 1. supabase.auth.exchangeCodeForSession(code)
// 2. 신규 유저 (profiles.nickname 미설정 또는 provider=google 첫 로그인) → /setup-profile
// 3. 기존 유저 → /
```

### 2.5 닉네임 설정 (OAuth 신규가입)

```typescript
// profiles 테이블 UPDATE
const { error } = await supabase
  .from('profiles')
  .update({ nickname })
  .eq('id', userId);
```

### 2.6 로그아웃

```typescript
const { error } = await supabase.auth.signOut();
// 세션 삭제 → Zustand store user = null → /login 리다이렉트
```

### 2.7 세션 복구

```typescript
// 앱 초기화 시 (layout.tsx)
const { data: { session } } = await supabase.auth.getSession();
// 세션 있으면 profiles 조회 후 store 업데이트
```

---

## 3. 컴포넌트 설계

### 3.1 파일 구조

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # 로그인/회원가입 탭 페이지
│   │   └── setup-profile/
│   │       └── page.tsx          # OAuth 신규가입 닉네임 설정
│   └── auth/
│       └── callback/
│           └── route.ts          # OAuth Callback 서버 라우트
├── components/
│   ├── features/
│   │   └── auth/
│   │       ├── LoginForm.tsx         # 이메일 로그인 폼
│   │       ├── RegisterForm.tsx      # 이메일 회원가입 폼
│   │       └── GoogleLoginButton.tsx # 구글 OAuth 버튼
│   └── ui/
│       └── ProtectedRoute.tsx        # 인증 가드
├── hooks/
│   └── useAuth.ts                    # 인증 커스텀 훅
└── stores/
    └── auth-store.ts                 # Zustand store (기존 확장)
```

### 3.2 컴포넌트 상세

#### `src/app/(auth)/login/page.tsx`
- 탭 UI: "로그인" / "회원가입" 전환
- 탭에 따라 `LoginForm` 또는 `RegisterForm` 렌더
- 탭 아래 구분선 + `GoogleLoginButton` (공통 표시)
- 이미 로그인 상태면 `/` 리다이렉트

#### `src/components/features/auth/LoginForm.tsx`
```
Props: email, setEmail, password, setPassword  ← login/page.tsx에서 상태 공유
State: error (내부)
Actions: handleSubmit → useAuth().signIn(email, password)
성공: router.push('/')
실패: error 메시지 표시
```

> 로그인 ↔ 회원가입 탭 전환 시 입력값이 유지되도록 email/password 상태를 부모(login/page.tsx)에서 관리한다.

#### `src/components/features/auth/RegisterForm.tsx`
```
Props: email, setEmail, password, setPassword  ← login/page.tsx에서 상태 공유
State: nickname, confirmPassword, error (내부)
Validation:
  - password: 최소 8자
  - confirmPassword: password와 일치 여부
  - nickname: 2~20자, 공백 불가
Actions: handleSubmit → useAuth().signUp(email, password, nickname)
성공: router.push('/')
실패: error 메시지 표시 (이메일 중복 등)
```

#### `src/components/features/auth/GoogleLoginButton.tsx`
```
Props: 없음
Actions: onClick → useAuth().signInWithGoogle()
UI: 구글 로고 + "구글로 계속하기" 텍스트
```

#### `src/app/auth/callback/route.ts`
```
Method: GET
Query: code (string)
Logic:
  1. exchangeCodeForSession(code)
  2. profiles 테이블에서 해당 user 조회
  3. nickname이 기본값(이메일 앞부분)이거나 provider=google 첫 로그인이면 /setup-profile
  4. 그 외 /
Response: redirect
```

#### `src/app/(auth)/setup-profile/page.tsx`
```
보호: 로그인 상태 필수 (비로그인 시 /login)
State: nickname, error
Actions: handleSubmit → profiles UPDATE → router.push('/')
```

#### `src/hooks/useAuth.ts`
```typescript
interface UseAuth {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}
```

#### `src/stores/auth-store.ts` (기존 확장)
```typescript
interface AuthState {
  user: AuthUser | null;       // email → AuthUser (nickname 포함)
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchMe: () => Promise<void>;
}
```

Zustand `persist` 미들웨어로 `localStorage`에 상태를 유지한다.

```typescript
// persist 설정
{
  name: 'meetie-auth',   // localStorage key
  version: 1,
  migrate: () => ({ user: null, isLoading: false }),  // 버전 변경 시 초기화
}
```

> 페이지 새로고침 후에도 `user` 상태가 복원되며, 이후 `fetchMe()`로 Supabase 세션과 동기화된다.

#### `src/components/ui/ProtectedRoute.tsx`
```typescript
// Client Component
// useAuthStore().user 확인
// null이면 router.push('/login')
// isLoading 중이면 로딩 스피너
// 인증 완료 시 children 렌더
```

---

## 4. 라우팅 구조

```
/login              → (auth)/login/page.tsx  [공개]
/setup-profile      → (auth)/setup-profile/page.tsx  [로그인 필수]
/auth/callback      → auth/callback/route.ts  [OAuth 콜백]
/                   → app/page.tsx  [ProtectedRoute]
/rooms/[roomId]     → app/rooms/[roomId]/page.tsx  [ProtectedRoute]
```

### Next.js Middleware (선택) vs ProtectedRoute
- **ProtectedRoute 방식** 채택: Client Component로 구현, `useAuthStore` 활용
- `src/middleware.ts`는 사용하지 않음 (Supabase SSR 불필요)

---

## 5. 상태 관리 흐름

```
앱 시작 (layout.tsx)
  → fetchMe() 호출
  → Supabase getSession() → profiles 조회
  → useAuthStore.user 업데이트

로그인 성공
  → useAuthStore.user 설정
  → router.push('/')

로그아웃
  → supabase.auth.signOut()
  → useAuthStore.user = null
  → router.push('/login')

ProtectedRoute
  → useAuthStore.user === null → /login 리다이렉트
  → user 있음 → children 렌더
```

---

## 6. 에러 처리

| 상황 | 감지 방법 | UI 표시 |
|------|----------|---------|
| 이메일 중복 (이메일 가입) | `data.user.email_confirmed_at` 존재 | "이미 사용 중인 이메일입니다." |
| 이메일 중복 (Google OAuth 가입) | `data.user.identities.length === 0` | "이미 사용 중인 이메일입니다." |
| 잘못된 로그인 | Supabase 에러: "Invalid login credentials" | "이메일 또는 비밀번호가 올바르지 않습니다." |
| 비밀번호 8자 미만 | 클라이언트 유효성 검사 | "비밀번호는 8자 이상이어야 합니다." |
| 비밀번호 불일치 | 클라이언트 유효성 검사 | "비밀번호가 일치하지 않습니다." |
| 닉네임 공백 | 클라이언트 유효성 검사 | "닉네임을 입력해주세요." |
| 닉네임 길이 위반 | 클라이언트 유효성 검사 | "닉네임은 2~20자여야 합니다." |
| 네트워크 오류 | 기타 error | "오류가 발생했습니다. 다시 시도해주세요." |

### Supabase 이메일 중복 감지 주의사항

Supabase에서 **Email Confirmation이 활성화된 경우**, 이미 가입된 이메일로 `signUp` 호출 시 에러를 반환하지 않고 기존 유저 객체를 반환한다. 따라서 클라이언트에서 직접 중복을 판별해야 한다.

```typescript
// auth-store.ts signUp 내부
const isAlreadyRegisteredByEmail = data.user?.email_confirmed_at;   // 이메일 가입 중복
const isAlreadyRegisteredByOAuth = data.user?.identities?.length === 0; // OAuth 가입 중복
if (isAlreadyRegisteredByEmail || isAlreadyRegisteredByOAuth) {
  throw new Error('already registered');
}
```

> RegisterForm에서는 `message.includes('already registered')`로 에러를 감지해 UI 메시지를 표시한다.

---

## 7. 구현 순서 (Do Phase 가이드)

1. **DB 설정**: Supabase 대시보드에서 `profiles` 테이블 + RLS + 트리거 생성
2. **Supabase Google OAuth 설정**: Supabase 대시보드 Authentication > Providers > Google
3. **타입 정의**: `src/types/index.ts` 에 `Profile`, `AuthUser` 추가
4. **auth-store.ts 확장**: signUp, signInWithGoogle, fetchMe 개선 (nickname 포함)
5. **useAuth.ts 훅**: auth-store 래핑 커스텀 훅
6. **LoginForm.tsx**: 이메일 로그인 폼
7. **RegisterForm.tsx**: 회원가입 폼 (닉네임 포함)
8. **GoogleLoginButton.tsx**: OAuth 버튼
9. **login/page.tsx**: 탭 페이지 (로그인/회원가입 + 구글 버튼)
10. **auth/callback/route.ts**: OAuth Callback 서버 라우트
11. **setup-profile/page.tsx**: 닉네임 설정 페이지 (OAuth 신규가입용)
12. **ProtectedRoute.tsx**: 인증 가드 컴포넌트
13. **layout.tsx 수정**: 앱 시작 시 fetchMe() 호출
14. **기존 page.tsx/rooms/[roomId]**: ProtectedRoute로 감싸기
15. **user.ts 교체**: getTempUserId() → useAuthStore().user.nickname 으로 대체

---

## 8. 환경변수

```env
# .env.local (기존)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...

# Google OAuth는 Supabase 대시보드에서 설정 (환경변수 불필요)
```
