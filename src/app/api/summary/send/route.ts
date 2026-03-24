/**
 * 日次サマリーメール送信
 * POST /api/summary/send
 *
 * Resend（無料枠: 100通/日）を使用
 * Vercel Cron で毎朝8:00に自動実行する想定
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

/** HTMLエスケープ（XSS防止） */
function escHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export async function POST() {
  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;

  if (!resendKey || !notifyEmail) {
    return NextResponse.json({ error: 'Email not configured. Set RESEND_API_KEY and NOTIFY_EMAIL in .env.local' }, { status: 500 });
  }

  // 昨日の通話を集計
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  const { data: calls } = await supabase
    .from('calls')
    .select('*')
    .gte('started_at', `${dateStr}T00:00:00.000Z`)
    .lte('started_at', `${dateStr}T23:59:59.999Z`)
    .order('started_at', { ascending: true });

  const callList = calls || [];

  if (callList.length === 0) {
    return NextResponse.json({ message: 'No calls yesterday, skipping email' });
  }

  // 統計
  let totalDuration = 0;
  let unread = 0;
  let callbackNeeded = 0;
  const categoryCount: Record<string, number> = {};

  for (const c of callList) {
    totalDuration += c.duration || 0;
    if (c.staff_status === 'unread') unread++;
    if (c.callback_needed) callbackNeeded++;
    categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
  }

  const categoryLabels: Record<string, string> = {
    RESERVATION: '予約', INQUIRY: '問合せ', CHANGE: '変更',
    COMPLAINT: 'クレーム', OTHER: 'その他',
  };

  const durationMin = Math.floor(totalDuration / 60);
  const durationSec = totalDuration % 60;

  // メール本文（HTML）
  const callRows = callList.map(c => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 12px; font-size: 14px;">${new Date(c.started_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</td>
      <td style="padding: 12px; font-size: 14px; font-weight: 600;">${escHtml(c.caller_name || c.from_number)}</td>
      <td style="padding: 12px; font-size: 14px;">${escHtml(categoryLabels[c.category] || c.category)}</td>
      <td style="padding: 12px; font-size: 14px; color: #64748b;">${escHtml(c.summary) || '---'}</td>
      <td style="padding: 12px; font-size: 14px;">${c.callback_needed ? '<span style="color: #dc2626;">要</span>' : '---'}</td>
    </tr>
  `).join('');

  const categorySummary = Object.entries(categoryCount)
    .map(([k, v]) => `${categoryLabels[k] || k}: ${v}件`)
    .join('　');

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 640px; margin: 0 auto; background: #ffffff;">
      <div style="background: #4f46e5; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; font-size: 20px; margin: 0;">📞 AI Phone 日次レポート</h1>
        <p style="color: #c7d2fe; font-size: 14px; margin: 8px 0 0;">${dateStr}</p>
      </div>

      <div style="padding: 32px;">
        <div style="display: flex; gap: 16px; margin-bottom: 24px;">
          <div style="flex: 1; background: #f8fafc; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="font-size: 28px; font-weight: 700; color: #0f172a; margin: 0;">${callList.length}</p>
            <p style="font-size: 12px; color: #64748b; margin: 4px 0 0;">総着信数</p>
          </div>
          <div style="flex: 1; background: #f8fafc; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="font-size: 28px; font-weight: 700; color: ${unread > 0 ? '#dc2626' : '#64748b'}; margin: 0;">${unread}</p>
            <p style="font-size: 12px; color: #64748b; margin: 4px 0 0;">未読</p>
          </div>
          <div style="flex: 1; background: #f8fafc; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="font-size: 28px; font-weight: 700; color: ${callbackNeeded > 0 ? '#d97706' : '#64748b'}; margin: 0;">${callbackNeeded}</p>
            <p style="font-size: 12px; color: #64748b; margin: 4px 0 0;">要折返し</p>
          </div>
          <div style="flex: 1; background: #f8fafc; border-radius: 8px; padding: 16px; text-align: center;">
            <p style="font-size: 28px; font-weight: 700; color: #0f172a; margin: 0;">${durationMin}:${String(durationSec).padStart(2, '0')}</p>
            <p style="font-size: 12px; color: #64748b; margin: 4px 0 0;">総通話時間</p>
          </div>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">${categorySummary}</p>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600;">時刻</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600;">発信者</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600;">種別</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600;">要約</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #64748b; font-weight: 600;">折返し</th>
            </tr>
          </thead>
          <tbody>${callRows}</tbody>
        </table>
      </div>

      <div style="background: #f8fafc; padding: 16px 32px; border-radius: 0 0 12px 12px; text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">AI Phone by Centaurus</p>
      </div>
    </div>
  `;

  // Resend API で送信
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'AI Phone <onboarding@resend.dev>',
        to: [notifyEmail],
        subject: `📞 AI Phone日次レポート（${dateStr}）着信${callList.length}件`,
        html,
      }),
    });

    const result = await res.json();

    if (res.ok) {
      return NextResponse.json({ success: true, emailId: result.id });
    } else {
      return NextResponse.json({ error: result }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
