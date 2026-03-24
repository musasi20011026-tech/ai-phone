/**
 * Twilio Voice Webhook - 着信時に呼ばれるエンドポイント
 * 多言語対応: 日本語で挨拶後、英語・中国語にも対応可能
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const from = formData.get('From') as string;
  const to = formData.get('To') as string;
  const callSid = formData.get('CallSid') as string;

  console.log(`Incoming call: ${from} -> ${to} (CallSid: ${callSid})`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // 最初の挨拶は日本語。お客様の返答言語に応じてstream routeが自動切替
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ja-JP" voice="Polly.Mizuki">
    お電話ありがとうございます。和食処さくらでございます。ご予約やお問い合わせなど、ご用件をお話しください。
  </Say>
  <Gather input="speech"
         language="ja-JP"
         speechTimeout="3"
         timeout="8"
         action="${appUrl}/api/twilio/stream"
         method="POST">
  </Gather>
  <Say language="ja-JP" voice="Polly.Mizuki">
    お声が聞き取れませんでした。もう一度お話しいただけますか。
  </Say>
  <Redirect>${appUrl}/api/twilio/voice</Redirect>
</Response>`;

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
