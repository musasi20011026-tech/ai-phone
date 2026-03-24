/**
 * AI電話システム レイテンシ測定スクリプト（Gemini版）
 *
 * STT → LLM → TTS の各ステップの所要時間を計測し、
 * 2秒以内に収まるかを検証する。
 *
 * Usage: node scripts/latency-test-gemini.mjs
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function measureLLMLatency() {
  console.log('=== AI電話 レイテンシ測定（Gemini版） ===\n');

  // --- 1. Gemini Flash（高速モデル）レイテンシ ---
  console.log('📡 Gemini 2.0 Flash レイテンシ測定...');
  const flash = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const systemPrompt = `あなたは飲食店「和食処さくら」のAI電話受付です。
営業時間: 11:00-22:00
定休日: 月曜日
席数: 40席
予約受付可能。丁寧かつ簡潔に応答してください。1-2文で回答。`;

  const flashStart = Date.now();
  const flashResult = await flash.generateContent({
    contents: [{ role: 'user', parts: [{ text: '今日の夜7時に4名で予約したいんですが' }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
  });
  const flashEnd = Date.now();
  const flashLatency = flashEnd - flashStart;
  const flashText = flashResult.response.text();

  console.log(`  応答: ${flashText.trim()}`);
  console.log(`  ⏱  レイテンシ: ${flashLatency}ms\n`);

  // --- 2. ストリーミング版（初回トークンまで）---
  console.log('📡 Gemini Flash ストリーミング（初回トークンまで）...');
  const streamStart = Date.now();
  let firstTokenTime = 0;
  let streamText = '';

  const streamResult = await flash.generateContentStream({
    contents: [{ role: 'user', parts: [{ text: '駐車場はありますか？' }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
  });

  for await (const chunk of streamResult.stream) {
    const text = chunk.text();
    if (text && !firstTokenTime) {
      firstTokenTime = Date.now() - streamStart;
    }
    streamText += text;
  }
  const streamEnd = Date.now();

  console.log(`  応答: ${streamText.trim()}`);
  console.log(`  ⏱  初回トークン: ${firstTokenTime}ms`);
  console.log(`  ⏱  全体: ${streamEnd - streamStart}ms\n`);

  // --- 3. 短い応答（相槌レベル）---
  console.log('📡 短い応答（相槌レベル）...');
  const shortStart = Date.now();

  const shortResult = await flash.generateContent({
    contents: [{ role: 'user', parts: [{ text: 'もしもし' }] }],
    systemInstruction: { parts: [{ text: 'あなたは電話受付AIです。極めて短く応答。' }] },
    generationConfig: { maxOutputTokens: 30, temperature: 0.7 },
  });
  const shortEnd = Date.now();

  console.log(`  応答: ${shortResult.response.text().trim()}`);
  console.log(`  ⏱  レイテンシ: ${shortEnd - shortStart}ms\n`);

  // --- 4. 会話の連続性テスト ---
  console.log('📡 会話連続性テスト（3ターン）...');
  const chat = flash.startChat({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
  });

  const turns = [
    '今日の夜7時に4名で予約できますか？',
    '個室は空いていますか？',
    '名前は田中です。よろしくお願いします。',
  ];

  const turnLatencies = [];
  for (const turn of turns) {
    const turnStart = Date.now();
    const turnResult = await chat.sendMessage(turn);
    const turnLatency = Date.now() - turnStart;
    turnLatencies.push(turnLatency);
    console.log(`  顧客: ${turn}`);
    console.log(`  AI: ${turnResult.response.text().trim()}`);
    console.log(`  ⏱  ${turnLatency}ms\n`);
  }

  // --- 5. 要約生成テスト ---
  console.log('📡 通話要約生成テスト...');
  const summaryStart = Date.now();

  const summaryResult = await flash.generateContent({
    contents: [{ role: 'user', parts: [{ text: `以下の通話内容を分析し、JSON形式で出力してください。

顧客: 今日の夜7時に4名で予約したいんですが
AI: かしこまりました。本日19時、4名様でのご予約ですね。お席をお取りいたします。お名前をお伺いしてもよろしいでしょうか。
顧客: 田中です
AI: 田中様、ありがとうございます。本日19時、4名様でご予約承りました。

JSON形式:
{
  "summary": "通話要約",
  "category": "RESERVATION|INQUIRY|CHANGE|COMPLAINT|OTHER",
  "urgency": "high|medium|low",
  "caller_name": "名前またはnull",
  "callback_needed": true/false,
  "key_details": "重要情報"
}` }] }],
    generationConfig: { maxOutputTokens: 300, temperature: 0.3 },
  });
  const summaryEnd = Date.now();

  console.log(`  要約: ${summaryResult.response.text().trim()}`);
  console.log(`  ⏱  ${summaryEnd - summaryStart}ms\n`);

  // --- サマリー ---
  console.log('========================================');
  console.log('  レイテンシサマリー');
  console.log('========================================');
  console.log(`  通常応答:          ${flashLatency}ms`);
  console.log(`  ストリーム初回:    ${firstTokenTime}ms`);
  console.log(`  短い応答:          ${shortEnd - shortStart}ms`);
  console.log(`  会話ターン平均:    ${Math.round(turnLatencies.reduce((a,b)=>a+b,0)/turnLatencies.length)}ms`);
  console.log(`  要約生成:          ${summaryEnd - summaryStart}ms`);
  console.log('');
  console.log('  実際のパイプライン推定:');
  console.log('  STT(300-500ms) + LLM + TTS(200-400ms)');
  const bestCase = 300 + firstTokenTime + 200;
  const worstCase = 500 + flashLatency + 400;
  console.log(`  ベスト: ${bestCase}ms / ワースト: ${worstCase}ms`);
  console.log('');

  if (bestCase < 2000) {
    console.log(`  ✅ ベストケース ${bestCase}ms → 2秒以内に収まる！`);
  } else {
    console.log(`  ⚠️  ベストケース ${bestCase}ms → 最適化が必要`);
  }

  if (worstCase < 3000) {
    console.log(`  ✅ ワーストケース ${worstCase}ms → 3秒以内で許容範囲`);
  } else {
    console.log(`  ⚠️  ワーストケース ${worstCase}ms → 要最適化`);
  }

  console.log('\n========================================');
  console.log('  判定: Gemini Flash は電話応答に十分な速度か？');
  console.log('========================================');
  if (flashLatency < 1500 && firstTokenTime < 800) {
    console.log('  🎉 合格！ Gemini Flash はAI電話に使用可能です');
  } else if (flashLatency < 2500) {
    console.log('  ⚠️  条件付き合格。ストリーミング必須で対応可能');
  } else {
    console.log('  ❌ 不合格。別モデルまたは最適化が必要');
  }
}

measureLLMLatency().catch(console.error);
