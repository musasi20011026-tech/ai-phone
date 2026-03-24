'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Users, Clock, Phone, MapPin, UtensilsCrossed, AlertTriangle, Check, X, Ban } from 'lucide-react';

interface Reservation {
  id: string;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  seat_type: string;
  course_type: string;
  course_name: string | null;
  allergies: string | null;
  special_requests: string | null;
  status: string;
  language: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: '確定', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  cancelled: { label: 'キャンセル', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  completed: { label: '来店済', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  no_show: { label: '無断キャンセル', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-300' },
};

const seatTypeLabels: Record<string, string> = {
  counter: 'カウンター',
  table: 'テーブル',
  private: '個室',
  any: '指定なし',
};

const langLabels: Record<string, string> = {
  ja: '日本語',
  en: '英語',
  zh: '中国語',
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchReservations = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    if (dateFilter) params.set('date', dateFilter);

    fetch(`/api/reservations?${params}`)
      .then(res => res.ok ? res.json() : { reservations: [] })
      .then(data => { setReservations(data.reservations || []); setLoading(false); })
      .catch(() => { setReservations([]); setLoading(false); });
  };

  useEffect(() => {
    fetchReservations();
  }, [filter, dateFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
    await fetch('/api/reservations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });
    fetchReservations();
    } catch (e) {
      console.error('Status update failed:', e);
    }
  };

  // JST (UTC+9) でtodayを計算
  const nowDate = new Date();
  const jstMs = nowDate.getTime() + 9 * 60 * 60 * 1000;
  const today = new Date(jstMs).toISOString().split('T')[0];
  const todayReservations = reservations.filter(r => r.reservation_date === today && r.status === 'confirmed');
  const upcomingReservations = reservations.filter(r => r.reservation_date > today && r.status === 'confirmed');
  const totalGuests = todayReservations.reduce((sum, r) => sum + r.party_size, 0);

  const selected = selectedId ? reservations.find(r => r.id === selectedId) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">予約管理</h2>
          <p className="text-sm text-slate-500 mt-1">AI電話で受け付けた予約を管理</p>
        </div>
        <p className="text-sm text-slate-400">
          {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { icon: CalendarDays, label: '本日の予約', value: todayReservations.length, color: 'text-indigo-600', iconBg: 'bg-indigo-50' },
          { icon: Users, label: '本日の来客数', value: `${totalGuests}名`, color: 'text-emerald-600', iconBg: 'bg-emerald-50' },
          { icon: Clock, label: '今後の予約', value: upcomingReservations.length, color: 'text-amber-600', iconBg: 'bg-amber-50' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5">
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

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-2">
          {[
            { key: 'all', label: '全て' },
            { key: 'confirmed', label: '確定' },
            { key: 'cancelled', label: 'キャンセル' },
            { key: 'completed', label: '来店済' },
            { key: 'no_show', label: '無断キャンセル' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                filter === f.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700"
        />
        {dateFilter && (
          <button onClick={() => setDateFilter('')} className="text-xs text-slate-400 hover:text-slate-600">
            日付クリア
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-400 mt-3">読み込み中...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarDays className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">予約がありません</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reservations.map(r => {
                const st = statusConfig[r.status] || statusConfig.confirmed;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition ${
                      selectedId === r.id ? 'bg-indigo-50/50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900">{r.customer_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${st.bg} ${st.color}`}>
                          {st.label}
                        </span>
                        {r.language !== 'ja' && (
                          <span className="text-xs px-2 py-0.5 rounded-full border bg-purple-50 border-purple-200 text-purple-600">
                            {langLabels[r.language] || r.language}
                          </span>
                        )}
                        {r.allergies && (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {r.reservation_date} {r.reservation_time} / {r.party_size}名 / {seatTypeLabels[r.seat_type] || r.seat_type}
                        {r.course_name && ` / ${r.course_name}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-96 bg-white rounded-xl border border-slate-200 p-6 sticky top-24 h-fit">
            <h3 className="text-lg font-bold text-slate-900 mb-4">{selected.customer_name}様</h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-slate-600">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <span>{selected.reservation_date} {selected.reservation_time}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{selected.party_size}名様</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{selected.customer_phone}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{seatTypeLabels[selected.seat_type] || '指定なし'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <UtensilsCrossed className="w-4 h-4 text-slate-400" />
                <span>
                  {selected.course_type === 'course' ? selected.course_name || 'コース' : '単品'}
                </span>
              </div>

              {selected.allergies && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-700 font-medium mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    アレルギー
                  </div>
                  <p className="text-amber-600 text-sm">{selected.allergies}</p>
                </div>
              )}

              {selected.special_requests && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-slate-500 text-xs font-medium mb-1">特記事項</p>
                  <p className="text-slate-700 text-sm">{selected.special_requests}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            {selected.status === 'confirmed' && (
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => updateStatus(selected.id, 'completed')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition"
                >
                  <Check className="w-4 h-4" /> 来店済
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'cancelled')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-red-600 text-sm rounded-lg border border-red-200 hover:bg-red-50 transition"
                >
                  <X className="w-4 h-4" /> キャンセル
                </button>
                <button
                  onClick={() => updateStatus(selected.id, 'no_show')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-slate-600 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                  title="無断キャンセル"
                >
                  <Ban className="w-4 h-4" />
                </button>
              </div>
            )}

            {selected.status !== 'confirmed' && (
              <div className="mt-6">
                <button
                  onClick={() => updateStatus(selected.id, 'confirmed')}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                >
                  確定に戻す
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
