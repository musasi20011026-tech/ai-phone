-- AI Phone System - Initial Schema
-- 株式会社Centaurus

-- ユーザープロフィール
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 店舗設定
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT,
  address TEXT,
  business_hours TEXT NOT NULL DEFAULT '11:00-22:00',
  closed_days TEXT NOT NULL DEFAULT '月曜日',
  seat_count INTEGER,
  tone TEXT NOT NULL DEFAULT 'polite',
  greeting TEXT NOT NULL DEFAULT 'お電話ありがとうございます。',
  fallback_message TEXT NOT NULL DEFAULT '確認して折り返しお電話いたします。お名前とお電話番号をお願いいたします。',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FAQ
CREATE TABLE public.store_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- メニュー/サービス
CREATE TABLE public.store_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 通話ログ
CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  call_sid TEXT UNIQUE NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'inbound',
  status TEXT NOT NULL DEFAULT 'in-progress',
  duration INTEGER DEFAULT 0,
  category TEXT DEFAULT 'OTHER',
  urgency TEXT DEFAULT 'medium',
  summary TEXT,
  caller_name TEXT,
  callback_needed BOOLEAN DEFAULT false,
  key_details TEXT,
  staff_status TEXT NOT NULL DEFAULT 'unread',
  staff_notes TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- 通話メッセージ（文字起こし）
CREATE TABLE public.call_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックス
CREATE INDEX idx_calls_store_id ON public.calls(store_id);
CREATE INDEX idx_calls_started_at ON public.calls(started_at DESC);
CREATE INDEX idx_calls_store_started ON public.calls(store_id, started_at DESC);
CREATE INDEX idx_calls_staff_status ON public.calls(staff_status);
CREATE INDEX idx_call_messages_call_id ON public.call_messages(call_id);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own stores" ON public.stores FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own store faqs" ON public.store_faqs FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own store menu" ON public.store_menu_items FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own calls" ON public.calls FOR ALL
  USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can view own call messages" ON public.call_messages FOR ALL
  USING (call_id IN (SELECT id FROM public.calls WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));

-- Service role bypass policies（Webhook経由の書き込み用）
CREATE POLICY "Service role can manage all calls" ON public.calls FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage all call messages" ON public.call_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);
