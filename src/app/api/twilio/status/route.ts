/**
 * Twilio Status Callback - 通話終了時に要約生成・予約データ抽出・DB更新
 * プラン別: Lite=Haiku要約+LINE通知、Standard=Sonnet要約+SMS通知
 */

import { NextRequest, NextResponse } from 'next/server';
import { summarizeCall, type PlanType } from '@/lib/llm/client';
import { createServerClient } from '@/lib/supabase/client';
import { conversationStore } from '../stream/conversation-store';
import { sendCustomerSms, sendOwnerSms } from '@/lib/twilio/sms';
import { extractReservation, saveReservation } from '@/lib/reservation/extract';
import { sendLineReservationNotify, sendLineCallSummary } from '@/lib/line/notify';

const OWNER_PHONE = process.env.OWNER_PHONE_NUMBER || '';
const DEMO_STORE_ID = 'demo-store-001';

/**
 * 店舗のプランとLINE設定を取得
 */
async function getStoreConfig(supabase: any, callSid: string): Promise<{
  storeId: string;
  plan: PlanType;
  lineChannelToken: string | null;
  lineUserId: string | null;
}> {
  const { data: call } = await supabase
    .from('calls')
    .select('store_id')
    .eq('call_sid', callSid)
    .single();

  const storeId = call?.store_id || DEMO_STORE_ID;

  const { data: store } = await supabase
    .from('stores')
    .select('plan, line_channel_token, line_user_id')
    .eq('id', storeId)
    .single();

  return {
    storeId,
    plan: (store?.plan || 'standard') as PlanType,
    lineChannelToken: store?.line_channel_token || null,
    lineUserId: store?.line_user_id || null,
  };
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const callSid = formData.get('CallSid') as string;
  const callStatus = formData.get('CallStatus') as string;
  const duration = formData.get('CallDuration') as string;

  console.log(`Call status: ${callStatus} (SID: ${callSid}, Duration: ${duration}s)`);

  if (['completed', 'no-answer', 'busy', 'failed'].includes(callStatus)) {
    const history = conversationStore.get(callSid);
    const supabase = createServerClient();

    if (history && history.length > 0 && supabase) {
      console.log(`Generating summary for ${callSid} (${history.length} messages)`);

      try {
        // 店舗設定取得
        const storeConfig = await getStoreConfig(supabase, callSid);
        const { storeId, plan } = storeConfig;

        // 要約生成と予約データ抽出を並列実行（プラン別モデル）
        const today = new Date().toISOString().split('T')[0];
        const [result, reservationData] = await Promise.all([
          summarizeCall(history, plan),
          extractReservation(history, today),
        ]);

        console.log(`Summary (${plan}): ${result.summary}`);
        console.log(`Reservation extracted: ${reservationData.hasReservation}`);

        // 通話ログのcall_idを取得
        const { data: callRecord } = await supabase
          .from('calls')
          .select('id')
          .eq('call_sid', callSid)
          .single();

        // 通話ログ更新
        await supabase.from('calls').update({
          status: callStatus,
          duration: parseInt(duration) || 0,
          summary: result.summary,
          category: result.category,
          urgency: result.urgency,
          caller_name: result.callerName || null,
          callback_needed: result.callbackNeeded || false,
          key_details: result.keyDetails || null,
          ended_at: new Date().toISOString(),
        }).eq('call_sid', callSid);

        // 予約データをDBに保存
        const callerNumber = formData.get('From') as string || '';
        if (reservationData.hasReservation) {
          const reservationId = await saveReservation(
            supabase,
            storeId,
            callRecord?.id || null,
            reservationData,
            callerNumber,
          );
          if (reservationId) {
            console.log(`Reservation saved: ${reservationId}`);
          }
        }

        // 通知送信（プラン別）
        if (plan === 'lite') {
          // Liteプラン: LINE通知（SMS不使用 → コスト¥0）
          if (storeConfig.lineChannelToken && storeConfig.lineUserId) {
            const lineConfig = {
              channelToken: storeConfig.lineChannelToken,
              userId: storeConfig.lineUserId,
            };

            // 予約通知
            if (reservationData.hasReservation) {
              await sendLineReservationNotify(lineConfig, {
                customerName: reservationData.customerName || 'お客様',
                customerPhone: reservationData.customerPhone || callerNumber,
                date: reservationData.reservationDate || '',
                time: reservationData.reservationTime || '',
                partySize: reservationData.partySize || 1,
                seatType: reservationData.seatType || undefined,
                courseName: reservationData.courseName || undefined,
                allergies: reservationData.allergies || undefined,
              });
            } else {
              // 予約以外の着信もLINEで通知
              await sendLineCallSummary(lineConfig, {
                callerName: result.callerName || callerNumber,
                category: result.category,
                summary: result.summary,
                callbackNeeded: result.callbackNeeded || false,
              });
            }
          }
        } else {
          // Standardプラン: SMS通知（従来通り）
          if (result.category === 'RESERVATION' && result.keyDetails) {
            const smsData = {
              callerName: result.callerName || reservationData.customerName || 'お客様',
              callerNumber,
              summary: result.summary,
              keyDetails: result.keyDetails,
              category: result.category,
              language: reservationData.language,
            };

            if (callerNumber) {
              await sendCustomerSms(callerNumber, smsData);
            }
            if (OWNER_PHONE) {
              await sendOwnerSms(OWNER_PHONE, smsData);
            }
          }
        }

      } catch (e) {
        console.error('Summary/reservation error:', e);
        await supabase.from('calls').update({
          status: callStatus,
          duration: parseInt(duration) || 0,
          ended_at: new Date().toISOString(),
        }).eq('call_sid', callSid);
      }
    } else if (supabase) {
      await supabase.from('calls').update({
        status: callStatus,
        duration: parseInt(duration) || 0,
        ended_at: new Date().toISOString(),
      }).eq('call_sid', callSid);
    }

    conversationStore.delete(callSid);
  }

  return NextResponse.json({ received: true });
}
