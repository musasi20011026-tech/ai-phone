'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Phone, PhoneIncoming, PhoneMissed, Clock, ArrowRight, User, AlertCircle, CalendarDays } from 'lucide-react';
import { formatPhone, formatDuration, timeAgo } from '@/lib/utils';

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

const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  RESERVATION: { label: '予約', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  INQUIRY: { label: '問合せ', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  CHANGE: { label: '変更', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  COMPLAINT: { label: 'クレーム', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  OTHER: { label: 'その他', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
};

const urgencyDot: Record<string, string> = {
  high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-emerald-400',
};

interface Reservation {
  id: string;
  customer_name: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
}

export default function DashboardPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/calls?limit=30').then(res => res.ok ? res.json() : { calls: [] }).catch(() => ({ calls: [] })),
      fetch('/api/reservations?status=confirmed&limit=10').then(res => res.ok ? res.json() : { reservations: [] }).catch(() => ({ reservations: [] })),
    ]).then(([callData, resData]) => {
      setCalls(callData.calls || []);
      setReservations(resData.reservations || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // JST (UTC+9) でtodayを計算
  const now = new Date();
  const jstOffset = now.getTime() + 9 * 60 * 60 * 1000;
  const today = new Date(jstOffset).toISOString().split('T')[0];
  const todayCalls = calls.filter(c => c.started_at.startsWith(today));
  const unread = calls.filter(c => c.staff_status === 'unread');
  const needCallback = calls.filter(c => c.callback_needed && c.staff_status !== 'done');
  const totalDuration = calls.reduce((sum, c) => sum + (c.duration || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">ダッシュボード</h2>
          <p className="text-sm text-slate-500 mt-1">AI電話の着信状況をリアルタイムで確認</p>
        </div>
        <p className="text-sm text-slate-400">{new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-8">
        {[
          { icon: PhoneIncoming, label: '今日の着信', value: todayCalls.length, color: 'text-indigo-600', iconBg: 'bg-indigo-50' },
          { icon: CalendarDays, label: '今後の予約', value: reservations.length, color: 'text-emerald-600', iconBg: 'bg-emerald-50' },
          { icon: AlertCircle, label: '未読', value: unread.length, color: unread.length > 0 ? 'text-red-600' : 'text-slate-400', iconBg: unread.length > 0 ? 'bg-red-50' : 'bg-slate-50' },
          { icon: PhoneMissed, label: '要折返し', value: needCallback.length, color: needCallback.length > 0 ? 'text-amber-600' : 'text-slate-400', iconBg: needCallback.length > 0 ? 'bg-amber-50' : 'bg-slate-50' },
          { icon: Clock, label: '総通話時間', value: formatDuration(totalDuration), color: 'text-slate-700', iconBg: 'bg-slate-50' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Upcoming Reservations */}
      {reservations.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">直近の予約</h3>
            <Link href="/reservations" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              全て見る <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {reservations.slice(0, 5).map(r => (
              <Link
                key={r.id}
                href="/reservations"
                className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50/50 transition"
              >
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-slate-900">{r.customer_name}様</span>
                  <span className="text-sm text-slate-400 ml-2">{r.party_size}名</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-700">{r.reservation_date}</p>
                  <p className="text-xs text-slate-400">{r.reservation_time}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Calls */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">最近の着信</h3>
          <Link href="/calls" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            全て見る <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400 mt-3">読み込み中...</p>
          </div>
        ) : calls.length === 0 ? (
          <div className="p-12 text-center">
            <Phone className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400">まだ着信がありません</p>
            <p className="text-sm text-slate-300 mt-1">電話がかかってくると、ここに表示されます</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {calls.slice(0, 8).map(call => {
              const cat = categoryConfig[call.category] || categoryConfig.OTHER;
              return (
                <Link
                  key={call.id}
                  href={`/calls/${call.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition group"
                >
                  {/* Urgency + Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${urgencyDot[call.urgency] || 'bg-slate-300'}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900 truncate">
                        {call.caller_name || formatPhone(call.from_number)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>
                        {cat.label}
                      </span>
                      {call.callback_needed && (
                        <span className="text-xs px-2 py-0.5 rounded-full border bg-red-50 border-red-200 text-red-600">
                          要折返し
                        </span>
                      )}
                      {call.staff_status === 'unread' && (
                        <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 truncate">
                      {call.summary || '要約生成中...'}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400">{timeAgo(call.started_at)}</p>
                    <p className="text-xs text-slate-300 mt-1">{formatDuration(call.duration)}</p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
