/**
 * 誤応答レポートAPI
 * 店舗オーナーが「この応答は間違い」と報告 → 学習データとして蓄積
 *
 * POST: 誤応答を報告
 * GET: レポート一覧取得
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { call_id, message_id, ai_response, expected_response, category, notes } = body;

  if (!call_id || !ai_response) {
    return NextResponse.json({ error: 'call_id and ai_response are required' }, { status: 400 });
  }

  // feedback テーブルに保存（テーブルがなければcall_messagesに注記として保存）
  try {
    // まずfeedbackテーブルを試す
    const { error } = await supabase.from('feedback_reports').insert({
      call_id,
      message_id: message_id || null,
      ai_response,
      expected_response: expected_response || '',
      category: category || 'wrong_response',  // wrong_response, wrong_tone, missing_info, other
      notes: notes || '',
      status: 'new',  // new, reviewed, applied
    });

    if (error) {
      // テーブルがなければcallのstaff_notesに追記
      const { data: call } = await supabase
        .from('calls')
        .select('staff_notes')
        .eq('id', call_id)
        .single();

      const existingNotes = call?.staff_notes || '';
      const feedbackNote = `\n[誤応答報告 ${new Date().toISOString().slice(0, 16)}]\nAI応答: ${ai_response}\n期待: ${expected_response || '未入力'}\nカテゴリ: ${category || 'wrong_response'}\n${notes ? 'メモ: ' + notes : ''}`;

      await supabase.from('calls').update({
        staff_notes: existingNotes + feedbackNote,
      }).eq('id', call_id);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ reports: [] });
  }

  // feedback_reportsテーブルから取得を試みる
  const { data, error } = await supabase
    .from('feedback_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    // テーブルがない場合、staff_notesから誤応答報告を抽出
    const { data: calls } = await supabase
      .from('calls')
      .select('id, caller_name, from_number, staff_notes, started_at')
      .not('staff_notes', 'is', null)
      .order('started_at', { ascending: false })
      .limit(50);

    const reports = (calls || [])
      .filter(c => c.staff_notes && c.staff_notes.includes('[誤応答報告'))
      .map(c => ({
        call_id: c.id,
        caller: c.caller_name || c.from_number,
        notes: c.staff_notes,
        date: c.started_at,
      }));

    return NextResponse.json({ reports });
  }

  return NextResponse.json({ reports: data || [] });
}
