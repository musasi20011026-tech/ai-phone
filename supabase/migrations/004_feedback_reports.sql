-- 誤応答レポートテーブル
-- 店舗オーナーの「この応答は間違い」報告を蓄積 → 学習データに活用

CREATE TABLE IF NOT EXISTS public.feedback_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.call_messages(id) ON DELETE SET NULL,
  ai_response TEXT NOT NULL,
  expected_response TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'wrong_response',  -- wrong_response, wrong_tone, missing_info, other
  notes TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',                -- new, reviewed, applied
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback_reports(status);
ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage feedback" ON public.feedback_reports FOR ALL TO service_role
  USING (true) WITH CHECK (true);
