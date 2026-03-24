/**
 * LINE Messaging API 通知
 * Liteプランの通知手段（SMS代替・無料）
 *
 * LINE Messaging API 無料枠: 月200通（2026年時点）
 * 店舗オーナーへの通知に使用。顧客への通知はLINE公式アカウント経由。
 */

const LINE_API_URL = 'https://api.line.me/v2/bot/message/push';

interface LineConfig {
  channelToken: string;
  userId: string;
}

/**
 * LINE メッセージ送信（共通）
 */
async function sendLineMessage(
  config: LineConfig,
  messages: { type: string; text: string }[],
): Promise<boolean> {
  try {
    const res = await fetch(LINE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.channelToken}`,
      },
      body: JSON.stringify({
        to: config.userId,
        messages,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error(`LINE send failed: ${res.status} ${error}`);
      return false;
    }

    console.log(`LINE message sent to ${config.userId}`);
    return true;
  } catch (e: any) {
    console.error(`LINE send error: ${e.message}`);
    return false;
  }
}

/**
 * 予約確認通知（店舗オーナー向け）
 */
export async function sendLineReservationNotify(
  config: LineConfig,
  data: {
    customerName: string;
    customerPhone: string;
    date: string;
    time: string;
    partySize: number;
    seatType?: string;
    courseName?: string;
    allergies?: string;
  },
): Promise<boolean> {
  const lines = [
    '【新規予約】',
    `${data.customerName}様`,
    `TEL: ${data.customerPhone}`,
    '',
    `日時: ${data.date} ${data.time}`,
    `人数: ${data.partySize}名`,
  ];

  if (data.seatType && data.seatType !== 'any') {
    const seatLabels: Record<string, string> = { counter: 'カウンター', table: 'テーブル', private: '個室' };
    lines.push(`席: ${seatLabels[data.seatType] || data.seatType}`);
  }
  if (data.courseName) lines.push(`コース: ${data.courseName}`);
  if (data.allergies) lines.push(`⚠ アレルギー: ${data.allergies}`);

  return sendLineMessage(config, [{ type: 'text', text: lines.join('\n') }]);
}

/**
 * リマインド通知（店舗オーナー向け・前日まとめ）
 */
export async function sendLineReminderSummary(
  config: LineConfig,
  date: string,
  reservations: { customerName: string; time: string; partySize: number }[],
): Promise<boolean> {
  if (reservations.length === 0) return true;

  const lines = [
    `【明日の予約一覧】${date}`,
    `合計: ${reservations.length}組 / ${reservations.reduce((s, r) => s + r.partySize, 0)}名`,
    '',
  ];

  for (const r of reservations) {
    lines.push(`${r.time} ${r.customerName}様 ${r.partySize}名`);
  }

  return sendLineMessage(config, [{ type: 'text', text: lines.join('\n') }]);
}

/**
 * 通話サマリー通知（店舗オーナー向け）
 */
export async function sendLineCallSummary(
  config: LineConfig,
  data: {
    callerName: string;
    category: string;
    summary: string;
    callbackNeeded: boolean;
  },
): Promise<boolean> {
  const categoryLabels: Record<string, string> = {
    RESERVATION: '予約',
    INQUIRY: '問合せ',
    CHANGE: '変更',
    COMPLAINT: 'クレーム',
    ESCALATION: 'スタッフ要求',
    OTHER: 'その他',
  };

  const lines = [
    `【着信通知】${categoryLabels[data.category] || data.category}`,
    `${data.callerName}`,
    '',
    data.summary,
  ];

  if (data.callbackNeeded) {
    lines.push('');
    lines.push('⚠ 折り返し対応が必要です');
  }

  return sendLineMessage(config, [{ type: 'text', text: lines.join('\n') }]);
}
