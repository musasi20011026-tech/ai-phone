/**
 * Twilio Stream Handler - 音声認識結果を受け取り、AIで応答する
 * 予約受付・空席確認・アップセル・多言語対応
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateResponse, summarizeCall, type ConversationMessage, type StoreConfig, type CourseInfo, type SeatInfo, type PlanType } from '@/lib/llm/client';
import { createServerClient } from '@/lib/supabase/client';
import { conversationStore } from './conversation-store';
import { checkAvailability, formatAvailabilityForPrompt } from '@/lib/reservation/availability';

// 店舗ID → プランのキャッシュ（通話中のルーティング用）
// TTL付き: 30分で自動クリーンアップ（異常終了時のメモリリーク防止）
const storeCache = new Map<string, { storeId: string; plan: PlanType; createdAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

// 定期クリーンアップ（5分ごと）
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of storeCache) {
    if (now - val.createdAt > CACHE_TTL_MS) storeCache.delete(key);
  }
  for (const [key] of languageStore) {
    if (!conversationStore.has(key)) languageStore.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * 共有番号ルーティング: From番号から店舗を特定
 * Lite: 店舗が既存番号からTwilio共有番号に転送 → From=店舗番号で特定
 * Standard: 専用番号なので常に同じ店舗
 */
async function resolveStore(from: string, to: string): Promise<{ storeId: string; plan: PlanType } | null> {
  const supabase = createServerClient();
  if (!supabase) return { storeId: DEMO_STORE_ID, plan: 'standard' };

  // まず専用番号（Standard）で検索
  const { data: dedicatedStore } = await supabase
    .from('stores')
    .select('id, plan')
    .eq('dedicated_phone', to)
    .eq('is_active', true)
    .single();

  if (dedicatedStore) {
    return { storeId: dedicatedStore.id, plan: dedicatedStore.plan as PlanType };
  }

  // 共有番号ルーティング（Lite）: phone_routingテーブルで転送元番号から店舗特定
  const { data: routing } = await supabase
    .from('phone_routing')
    .select('store_id')
    .eq('from_number', from)
    .eq('is_active', true)
    .single();

  if (routing) {
    const { data: store } = await supabase
      .from('stores')
      .select('plan')
      .eq('id', routing.store_id)
      .single();

    return { storeId: routing.store_id, plan: (store?.plan || 'lite') as PlanType };
  }

  // フォールバック: デモ設定
  return { storeId: DEMO_STORE_ID, plan: 'standard' };
}

/**
 * Liteプラン: 月間着信上限チェック（50回）
 */
async function checkCallLimit(storeId: string): Promise<boolean> {
  const supabase = createServerClient();
  if (!supabase) return true;

  const { data } = await supabase
    .from('stores')
    .select('plan, monthly_call_count, call_count_reset_at')
    .eq('id', storeId)
    .single();

  if (!data || data.plan !== 'lite') return true;

  // 月初リセット
  const resetAt = new Date(data.call_count_reset_at);
  const now = new Date();
  if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
    await supabase.from('stores').update({
      monthly_call_count: 0,
      call_count_reset_at: now.toISOString(),
    }).eq('id', storeId);
    return true;
  }

  return data.monthly_call_count < 50;
}

/**
 * 着信カウントをインクリメント
 */
async function incrementCallCount(storeId: string) {
  try {
    const supabase = createServerClient();
    if (!supabase) return;

    const { data } = await supabase
      .from('stores')
      .select('monthly_call_count')
      .eq('id', storeId)
      .single();

    if (data) {
      await supabase.from('stores').update({
        monthly_call_count: (data.monthly_call_count || 0) + 1,
      }).eq('id', storeId);
    }
  } catch (e) {
    console.log('Call count increment skipped');
  }
}

// デモ用の店舗設定（DB接続後はDBから取得）
const DEMO_STORE_CONFIG: StoreConfig = {
  storeName: '和食処さくら',
  businessHours: '11:00〜22:00（ラストオーダー 21:30）',
  closedDays: '毎週月曜日',
  address: '東京都渋谷区神南1-1-1',
  phoneNumber: '03-1234-5678',
  seatCount: 40,
  tone: 'polite',
  faq: [
    { question: '駐車場はありますか', answer: '提携駐車場がございます。お会計時に駐車券をご提示いただければ2時間まで無料です。' },
    { question: '個室はありますか', answer: '4名様用と8名様用の個室がございます。ご予約時にお申し付けください。' },
    { question: 'アレルギー対応は可能ですか', answer: 'はい、事前にお知らせいただければ対応いたします。' },
    { question: '支払い方法は何が使えますか', answer: '現金、クレジットカード（VISA/Master/JCB/AMEX）、PayPay、交通系ICがご利用いただけます。' },
    { question: '子供連れでも大丈夫ですか', answer: 'はい、お子様用の椅子もご用意しております。お気軽にお越しください。' },
  ],
  menuItems: [
    'ランチ定食 1,200円（11:00-14:00）',
    '日替わり定食 1,000円（11:00-14:00）',
    '天ぷら盛り合わせ 1,800円',
    '刺身盛り合わせ 2,200円',
    '焼き魚定食 1,500円',
  ],
  courses: [
    { name: '季節のおまかせコース', price: 5000, description: '前菜・刺身・焼物・揚物・食事・デザート全7品', recommendedPartySize: '2〜4名様向け', isRecommended: true },
    { name: '宴会コース', price: 4000, description: '前菜・刺身・揚物・鍋・食事全5品', recommendedPartySize: '4〜8名様向け' },
    { name: '特選コース', price: 8000, description: '特選素材を使用した全9品。接待・記念日に', recommendedPartySize: '2〜6名様向け' },
    { name: '飲み放題プラン', price: 2000, description: 'コースに+2,000円で2時間飲み放題' },
  ],
  seats: [
    { type: 'counter', label: 'カウンター席', capacity: 2, count: 8 },
    { type: 'table', label: 'テーブル席', capacity: 4, count: 6 },
    { type: 'private', label: '個室', capacity: 8, count: 2 },
  ],
  plan: 'standard',
};

const DEMO_STORE_ID = 'demo-store-001';

// 検出言語を保持するストア
const languageStore = new Map<string, string>();

// Supabaseに通話ログを保存
async function saveCallLog(callSid: string, from: string, to: string, storeId: string) {
  try {
    const supabase = createServerClient();
    if (!supabase) return;
    const { error } = await supabase.from('calls').upsert({
      call_sid: callSid,
      store_id: storeId,
      from_number: from,
      to_number: to,
      direction: 'inbound',
      status: 'in-progress',
    }, { onConflict: 'call_sid' });
    if (error) console.log('DB save skipped (table may not exist yet):', error.message);
  } catch (e) {
    console.log('DB not connected yet, skipping save');
  }
}

// メッセージを保存
async function saveMessage(callSid: string, role: string, content: string) {
  try {
    const supabase = createServerClient();
    if (!supabase) return;
    const { data: call } = await supabase.from('calls').select('id').eq('call_sid', callSid).single();
    if (call) {
      await supabase.from('call_messages').insert({
        call_id: call.id,
        role,
        content,
      });
    }
  } catch (e) {
    console.log('DB not connected yet, skipping message save');
  }
}

/**
 * 会話内容から予約日時を推定して空席情報を動的取得
 */
async function getAvailabilityContext(history: ConversationMessage[], userMessage: string): Promise<string> {
  const fullText = [...history.map(m => m.content), userMessage].join(' ');

  // 日時パターンの簡易検出
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  let targetDate = '';
  let targetTime = '';

  // 日付検出
  if (/明日/.test(fullText)) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    targetDate = tomorrow.toISOString().split('T')[0];
  } else if (/明後日|あさって/.test(fullText)) {
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    targetDate = dayAfter.toISOString().split('T')[0];
  } else if (/今週.*(土|saturday)/i.test(fullText)) {
    const sat = new Date(today);
    sat.setDate(sat.getDate() + (6 - sat.getDay()));
    targetDate = sat.toISOString().split('T')[0];
  } else if (/今週.*(日|sunday)/i.test(fullText)) {
    const sun = new Date(today);
    sun.setDate(sun.getDate() + (7 - sun.getDay()));
    targetDate = sun.toISOString().split('T')[0];
  }

  // 具体的な日付 (M月D日)
  const dateMatch = fullText.match(/(\d{1,2})月(\d{1,2})日/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]);
    const day = parseInt(dateMatch[2]);
    const year = today.getFullYear();
    targetDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // 時間検出
  const timeMatch = fullText.match(/(\d{1,2})(時|:|：)(\d{0,2})/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const min = timeMatch[3] ? parseInt(timeMatch[3], 10) || 0 : 0;
    if (!isNaN(hour)) {
      // 飲食店の文脈: 1-5は13-17時（午後）、6-9は18-21時（夜）
      // 10-11はそのまま（ランチ時間帯）、12以上はそのまま
      if (hour >= 1 && hour <= 9) hour += 12;
      targetTime = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    }
  }

  // 英語時間 "7 PM", "at 7"
  const engTimeMatch = fullText.match(/(\d{1,2})\s*(pm|PM|p\.m\.|evening)/i);
  if (engTimeMatch) {
    let hour = parseInt(engTimeMatch[1]);
    if (hour < 12) hour += 12;
    targetTime = `${String(hour).padStart(2, '0')}:00`;
  }

  // 人数検出
  let partySize = 2; // デフォルト
  const sizeMatch = fullText.match(/(\d+)\s*(名|人|位|guests?|people|persons?)/i);
  if (sizeMatch) {
    partySize = parseInt(sizeMatch[1]);
  }

  if (!targetDate || !targetTime) return '';

  try {
    const result = await checkAvailability(DEMO_STORE_ID, targetDate, targetTime, partySize);
    return formatAvailabilityForPrompt(result, targetTime);
  } catch (e) {
    console.log('Availability check skipped:', e);
    return '';
  }
}

/**
 * 言語を検出（簡易版）
 */
function detectLanguage(text: string): string {
  // 中国語（簡体字・繁体字の頻出文字）
  if (/[\u4e00-\u9fff]/.test(text) && !/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
    return 'zh';
  }
  // 英語（ラテン文字のみ）
  if (/^[a-zA-Z0-9\s.,!?'"()-]+$/.test(text.trim())) {
    return 'en';
  }
  return 'ja';
}

/**
 * TwiMLの言語設定を取得
 */
function getTwimlLanguageConfig(lang: string): { language: string; voice: string; gatherLang: string } {
  switch (lang) {
    case 'en':
      return { language: 'en-US', voice: 'Polly.Joanna', gatherLang: 'en-US' };
    case 'zh':
      return { language: 'cmn-CN', voice: 'Polly.Zhiyu', gatherLang: 'cmn-CN' };
    default:
      return { language: 'ja-JP', voice: 'Polly.Mizuki', gatherLang: 'ja-JP' };
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const speechResult = formData.get('SpeechResult') as string;
  const callSid = formData.get('CallSid') as string;
  const confidence = formData.get('Confidence') as string;
  const from = formData.get('From') as string || '';
  const to = formData.get('To') as string || '';

  console.log(`STT result: "${speechResult}" (confidence: ${confidence}, CallSid: ${callSid})`);

  // 店舗ルーティング（共有番号 or 専用番号）
  let storeCacheEntry = storeCache.get(callSid);
  if (!storeCacheEntry) {
    const resolved = await resolveStore(from, to) || { storeId: DEMO_STORE_ID, plan: 'standard' as PlanType };
    storeCacheEntry = { ...resolved, createdAt: Date.now() };
    storeCache.set(callSid, storeCacheEntry);
  }
  const storeInfo = { storeId: storeCacheEntry.storeId, plan: storeCacheEntry.plan };
  const currentPlan = storeInfo.plan;

  // Liteプラン: 月間着信上限チェック
  if (currentPlan === 'lite' && !conversationStore.has(callSid)) {
    const withinLimit = await checkCallLimit(storeInfo.storeId);
    if (!withinLimit) {
      const limitMsg = 'ただいま電話の自動応答サービスが上限に達しております。恐れ入りますが、しばらくしてからおかけ直しください。';
      const jaConfig = getTwimlLanguageConfig('ja');
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${jaConfig.language}" voice="${jaConfig.voice}">${escapeXml(limitMsg)}</Say>
  <Hangup/>
</Response>`;
      return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
    }
    await incrementCallCount(storeInfo.storeId);
  }

  // 言語検出（Liteは日本語固定、Standardは自動検出）
  let currentLang = 'ja';
  if (currentPlan === 'standard') {
    const detectedLang = speechResult ? detectLanguage(speechResult) : 'ja';
    if (detectedLang !== 'ja') {
      languageStore.set(callSid, detectedLang);
    }
    currentLang = languageStore.get(callSid) || 'ja';
  }
  const langConfig = getTwimlLanguageConfig(currentLang);

  if (!speechResult) {
    const noHearMsg = currentLang === 'en'
      ? "I'm sorry, I couldn't hear you. Could you please repeat that?"
      : currentLang === 'zh'
      ? '抱歉，我没有听清楚。请您再说一遍好吗？'
      : 'お声が聞き取れませんでした。もう一度お話しいただけますか。';

    const twiml = buildTwiml(noHearMsg, callSid, langConfig);
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
  }

  // 会話履歴を取得/作成
  if (!conversationStore.has(callSid)) {
    conversationStore.set(callSid, []);
    await saveCallLog(callSid, from, to, storeInfo.storeId);
  }
  const history = conversationStore.get(callSid)!;

  // 終了判定（多言語）
  // 終了判定（短い発話かつ終了ワードのみの場合に限定。途中の「ありがとう」で切らない）
  const trimmed = speechResult.trim();
  const isShortUtterance = trimmed.length < 30;
  const goodbyePatterns = [
    /^(ありがとう(ございま(す|した))?|結構です|大丈夫です|以上です|切ります|失礼します|それだけです)$/,
    /^(thank you|that's all|goodbye|bye|no more questions?)$/i,
    /^(谢谢|好的|没有了|再见|就这样)$/,
  ];
  const isGoodbye = isShortUtterance && goodbyePatterns.some(p => p.test(trimmed));

  if (isGoodbye) {
    history.push({ role: 'user', content: speechResult });
    await saveMessage(callSid, 'user', speechResult);

    const goodbyeMsg = currentLang === 'en'
      ? 'Thank you for calling. Goodbye.'
      : currentLang === 'zh'
      ? '感谢您的来电。再见。'
      : 'お電話ありがとうございました。それでは失礼いたします。';

    languageStore.delete(callSid);
    storeCache.delete(callSid);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${langConfig.language}" voice="${langConfig.voice}">
    ${escapeXml(goodbyeMsg)}
  </Say>
  <Hangup/>
</Response>`;

    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
  }

  // 空席情報を動的取得してコンテキスト注入
  const availabilityContext = await getAvailabilityContext(history, speechResult);

  // StoreConfigに動的情報+プラン情報を追加
  const dynamicConfig: StoreConfig = {
    ...DEMO_STORE_CONFIG,
    availabilityContext,
    todayDate: new Date().toISOString().split('T')[0],
    plan: currentPlan,
    // Liteプラン: コース・多言語情報を除外（プロンプト軽量化）
    ...(currentPlan === 'lite' ? { courses: undefined, seats: undefined } : {}),
  };

  // Claude APIで応答生成
  const startTime = Date.now();

  try {
    const response = await generateResponse(dynamicConfig, history, speechResult);
    const latency = Date.now() - startTime;

    console.log(`AI response (${latency}ms, lang:${currentLang}): "${response.text}"`);

    // 会話履歴に追加
    history.push({ role: 'user', content: speechResult });
    history.push({ role: 'assistant', content: response.text });

    // DB保存（非同期・エラーは握りつぶす）
    saveMessage(callSid, 'user', speechResult).catch(() => {});
    saveMessage(callSid, 'assistant', response.text).catch(() => {});

    const twiml = buildTwiml(response.text, callSid, langConfig);
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
  } catch (error) {
    console.error('AI error:', error);
    const errorMsg = currentLang === 'en'
      ? 'I apologize, we are experiencing technical difficulties. Please try again later.'
      : currentLang === 'zh'
      ? '非常抱歉，系统出现了问题。请稍后再试。'
      : '申し訳ございません。只今システムに不具合が発生しております。後ほど改めてお電話いただけますか。';

    const twiml = buildTwiml(errorMsg, callSid, langConfig);
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
  }
}

function buildTwiml(
  responseText: string,
  callSid: string,
  langConfig: { language: string; voice: string; gatherLang: string },
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const followUpMsg = langConfig.gatherLang.startsWith('en')
    ? 'Is there anything else I can help you with?'
    : langConfig.gatherLang.startsWith('cmn')
    ? '还有其他需要帮助的吗？'
    : '他にご質問はございますか。';

  const closingMsg = langConfig.gatherLang.startsWith('en')
    ? 'Thank you for calling. Goodbye.'
    : langConfig.gatherLang.startsWith('cmn')
    ? '感谢您的来电。再见。'
    : 'お電話ありがとうございました。失礼いたします。';

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="${langConfig.language}" voice="${langConfig.voice}">${escapeXml(responseText.replace(/\n+/g, ' ').trim())}</Say>
  <Gather input="speech"
         language="${langConfig.gatherLang}"
         speechTimeout="3"
         timeout="8"
         action="${appUrl}/api/twilio/stream"
         method="POST">
  </Gather>
  <Say language="${langConfig.language}" voice="${langConfig.voice}">
    ${escapeXml(followUpMsg)}
  </Say>
  <Gather input="speech"
         language="${langConfig.gatherLang}"
         speechTimeout="3"
         timeout="8"
         action="${appUrl}/api/twilio/stream"
         method="POST">
  </Gather>
  <Say language="${langConfig.language}" voice="${langConfig.voice}">
    ${escapeXml(closingMsg)}
  </Say>
  <Hangup/>
</Response>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
