'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Clock, User, Tag, AlertTriangle, MessageSquare, Save } from 'lucide-react';
import { formatPhone, formatDuration } from '@/lib/utils';

interface Call {
  id: string;
  call_sid: string;
  from_number: string;
  to_number: string;
  category: string;
  urgency: string;
  summary: string | null;
  caller_name: string | null;
  key_details: string | null;
  staff_status: string;
  staff_notes: string | null;
  callback_needed: boolean;
  started_at: string;
  ended_at: string | null;
  duration: number;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  RESERVATION: '予約', INQUIRY: '問合せ', CHANGE: '変更',
  COMPLAINT: 'クレーム', OTHER: 'その他',
};

const statusOptions = [
  { value: 'unread', label: '未読', color: 'bg-slate-100 text-slate-600' },
  { value: 'read', label: '確認済', color: 'bg-blue-100 text-blue-700' },
  { value: 'in-progress', label: '対応中', color: 'bg-amber-100 text-amber-700' },
  { value: 'done', label: '完了', color: 'bg-emerald-100 text-emerald-700' },
];

export default function CallDetailPage() {
  const params = useParams();
  const [call, setCall] = useState<Call | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('unread');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch call details from Supabase via API
    fetch(`/api/calls/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.call) {
          setCall(data.call);
          setNotes(data.call.staff_notes || '');
          setStatus(data.call.staff_status);
        }
        if (data.messages) setMessages(data.messages);
      })
      .catch(console.error);
  }, [params.id]);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/calls', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: params.id, staff_status: status, staff_notes: notes }),
    });
    setSaving(false);
  };

  if (!call) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400 mt-3">読み込み中...</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/calls" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> 通話ログに戻る
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Call Info */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-indigo-500" /> 通話情報
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg">
                    {call.caller_name || '名前不明'}
                  </p>
                  <p className="text-sm text-slate-500">{formatPhone(call.from_number)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs">カテゴリ</p>
                  <p className="font-medium text-slate-700 mt-0.5">
                    <Tag className="w-3.5 h-3.5 inline mr-1" />
                    {categoryLabels[call.category] || call.category}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs">重要度</p>
                  <p className="font-medium text-slate-700 mt-0.5 capitalize">{call.urgency}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs">通話時間</p>
                  <p className="font-medium text-slate-700 mt-0.5">
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    {formatDuration(call.duration)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs">要折返し</p>
                  <p className={`font-medium mt-0.5 ${call.callback_needed ? 'text-red-600' : 'text-slate-400'}`}>
                    {call.callback_needed ? 'はい' : 'いいえ'}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                {new Date(call.started_at).toLocaleString('ja-JP')}
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" /> AI要約
              </h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-700 leading-relaxed">
                {call.summary || '要約はまだ生成されていません'}
              </p>
              {call.key_details && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> 重要情報
                  </p>
                  <p className="text-sm text-amber-800 mt-1">{call.key_details}</p>
                </div>
              )}
            </div>
          </div>

          {/* Staff Actions */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900">対応ステータス</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                {statusOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition ${
                      status === opt.value
                        ? opt.color + ' border-current'
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <textarea
                className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                placeholder="対応メモを入力..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Transcript */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-900">通話全文</h3>
            </div>
            <div className="p-5">
              {messages.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  通話の文字起こしはまだありません
                </p>
              ) : (
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-indigo-600 text-white'
                      }`}>
                        <p className={`text-xs font-medium mb-1 ${msg.role === 'user' ? 'text-slate-400' : 'text-indigo-200'}`}>
                          {msg.role === 'user' ? '顧客' : 'AI'}
                        </p>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
