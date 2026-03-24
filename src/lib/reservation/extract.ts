/**
 * 会話から予約データを構造化抽出
 * 通話終了時にClaude APIで会話履歴を解析
 */

import { getAnthropicClient } from '@/lib/llm/client';
import type { ConversationMessage } from '@/lib/llm/client';

export interface ExtractedReservation {
  hasReservation: boolean;
  customerName: string | null;
  customerPhone: string | null;
  partySize: number | null;
  reservationDate: string | null;  // 'YYYY-MM-DD'
  reservationTime: string | null;  // 'HH:MM'
  seatType: 'counter' | 'table' | 'private' | 'any' | null;
  courseType: 'course' | 'a_la_carte' | null;
  courseName: string | null;
  allergies: string | null;
  specialRequests: string | null;
  language: string;  // 'ja', 'en', 'zh'
}

/**
 * 会話履歴から予約情報を抽出
 */
export async function extractReservation(
  conversationHistory: ConversationMessage[],
  today: string,  // 'YYYY-MM-DD'
): Promise<ExtractedReservation> {
  const transcript = conversationHistory
    .map(m => `${m.role === 'user' ? '顧客' : 'AI'}: ${m.content}`)
    .join('\n');

  const response = await getAnthropicClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    temperature: 0.1,
    system: `あなたは電話予約の会話から予約情報を抽出するシステムです。
以下のJSON形式のみを出力してください。JSON以外のテキストは一切出力しないでください。

本日の日付: ${today}

{
  "has_reservation": true/false（予約が成立したかどうか）,
  "customer_name": "名前（カタカナ）またはnull",
  "customer_phone": "電話番号またはnull",
  "party_size": 数値またはnull,
  "reservation_date": "YYYY-MM-DD形式またはnull",
  "reservation_time": "HH:MM形式またはnull",
  "seat_type": "counter"/"table"/"private"/"any"/null,
  "course_type": "course"/"a_la_carte"/null,
  "course_name": "コース名またはnull",
  "allergies": "アレルギー情報またはnull",
  "special_requests": "特記事項またはnull",
  "language": "ja"/"en"/"zh"
}

日時変換ルール:
- 「明日」→ 本日+1日の日付
- 「明後日」→ 本日+2日の日付
- 「今週の土曜」→ 次の土曜日の日付
- 「来週の金曜」→ 次の次の金曜日の日付
- 「7時」「19時」→ 文脈から午前/午後を判断（飲食店なら夕方以降は19:00）
- 日付が特定できない場合はnull

席タイプ判定:
- 「カウンター」→ counter
- 「テーブル」→ table
- 「個室」→ private
- 特に指定なし → any

コースタイプ判定:
- コースを注文 → course（コース名も抽出）
- 単品/アラカルト/特に指定なし → a_la_carte

言語判定:
- 会話が日本語 → ja
- 会話が英語 → en
- 会話が中国語 → zh`,
    messages: [{ role: 'user', content: transcript }],
  });

  let text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    const parsed = JSON.parse(text);
    return {
      hasReservation: parsed.has_reservation || false,
      customerName: parsed.customer_name || null,
      customerPhone: parsed.customer_phone || null,
      partySize: parsed.party_size || null,
      reservationDate: parsed.reservation_date || null,
      reservationTime: parsed.reservation_time || null,
      seatType: parsed.seat_type || null,
      courseType: parsed.course_type || null,
      courseName: parsed.course_name || null,
      allergies: parsed.allergies || null,
      specialRequests: parsed.special_requests || null,
      language: parsed.language || 'ja',
    };
  } catch (e) {
    console.error('Reservation extraction parse error:', e);
    return {
      hasReservation: false,
      customerName: null,
      customerPhone: null,
      partySize: null,
      reservationDate: null,
      reservationTime: null,
      seatType: null,
      courseType: null,
      courseName: null,
      allergies: null,
      specialRequests: null,
      language: 'ja',
    };
  }
}

/**
 * 抽出した予約データをSupabaseに保存
 */
export async function saveReservation(
  supabase: any,
  storeId: string,
  callId: string | null,
  data: ExtractedReservation,
  callerPhone: string,
): Promise<string | null> {
  if (!data.hasReservation || !data.reservationDate || !data.reservationTime) {
    return null;
  }

  try {
    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert({
        store_id: storeId,
        call_id: callId,
        customer_name: data.customerName || 'お客様',
        customer_phone: data.customerPhone || callerPhone,
        party_size: data.partySize || 1,
        reservation_date: data.reservationDate,
        reservation_time: data.reservationTime,
        seat_type: data.seatType || 'any',
        course_type: data.courseType || 'a_la_carte',
        course_name: data.courseName,
        allergies: data.allergies,
        special_requests: data.specialRequests,
        status: 'confirmed',
        language: data.language,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Reservation save error:', error);
      return null;
    }

    return reservation?.id || null;
  } catch (e) {
    console.error('Reservation save exception:', e);
    return null;
  }
}
