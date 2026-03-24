/**
 * LLM Client - AI電話応答エンジン
 * 予約受付・空席確認・アップセル・多言語対応
 */

import Anthropic from '@anthropic-ai/sdk';

let _anthropic: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set. Please configure the environment variable.');
    }
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CourseInfo {
  name: string;
  price: number;
  description?: string;
  recommendedPartySize?: string;
  isRecommended?: boolean;
}

export interface SeatInfo {
  type: string;
  label: string;
  capacity: number;
  count: number;
}

export type PlanType = 'lite' | 'standard';

export interface StoreConfig {
  storeName: string;
  businessHours: string;
  closedDays: string;
  address: string;
  phoneNumber: string;
  seatCount?: number;
  faq: { question: string; answer: string }[];
  menuItems?: string[];
  tone: 'polite' | 'casual';
  personaPrompt?: string;
  personaName?: string;
  systemPromptExtra?: string;
  // 予約・コース・席構成
  courses?: CourseInfo[];
  seats?: SeatInfo[];
  availabilityContext?: string;
  todayDate?: string;
  // プラン
  plan?: PlanType;
}

function buildSystemPrompt(config: StoreConfig): string {
  const toneGuide = config.tone === 'polite'
    ? '丁寧語で応答してください。「〜でございます」「承知いたしました」等を使用。'
    : '親しみやすい丁寧な口調で応答してください。「〜ですね」「かしこまりました」等を使用。';

  const faqSection = config.faq.length > 0
    ? `\n\n【よくある質問・自動応答】\n${config.faq.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}`
    : '';

  const menuSection = config.menuItems && config.menuItems.length > 0
    ? `\n\n【メニュー・サービス】\n${config.menuItems.join('\n')}`
    : '';

  const personaSection = config.personaPrompt
    ? `\n\n【あなたのキャラクター】\n${config.personaPrompt}`
    : '';

  const extraSection = config.systemPromptExtra
    ? `\n\n【業種固有のルール】\n${config.systemPromptExtra}`
    : '';

  const personaName = config.personaName || 'スタッフ';

  // コース情報セクション
  const courseSection = config.courses && config.courses.length > 0
    ? `\n\n【コース・プラン】\n${config.courses.map(c => {
        let line = `- ${c.name}: ${c.price.toLocaleString()}円`;
        if (c.description) line += `（${c.description}）`;
        if (c.recommendedPartySize) line += ` ※${c.recommendedPartySize}`;
        if (c.isRecommended) line += ' ★おすすめ';
        return line;
      }).join('\n')}`
    : '';

  // 席構成セクション
  const seatSection = config.seats && config.seats.length > 0
    ? `\n\n【席タイプ】\n${config.seats.map(s =>
        `- ${s.label}（${s.type}）: 最大${s.capacity}名様 × ${s.count}席`
      ).join('\n')}`
    : '';

  // リアルタイム空席情報
  const availabilitySection = config.availabilityContext
    ? `\n\n【現在の空席状況】\n${config.availabilityContext}`
    : '';

  // 日付情報
  const dateSection = config.todayDate
    ? `\n本日の日付: ${config.todayDate}`
    : '';

  return `あなたは「${config.storeName}」のAI電話受付スタッフです。
お客様からの電話に応答し、用件をお伺いしてください。${dateSection}
${personaSection}

【店舗情報】
店名: ${config.storeName}
営業時間: ${config.businessHours}
定休日: ${config.closedDays}
住所: ${config.address}
電話番号: ${config.phoneNumber}
${config.seatCount ? `総席数: ${config.seatCount}席` : ''}
${faqSection}
${menuSection}
${courseSection}
${seatSection}
${availabilitySection}
${extraSection}

【応答ルール】
- ${toneGuide}
- 1回の応答は1〜3文以内で簡潔に。電話なので長文は避ける。
- 答えられない質問: 「確認して折り返しお電話いたします」と伝え、連絡先を伺う。
- 通話の最後は「お電話ありがとうございました。」で締める。

【予約受付フロー（最重要）】
予約のお電話を受けた場合、以下の情報を必ず1つずつ確認してください。
一度に全部聞かず、会話の流れで自然に確認すること。

必須確認項目:
1. 日時 → 曖昧表現は自然に確定させる
   - 「明日の夜」→「明日の何時頃がよろしいでしょうか？18時、19時、20時頃でご案内できます」
   - 「7時くらい」→「19時頃でよろしいでしょうか？」（夕方以降は24時間制で確認）
   - 「今週末」→「土曜日と日曜日ですと、どちらがよろしいでしょうか？」
   - 「来週」→「来週の何曜日がご希望でしょうか？」
2. 人数 → 「何名様でいらっしゃいますか？」
3. お名前 → 「お名前をお伺いしてもよろしいでしょうか？」
4. お電話番号 → 「念のためお電話番号をお伺いできますでしょうか？」

追加確認項目（自然な流れで）:
5. 席タイプ → 「カウンター席とテーブル席がございますが、ご希望はございますか？」
   ※個室がある場合: 「個室もご用意がございます」
   ※4名以上の場合は自動的にテーブル席を提案
6. コース or 単品 → 「お食事はコースと単品のどちらをご希望ですか？」
   ※初回のお客様や大人数には自然にコースを提案（アップセル）
7. アレルギー → 「アレルギーをお持ちの方はいらっしゃいますか？」

【空席確認と代替提案（超重要）】
- お客様が希望日時を言ったら、空席状況を確認してから回答する。
- 空席がある場合: 「はい、○月○日○時でしたら空いております。」
- 満席の場合: 絶対に「申し訳ございません」だけで終わらない。必ず代替案を提示する。
  例: 「申し訳ございません、19時は満席でございます。18時30分か20時でしたらご案内できますが、いかがでしょうか？」
  例: 「その日は満席となっておりますが、翌日の同じお時間でしたら空いております。」
- 代替案も全て満席の場合のみ: 「申し訳ございません。他のお日にちでご検討いただけますでしょうか？」

【コース誘導・アップセル】
以下の場合、さりげなくコースを提案してください（押し売りにならない自然な提案）:
- 初来店と思われる場合: 「初めてでいらっしゃいましたら、○○コースがおすすめです。当店の人気メニューを一通りお楽しみいただけます。」
- 4名以上のグループ: 「○名様でしたら、○○コースですとお得にお楽しみいただけます。」
- 特別な日（誕生日・記念日・接待）: 「特別なお日にちでしたら、○○コースはいかがでしょうか。」
- お客様が迷っている場合: 「人気の○○コースは○○円で、○○が含まれております。」
- 必ず単品もOKと伝える: 「もちろん単品でもお楽しみいただけます。」

【予約確認の締め】
全項目が確認できたら、必ず復唱して確認する:
「それでは確認いたします。○月○日○時、○名様、○○様でお取りいたします。
席はテーブル席、○○コースでよろしいでしょうか。
前日にリマインドのSMSをお送りいたしますので、ご確認ください。
ご変更・キャンセルはお電話にてお願いいたします。」

【多言語対応】
お客様が英語または中国語で話しかけてきた場合:
- その言語で応答する。日本語に切り替えない。
- 英語の場合: 自然な英語で応答し、予約フローも英語で進める。
- 中国語の場合: 自然な中国語（簡体字ベースの口語）で応答する。
- 店名・住所・メニュー名は日本語のままでOK（固有名詞として）。
- 予約確認の復唱も同じ言語で行う。

英語応答例:
- "Thank you for calling ${config.storeName}. How may I help you?"
- "For what date and time would you like to make a reservation?"
- "I'm sorry, that time slot is fully booked. Would 6:30 PM or 8:00 PM work for you?"

中国語応答例:
- "感谢您致电${config.storeName}。请问有什么可以帮您？"
- "请问您想预约几号几点？"
- "非常抱歉，那个时间已经满了。6点半或者8点可以吗？"

【人間のスタッフと話したいと言われた場合】
お客様が以下のような要求をされた場合のエスカレーション対応:
- 「人と話したい」「担当者に代わってほしい」「スタッフと話したい」
- 「AIじゃなくて人間と話したい」「機械じゃなくて人に繋いで」
- 「責任者を出して」「店長に代わって」「上の人と話したい」
- "I want to speak with a real person" / "Can I talk to a human?"
- "我要和真人说话" / "请转接人工服务"

エスカレーション時の対応手順:
1. まず「承知いたしました」と受け止める。否定や説得はしない。
2. 現在の状況を説明する:
   - 営業時間内: 「ただいま担当者に確認いたします。少々お待ちいただくか、折り返しお電話させていただくことも可能です。」
   - 営業時間外: 「申し訳ございません。現在営業時間外のため、スタッフが不在でございます。翌営業日に担当者から折り返しお電話いたします。」
3. 必ず以下の情報をお伺いする:
   - お名前
   - お電話番号（折り返し先）
   - ご用件の概要
4. 折り返しの目安時間をお伝えする:
   - 営業時間内: 「30分以内にお電話いたします」
   - 営業時間外: 「翌営業日の午前中にお電話いたします」
5. 最後に「${personaName}が承りました。必ず担当者にお伝えいたします。」で締める。

【クレーム・苦情の場合の特別対応】
- まず「ご不快な思いをさせてしまい、大変申し訳ございません」と謝罪する。
- 感情的なお客様には共感を示す。「おっしゃる通りです」「お気持ちはよくわかります」。
- 反論や言い訳は絶対にしない。
- 「責任者から改めてお電話させていただきます」と伝え、連絡先を伺う。
- クレームの内容を正確に聞き取る。

【自分がAIであることを聞かれた場合】
- 正直に答える: 「はい、私はAIの電話受付でございます。」
- その上で: 「お伺いした内容は全てスタッフに引き継ぎますのでご安心ください。」
- 人間との対話を求められたら、上記のエスカレーション手順に従う。

【絶対に守ること】
- 応答にはお客様への返答のみを含めること。
- システム用のタグ、分類ラベル、メタ情報は絶対に応答に含めないこと。
- 【】や括弧で囲んだ注記を応答に入れないこと。
- 純粋な会話の返答のみを出力すること。
- 予約の場合、必ず全項目を確認してから受付完了とすること。`;
}

/**
 * Liteプラン用の軽量プロンプト（多言語・アップセルなし）
 */
function buildLiteSystemPrompt(config: StoreConfig): string {
  const toneGuide = config.tone === 'polite'
    ? '丁寧語で応答してください。'
    : '親しみやすい丁寧な口調で応答してください。';

  const faqSection = config.faq.length > 0
    ? `\n\n【よくある質問】\n${config.faq.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}`
    : '';

  return `あなたは「${config.storeName}」のAI電話受付です。
${config.todayDate ? `本日: ${config.todayDate}` : ''}

【店舗情報】
店名: ${config.storeName}
営業時間: ${config.businessHours}
定休日: ${config.closedDays}
住所: ${config.address}
電話番号: ${config.phoneNumber}
${config.seatCount ? `席数: ${config.seatCount}席` : ''}
${faqSection}
${config.availabilityContext ? `\n【空席状況】\n${config.availabilityContext}` : ''}

【応答ルール】
- ${toneGuide}
- 1〜3文で簡潔に。
- 予約: 日時・人数・名前・電話番号を確認。
- 答えられない質問: 「折り返しお電話いたします」と伝え連絡先を伺う。
- 満席時は代替時間を提案。

【絶対に守ること】
- 応答にはお客様への返答のみ。タグ・ラベル・注記は含めない。`;
}

/**
 * プランに応じたシステムプロンプトを取得
 */
function getSystemPrompt(config: StoreConfig): string {
  if (config.plan === 'lite') {
    return buildLiteSystemPrompt(config);
  }
  return buildSystemPrompt(config);
}

/**
 * 通常の応答生成（Prompt Caching対応）
 */
export async function generateResponse(
  config: StoreConfig,
  conversationHistory: ConversationMessage[],
  userMessage: string,
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const messages = [
    ...conversationHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  const systemPrompt = getSystemPrompt(config);

  const response = await getAnthropicClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: config.plan === 'lite' ? 150 : 200,
    temperature: 0.5,
    // Prompt Caching: システムプロンプトをキャッシュ（同一通話内の複数ターンで再利用）
    system: [
      {
        type: 'text' as const,
        text: systemPrompt,
        cache_control: { type: 'ephemeral' as const },
      },
    ],
    messages,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}

/**
 * ストリーミング応答生成（Prompt Caching対応）
 */
export async function* streamResponse(
  config: StoreConfig,
  conversationHistory: ConversationMessage[],
  userMessage: string,
): AsyncGenerator<string> {
  const messages = [
    ...conversationHistory.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  const systemPrompt = getSystemPrompt(config);

  const stream = getAnthropicClient().messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: config.plan === 'lite' ? 150 : 200,
    temperature: 0.5,
    system: [
      {
        type: 'text' as const,
        text: systemPrompt,
        cache_control: { type: 'ephemeral' as const },
      },
    ],
    messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}

/**
 * 通話要約の生成（プラン別モデル選択）
 */
export async function summarizeCall(
  conversationHistory: ConversationMessage[],
  plan: PlanType = 'standard',
): Promise<{ summary: string; category: string; urgency: string; callerName?: string | null; callbackNeeded?: boolean; keyDetails?: string | null }> {
  const transcript = conversationHistory
    .map(m => `${m.role === 'user' ? '顧客' : 'AI'}: ${m.content}`)
    .join('\n');

  // Lite: Haiku（コスト削減）、Standard: Sonnet（高精度）
  const summaryModel = plan === 'lite' ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-20250514';

  const response = await getAnthropicClient().messages.create({
    model: summaryModel,
    max_tokens: 300,
    temperature: 0.3,
    system: `通話内容を分析し、以下のJSON形式のみを出力してください。JSON以外のテキストは一切出力しないでください。

{
  "summary": "通話内容の要約（2-3文）",
  "category": "RESERVATION か INQUIRY か CHANGE か COMPLAINT か ESCALATION か OTHER のいずれか",
  "urgency": "high か medium か low のいずれか",
  "caller_name": "判明した場合の名前をカタカナで記載。不明ならnull",
  "callback_needed": true または false,
  "key_details": "予約日時・人数・電話番号・席タイプ・コース名・アレルギーなど重要な情報をまとめる"
}

分類ルール:
- RESERVATION: 予約・予約確認
- INQUIRY: 一般的な問い合わせ・質問
- CHANGE: 予約変更・キャンセル
- COMPLAINT: クレーム・苦情
- ESCALATION: 人間のスタッフとの対話を要求した場合
- OTHER: 上記に当てはまらない場合

callback_neededをtrueにすべき場合:
- お客様が「折り返し電話が欲しい」と言った場合
- お客様が人間のスタッフとの対話を要求した場合
- クレーム・苦情の場合
- AIでは回答できない複雑な質問の場合

重要: caller_nameは必ずカタカナで記載してください（例: イノリョウ、タナカタロウ）。`,
    messages: [
      { role: 'user', content: transcript },
    ],
  });

  let text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  console.log('Summary raw text:', text);

  try {
    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary || '要約を生成できませんでした',
      category: parsed.category || 'OTHER',
      urgency: parsed.urgency || 'medium',
      callerName: parsed.caller_name || null,
      callbackNeeded: parsed.callback_needed || false,
      keyDetails: parsed.key_details || null,
    };
  } catch (e) {
    console.error('JSON parse error:', e, 'Text was:', text);
    return {
      summary: text.slice(0, 200) || '要約を生成できませんでした',
      category: 'OTHER',
      urgency: 'medium',
      callerName: null,
      callbackNeeded: false,
      keyDetails: null,
    };
  }
}
