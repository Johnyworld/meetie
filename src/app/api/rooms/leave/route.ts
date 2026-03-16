import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { roomId, userId } = await req.json();
  if (!roomId || !userId) return NextResponse.json({ ok: false });

  const { data } = await supabase
    .from('video_rooms')
    .select('participants')
    .eq('id', roomId)
    .single();

  if (!data) return NextResponse.json({ ok: true });

  const remaining = data.participants.filter((id: string) => id !== userId);
  await supabase
    .from('video_rooms')
    .update({
      participants: remaining,
      ...(remaining.length === 0 && {
        status: 'ended',
        ended_at: new Date().toISOString(),
      }),
    })
    .eq('id', roomId);

  return NextResponse.json({ ok: true });
}
