
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  business_name TEXT NOT NULL DEFAULT '',
  clip_score INT NOT NULL DEFAULT 650,
  loan_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile + read display_name/business_name from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, business_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'business_name', '')
  );
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- INCOME
CREATE TABLE public.income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  note TEXT NOT NULL DEFAULT '',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.income_entries TO authenticated;
GRANT ALL ON public.income_entries TO service_role;
ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own income" ON public.income_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON public.income_entries (user_id, entry_date DESC);

-- EXPENSES
CREATE TABLE public.expense_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL DEFAULT 'Other',
  note TEXT NOT NULL DEFAULT '',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_entries TO authenticated;
GRANT ALL ON public.expense_entries TO service_role;
ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own expenses" ON public.expense_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ON public.expense_entries (user_id, entry_date DESC);

-- SUSU GROUPS (publicly viewable)
CREATE TABLE public.susu_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  members_count INT NOT NULL DEFAULT 0,
  contribution NUMERIC NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('Daily','Weekly')),
  pot NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.susu_groups TO anon, authenticated;
GRANT ALL ON public.susu_groups TO service_role;
ALTER TABLE public.susu_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "susu public read" ON public.susu_groups FOR SELECT TO anon, authenticated USING (true);

-- SUSU MEMBERSHIPS
CREATE TABLE public.susu_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.susu_groups(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, group_id)
);
GRANT SELECT, INSERT, DELETE ON public.susu_memberships TO authenticated;
GRANT ALL ON public.susu_memberships TO service_role;
ALTER TABLE public.susu_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memberships" ON public.susu_memberships FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CART
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  price NUMERIC NOT NULL,
  qty INT NOT NULL DEFAULT 1 CHECK (qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cart" ON public.cart_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed shared susu groups
INSERT INTO public.susu_groups (name, members_count, contribution, frequency, pot) VALUES
  ('Madina Barbers Circle', 12, 20, 'Daily', 3200),
  ('Tema Stylists Susu', 8, 50, 'Weekly', 1800),
  ('Kaneshie Cut Crew', 15, 10, 'Daily', 4500);
