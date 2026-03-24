/**
 * 予約管理API
 * GET: 予約一覧取得（フィルタ対応）
 * PATCH: ステータス変更
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ reservations: [] });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const date = searchParams.get('date');
  const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
  const limit = isNaN(rawLimit) ? 50 : Math.min(Math.max(1, rawLimit), 200);

  let query = supabase
    .from('reservations')
    .select('*')
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true })
    .limit(limit);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (date) {
    query = query.eq('reservation_date', date);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Reservations fetch error:', error);
    return NextResponse.json({ reservations: [] });
  }

  return NextResponse.json({ reservations: data || [] });
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
  const { id, status } = body;

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  }

  const validStatuses = ['confirmed', 'cancelled', 'completed', 'no_show'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { error } = await supabase
    .from('reservations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
