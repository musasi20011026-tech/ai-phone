-- AI Phone - 予約管理テーブル
-- 株式会社Centaurus

-- 予約テーブル
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL,

  -- 基本情報
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 1,

  -- 日時
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,

  -- 詳細
  seat_type TEXT NOT NULL DEFAULT 'any',          -- 'counter', 'table', 'private', 'any'
  course_type TEXT NOT NULL DEFAULT 'a_la_carte', -- 'course', 'a_la_carte'
  course_name TEXT,                                -- コース名（選択した場合）
  allergies TEXT,                                  -- アレルギー情報
  special_requests TEXT,                           -- その他要望

  -- ステータス
  status TEXT NOT NULL DEFAULT 'confirmed',        -- 'confirmed', 'cancelled', 'completed', 'no_show'

  -- リマインド
  reminder_day_before_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_same_day_sent BOOLEAN NOT NULL DEFAULT false,

  -- 言語
  language TEXT NOT NULL DEFAULT 'ja',             -- 'ja', 'en', 'zh'

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 店舗の席構成テーブル
CREATE TABLE public.store_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  seat_type TEXT NOT NULL,          -- 'counter', 'table', 'private'
  seat_label TEXT NOT NULL,         -- 'カウンター席', 'テーブル席A' 等
  capacity INTEGER NOT NULL,        -- 最大人数
  count INTEGER NOT NULL DEFAULT 1, -- 同タイプの席数
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- コース情報テーブル
CREATE TABLE public.store_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,           -- 円
  description TEXT,
  recommended_party_size TEXT,      -- '2-4名様向け' 等
  is_recommended BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_reservations_store_id ON public.reservations(store_id);
CREATE INDEX idx_reservations_date ON public.reservations(reservation_date);
CREATE INDEX idx_reservations_status ON public.reservations(status);
CREATE INDEX idx_reservations_reminder ON public.reservations(reservation_date, reminder_day_before_sent, reminder_same_day_sent)
  WHERE status = 'confirmed';
CREATE INDEX idx_store_seats_store_id ON public.store_seats(store_id);
CREATE INDEX idx_store_courses_store_id ON public.store_courses(store_id);

-- RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reservations" ON public.reservations FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own store seats" ON public.store_seats FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own store courses" ON public.store_courses FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));

-- Service role用ポリシー（API経由で予約を作成するため）
CREATE POLICY "Service role can manage all reservations" ON public.reservations FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage all store seats" ON public.store_seats FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage all store courses" ON public.store_courses FOR ALL TO service_role
  USING (true) WITH CHECK (true);
