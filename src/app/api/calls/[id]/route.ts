import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ call: null, messages: [] });
  }

  const { data: call } = await supabase
    .from('calls')
    .select('*')
    .eq('id', id)
    .single();

  const { data: messages } = await supabase
    .from('call_messages')
    .select('*')
    .eq('call_id', id)
    .order('created_at', { ascending: true });

  // Mark as read
  if (call && call.staff_status === 'unread') {
    await supabase.from('calls').update({ staff_status: 'read' }).eq('id', id);
  }

  return NextResponse.json({ call, messages: messages || [] });
}
