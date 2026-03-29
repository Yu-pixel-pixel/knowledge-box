-- =====================================================
-- 知識貯金箱 Supabase Schema
-- =====================================================

-- users テーブル
-- auth.users と紐付け（Supabase Auth が自動作成するレコードを参照）
CREATE TABLE IF NOT EXISTS public.users (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text,
  is_premium   boolean NOT NULL DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

-- knowledge_items テーブル
CREATE TABLE IF NOT EXISTS public.knowledge_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question     text NOT NULL,
  summary      text,
  tags         text[],
  category     text,
  created_at   timestamptz DEFAULT now()
);

-- analyses テーブル
CREATE TABLE IF NOT EXISTS public.analyses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trigger_count  int NOT NULL,  -- 5, 20, 50, 100
  result         jsonb NOT NULL,
  created_at     timestamptz DEFAULT now()
);

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses        ENABLE ROW LEVEL SECURITY;

-- users: 自分のレコードのみ
CREATE POLICY "users: own row only"
  ON public.users FOR ALL
  USING (auth.uid() = id);

-- knowledge_items: 自分のレコードのみ
CREATE POLICY "knowledge_items: own rows only"
  ON public.knowledge_items FOR ALL
  USING (auth.uid() = user_id);

-- analyses: 自分のレコードのみ
CREATE POLICY "analyses: own rows only"
  ON public.analyses FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- ユーザー自動作成トリガー
-- Supabase Auth でログインしたとき public.users に自動挿入
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
