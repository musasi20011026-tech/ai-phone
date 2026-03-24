/**
 * 空席確認ロジック
 * Supabaseの予約テーブルベースで空席を確認し、代替時間を提案
 */

import { createServerClient } from '@/lib/supabase/client';

export interface SeatConfig {
  seatType: string;
  capacity: number;
  count: number;
}

export interface AvailabilityResult {
  available: boolean;
  remainingSeats: number;
  totalSeats: number;
  alternatives: string[];  // 代替時間候補
}

/**
 * 指定日時・人数・席タイプでの空席確認
 */
export async function checkAvailability(
  storeId: string,
  date: string,          // 'YYYY-MM-DD'
  time: string,          // 'HH:MM'
  partySize: number,
  seatType: string = 'any',
  seatConfigs?: SeatConfig[],
): Promise<AvailabilityResult> {
  const supabase = createServerClient();

  // デフォルトの席構成（DB未接続時のフォールバック）
  const defaultSeats: SeatConfig[] = seatConfigs || [
    { seatType: 'counter', capacity: 2, count: 8 },
    { seatType: 'table', capacity: 4, count: 6 },
    { seatType: 'private', capacity: 8, count: 2 },
  ];

  // 席構成をDBから取得（可能な場合）
  let seats = defaultSeats;
  if (supabase) {
    const { data } = await supabase
      .from('store_seats')
      .select('*')
      .eq('store_id', storeId);
    if (data && data.length > 0) {
      seats = data.map((s: any) => ({
        seatType: s.seat_type,
        capacity: s.capacity,
        count: s.count,
      }));
    }
  }

  // 対象時間帯の予約数を取得（前後1時間以内の予約は重複とみなす）
  const timeHour = parseInt(time.split(':')[0], 10);
  const timeMin = parseInt(time.split(':')[1], 10);
  if (isNaN(timeHour) || isNaN(timeMin)) {
    return { available: true, remainingSeats: 1, totalSeats: 1, alternatives: [] };
  }
  const startRange = `${String(Math.max(0, timeHour - 1)).padStart(2, '0')}:${String(timeMin).padStart(2, '0')}`;
  const endHour = Math.min(23, timeHour + 1);
  const endRange = `${String(endHour).padStart(2, '0')}:${String(timeMin).padStart(2, '0')}`;

  let existingReservations: any[] = [];
  if (supabase) {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('store_id', storeId)
      .eq('reservation_date', date)
      .eq('status', 'confirmed')
      .gte('reservation_time', startRange)
      .lte('reservation_time', endRange);
    existingReservations = data || [];
  }

  // 利用可能な席を計算
  const targetSeats = seatType === 'any'
    ? seats.filter(s => s.capacity >= partySize)
    : seats.filter(s => s.seatType === seatType && s.capacity >= partySize);

  const totalAvailable = targetSeats.reduce((sum, s) => sum + s.count, 0);

  // 同時間帯の予約数（席タイプ別）
  // seat_type='any'の予約は全席タイプに均等に分配
  const usedByType: Record<string, number> = {};
  let anyTypeCount = 0;
  for (const r of existingReservations) {
    const type = r.seat_type || 'any';
    if (type === 'any') {
      anyTypeCount++;
    } else {
      usedByType[type] = (usedByType[type] || 0) + 1;
    }
  }

  // 残席計算（'any'予約は容量が合う席から順に消費）
  let remaining = 0;
  let anyRemaining = anyTypeCount;
  for (const s of targetSeats) {
    const used = usedByType[s.seatType] || 0;
    const available = Math.max(0, s.count - used);
    // 'any'予約をこの席タイプから消費
    const anyConsumed = Math.min(anyRemaining, available);
    anyRemaining -= anyConsumed;
    remaining += Math.max(0, available - anyConsumed);
  }

  // 代替時間の提案（満席の場合）
  const alternatives: string[] = [];
  if (remaining <= 0) {
    // 前後30分刻みで代替を探す
    const offsets = [-30, 30, -60, 60, -90, 90];
    for (const offset of offsets) {
      const altMin = timeHour * 60 + timeMin + offset;
      if (altMin < 11 * 60 || altMin > 21 * 60) continue; // 営業時間外

      const altHour = Math.floor(altMin / 60);
      const altMinRemainder = altMin % 60;
      const altTime = `${String(altHour).padStart(2, '0')}:${String(altMinRemainder).padStart(2, '0')}`;

      const altResult = await checkTimeSlot(supabase, storeId, date, altTime, partySize, seatType, seats);
      if (altResult > 0) {
        alternatives.push(altTime);
        if (alternatives.length >= 3) break;
      }
    }
  }

  return {
    available: remaining > 0,
    remainingSeats: remaining,
    totalSeats: totalAvailable,
    alternatives,
  };
}

async function checkTimeSlot(
  supabase: any,
  storeId: string,
  date: string,
  time: string,
  partySize: number,
  seatType: string,
  seats: SeatConfig[],
): Promise<number> {
  if (!supabase) return 1; // DB未接続時は空きありとする

  const timeHour = parseInt(time.split(':')[0]);
  const timeMin = parseInt(time.split(':')[1]);
  const startRange = `${String(Math.max(0, timeHour - 1)).padStart(2, '0')}:${String(timeMin).padStart(2, '0')}`;
  const endRange = `${String(Math.min(23, timeHour + 1)).padStart(2, '0')}:${String(timeMin).padStart(2, '0')}`;

  const { data } = await supabase
    .from('reservations')
    .select('seat_type')
    .eq('store_id', storeId)
    .eq('reservation_date', date)
    .eq('status', 'confirmed')
    .gte('reservation_time', startRange)
    .lte('reservation_time', endRange);

  const reservations = data || [];
  const targetSeats = seatType === 'any'
    ? seats.filter(s => s.capacity >= partySize)
    : seats.filter(s => s.seatType === seatType && s.capacity >= partySize);

  const totalAvailable = targetSeats.reduce((sum, s) => sum + s.count, 0);

  const usedByType: Record<string, number> = {};
  for (const r of reservations) {
    const type = r.seat_type || 'any';
    usedByType[type] = (usedByType[type] || 0) + 1;
  }

  let remaining = 0;
  for (const s of targetSeats) {
    const used = usedByType[s.seatType] || 0;
    remaining += Math.max(0, s.count - used);
  }

  return remaining;
}

/**
 * 空席情報をシステムプロンプト用テキストに変換
 */
export function formatAvailabilityForPrompt(result: AvailabilityResult, time: string): string {
  if (result.available) {
    return `${time}は空席がございます（残り${result.remainingSeats}席）。`;
  }

  if (result.alternatives.length > 0) {
    const altText = result.alternatives.map(t => t).join('、');
    return `申し訳ございません、${time}は満席でございます。代わりに${altText}でしたらご案内可能です。`;
  }

  return `申し訳ございません、${time}は満席でございます。他のお日にちをご検討いただけますでしょうか。`;
}
