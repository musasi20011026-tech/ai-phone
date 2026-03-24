-- AI Phone - プラン分岐・共有番号・LINE通知対応
-- 株式会社Centaurus

-- stores テーブルにプラン・LINE設定を追加
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'lite';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS dedicated_phone TEXT;           -- Standard用: 専用050番号
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS forwarding_number TEXT;          -- Lite用: 店舗の既存番号（転送元）
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS line_channel_token TEXT;         -- LINE Messaging API トークン
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS line_user_id TEXT;               -- 店舗オーナーのLINE User ID
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS monthly_call_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS call_count_reset_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 共有番号 → 店舗マッピングテーブル
-- 着信時にFrom番号で店舗を特定するためのルーティングテーブル
CREATE TABLE IF NOT EXISTS public.phone_routing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_number TEXT NOT NULL,          -- お客様の電話番号（転送元の店舗番号）
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_number)
);

CREATE INDEX IF NOT EXISTS idx_phone_routing_from ON public.phone_routing(from_number);

ALTER TABLE public.phone_routing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own routing" ON public.phone_routing FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "Service role can manage all routing" ON public.phone_routing FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- LINE通知ログ
CREATE TABLE IF NOT EXISTS public.line_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  type TEXT NOT NULL,              -- 'reservation_confirm', 'reminder_day_before', 'reminder_same_day', 'owner_notify'
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_line_notifications_store ON public.line_notifications(store_id);
ALTER TABLE public.line_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.line_notifications FOR SELECT
  USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "Service role can manage notifications" ON public.line_notifications FOR ALL TO service_role
  USING (true) WITH CHECK (true);
