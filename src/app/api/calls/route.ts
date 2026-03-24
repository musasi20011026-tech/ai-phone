/**
 * Calls API - 通話ログ一覧取得・ステータス更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ calls: [], error: 'DB not configured' });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
  const limit = isNaN(rawLimit) ? 50 : Math.min(Math.max(1, rawLimit), 200);

  let query = supabase
    .from('calls')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'all') query = query.eq('staff_status', status);
  if (category) query = query.eq('category', category);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ calls: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, staff_status, staff_notes } = body;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (staff_status) updates.staff_status = staff_status;
  if (staff_notes !== undefined) updates.staff_notes = staff_notes;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('calls')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ call: data });
}
