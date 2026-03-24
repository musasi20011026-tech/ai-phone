/**
 * リマインドSMS送信API
 * cronジョブから毎日呼び出して前日・当日リマインドを送信
 *
 * 使い方:
 * - 外部cron（Vercel Cron, GitHub Actions等）から POST /api/reminders を毎日10:00に実行
 * - Authorization: Bearer <WEBHOOK_SECRET> ヘッダー必須
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { sendReminderDayBefore, sendReminderSameDay } from '@/lib/twilio/sms';

export async function POST(req: NextRequest) {
  // 認証チェック（SECRET未設定時も拒否）
  const authHeader = req.headers.get('authorization');
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  }

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const results = {
    dayBefore: { sent: 0, failed: 0 },
    sameDay: { sent: 0, failed: 0 },
  };

  // 前日リマインド（明日の予約に送信）
  const { data: tomorrowReservations } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_date', tomorrowStr)
    .eq('status', 'confirmed')
    .eq('reminder_day_before_sent', false);

  if (tomorrowReservations) {
    for (const r of tomorrowReservations) {
      const success = await sendReminderDayBefore(
        r.customer_phone,
        r.customer_name,
        r.reservation_date,
        r.reservation_time,
        r.party_size,
        r.language || 'ja',
      );

      if (success) {
        await supabase
          .from('reservations')
          .update({ reminder_day_before_sent: true })
          .eq('id', r.id);
        results.dayBefore.sent++;
      } else {
        results.dayBefore.failed++;
      }
    }
  }

  // 当日リマインド（今日の予約に送信）
  const { data: todayReservations } = await supabase
    .from('reservations')
    .select('*')
    .eq('reservation_date', todayStr)
    .eq('status', 'confirmed')
    .eq('reminder_same_day_sent', false);

  if (todayReservations) {
    for (const r of todayReservations) {
      const success = await sendReminderSameDay(
        r.customer_phone,
        r.customer_name,
        r.reservation_time,
        r.language || 'ja',
      );

      if (success) {
        await supabase
          .from('reservations')
          .update({ reminder_same_day_sent: true })
          .eq('id', r.id);
        results.sameDay.sent++;
      } else {
        results.sameDay.failed++;
      }
    }
  }

  console.log(`Reminders sent: dayBefore=${results.dayBefore.sent}, sameDay=${results.sameDay.sent}`);

  return NextResponse.json({
    success: true,
    results,
    timestamp: new Date().toISOString(),
  });
}
