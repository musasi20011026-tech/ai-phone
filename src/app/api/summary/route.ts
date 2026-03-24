/**
 * Daily Summary API
 * 日次着信サマリーを生成してメール送信
 * Cron（Vercel Cron/外部）から毎朝呼び出す or 手動トリガー
 *
 * GET /api/summary        → 今日のサマリーを取得（JSON）
 * POST /api/summary/send  → メール送信
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  }

  // 昨日の0:00〜今日の0:00を対象
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date');

  let targetDate: string;
  if (dateParam) {
    targetDate = dateParam;
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    targetDate = yesterday.toISOString().split('T')[0];
  }

  const startOfDay = `${targetDate}T00:00:00.000Z`;
  const endOfDay = `${targetDate}T23:59:59.999Z`;

  const { data: calls } = await supabase
    .from('calls')
    .select('*')
    .gte('started_at', startOfDay)
    .lte('started_at', endOfDay)
    .order('started_at', { ascending: true });

  const callList = calls || [];

  // 統計
  const totalCalls = callList.length;
  const categories: Record<string, number> = {};
  let totalDuration = 0;
  let unread = 0;
  let callbackNeeded = 0;
  const callers: { name: string; summary: string; category: string; time: string }[] = [];

  for (const c of callList) {
    categories[c.category] = (categories[c.category] || 0) + 1;
    totalDuration += c.duration || 0;
    if (c.staff_status === 'unread') unread++;
    if (c.callback_needed) callbackNeeded++;
    callers.push({
      name: c.caller_name || c.from_number,
      summary: c.summary || '要約なし',
      category: c.category,
      time: new Date(c.started_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
    });
  }

  const summary = {
    date: targetDate,
    totalCalls,
    totalDuration,
    unread,
    callbackNeeded,
    categories,
    callers,
  };

  return NextResponse.json(summary);
}
