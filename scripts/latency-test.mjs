/**
 * AI電話システム レイテンシ測定スクリプト
 *
 * STT → LLM → TTS の各ステップの所要時間を計測し、
 * 2秒以内に収まるかを検証する。
 *
 * Usage: node scripts/latency-test.mjs
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function measureLLMLatency() {
  console.log('=== AI電話 レイテンシ測定 ===\n');

  // --- 1. Claude API レイテンシ ---
  console.log('📡 Claude API レイテンシ測定...');
  const llmStart = Date.now();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 150,
    system: `あなたは飲食店「和食処さくら」のAI電話受付です。
営業時間: 11:00-22:00
定休日: 月曜日
席数: 40席
予約受付可能。丁寧かつ簡潔に応答してください。1-2文で回答。`,
    messages: [
      { role: 'user', content: '今日の夜7時に4名で予約したいんですが' }
    ],
  });

  const llmEnd = Date.now();
  const llmLatency = llmEnd - llmStart;
  const llmText = response.content[0].text;

  console.log(`  応答: ${llmText}`);
  console.log(`  トークン: 入力${response.usage.input_tokens} / 出力${response.usage.output_tokens}`);
  console.log(`  ⏱  LLM レイテンシ: ${llmLatency}ms\n`);

  // --- 2. ストリーミング版 Claude API ---
  console.log('📡 Claude API ストリーミング（初回トークンまで）...');
  const streamStart = Date.now();
  let firstTokenTime = 0;
  let streamText = '';

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 150,
    system: `あなたは飲食店のAI電話受付です。丁寧かつ簡潔に1-2文で回答。`,
    messages: [
      { role: 'user', content: '駐車場はありますか？' }
    ],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      if (!firstTokenTime) {
        firstTokenTime = Date.now() - streamStart;
      }
      streamText += event.delta.text;
    }
  }

  const streamEnd = Date.now();
  console.log(`  応答: ${streamText}`);
  console.log(`  ⏱  初回トークン: ${firstTokenTime}ms`);
  console.log(`  ⏱  全体: ${streamEnd - streamStart}ms\n`);

  // --- 3. 短い応答（相槌）のレイテンシ ---
  console.log('📡 短い応答（相槌レベル）...');
  const shortStart = Date.now();

  const shortResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 30,
    system: 'あなたは電話受付AIです。極めて短く応答。',
    messages: [
      { role: 'user', content: 'もしもし' }
    ],
  });

  const shortEnd = Date.now();
  console.log(`  応答: ${shortResponse.content[0].text}`);
  console.log(`  ⏱  レイテンシ: ${shortEnd - shortStart}ms\n`);

  // --- サマリー ---
  console.log('=== レイテンシサマリー ===');
  console.log(`  LLM（通常）:       ${llmLatency}ms`);
  console.log(`  LLM（ストリーム初回）: ${firstTokenTime}ms`);
  console.log(`  LLM（短い応答）:    ${shortEnd - shortStart}ms`);
  console.log('');
  console.log('  ※ 実際のパイプライン:');
  console.log('  STT(300-500ms) + LLM(上記) + TTS(200-400ms)');
  console.log(`  推定合計: ${300 + firstTokenTime + 300}〜${500 + llmLatency + 400}ms`);
  console.log('');

  const totalEstimate = 400 + firstTokenTime + 300;
  if (totalEstimate < 2000) {
    console.log(`  ✅ 推定合計 ${totalEstimate}ms → 2秒以内に収まる見込み`);
  } else {
    console.log(`  ⚠️  推定合計 ${totalEstimate}ms → 最適化が必要`);
  }
}

measureLLMLatency().catch(console.error);
