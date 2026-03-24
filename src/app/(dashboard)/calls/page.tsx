'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Call {
  id: string;
  from_number: string;
  category: string;
  urgency: string;
  summary: string | null;
  caller_name: string | null;
  staff_status: string;
  callback_needed: boolean;
  started_at: string;
  duration: number;
}

const categoryLabels: Record<string, string> = {
  RESERVATION: '予約', INQUIRY: '問合せ', CHANGE: '変更',
  COMPLAINT: 'クレーム', OTHER: 'その他',
};
const categoryColors: Record<string, string> = {
  RESERVATION: 'bg-blue-100 text-blue-700', INQUIRY: 'bg-green-100 text-green-700',
  CHANGE: 'bg-yellow-100 text-yellow-700', COMPLAINT: 'bg-red-100 text-red-700',
  OTHER: 'bg-slate-100 text-slate-700',
};
const urgencyColors: Record<string, string> = {
  high: 'bg-red-500', medium: 'bg-yellow-500', low: 'bg-green-500',
};

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = filter !== 'all' ? `?status=${filter}` : '';
    fetch(`/api/calls${params}`)
      .then(res => res.json())
      .then(data => { setCalls(data.calls || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">通話ログ</h2>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: '全て' },
          { key: 'unread', label: '未読' },
          { key: 'in-progress', label: '対応中' },
          { key: 'done', label: '完了' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Call List */}
      <div className="bg-white rounded-xl border border-slate-200">
        {loading ? (
          <div className="p-8 text-center text-slate-400">読み込み中...</div>
        ) : calls.length === 0 ? (
          <div className="p-8 text-center text-slate-400">該当する通話がありません</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {calls.map(call => (
              <Link
                key={call.id}
                href={`/calls/${call.id}`}
                className="block px-6 py-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${urgencyColors[call.urgency] || 'bg-slate-300'}`} />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">
                          {call.caller_name || call.from_number}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[call.category] || ''}`}>
                          {categoryLabels[call.category] || call.category}
                        </span>
                        {call.callback_needed && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">要折返し</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{call.summary || '要約なし'}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xs text-slate-400">
                      {new Date(call.started_at).toLocaleString('ja-JP', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{call.duration}秒</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
