import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nickname, provider')
    .eq('id', data.user.id)
    .single();

  // 구글 신규가입: 닉네임이 이메일 앞부분(기본값)이면 설정 페이지로
  const emailPrefix = data.user.email?.split('@')[0] ?? '';
  const isNewGoogleUser =
    profile?.provider === 'google' && profile?.nickname === emailPrefix;

  if (isNewGoogleUser) {
    return NextResponse.redirect(`${origin}/setup-profile`);
  }

  return NextResponse.redirect(`${origin}/`);
}
