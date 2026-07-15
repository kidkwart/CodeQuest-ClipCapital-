-- 1. Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id),
  referee_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, joined
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Revenue Goals Table
CREATE TABLE IF NOT EXISTS public.revenue_goals (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_target NUMERIC DEFAULT 1000,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Update ClipScore Function to include Referrals
CREATE OR REPLACE FUNCTION public.calculate_clip_score(_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _base_score int := 100;
  _income_count int;
  _closed_loans_count int;
  _susu_contrib_count int;
  _referral_count int;
  _new_score int;
BEGIN
  SELECT count(*) INTO _income_count FROM public.income_entries WHERE user_id = _user_id;
  SELECT count(*) INTO _closed_loans_count FROM public.loan_applications WHERE user_id = _user_id AND status = 'closed';
  SELECT count(*) INTO _susu_contrib_count FROM public.susu_contributions WHERE user_id = _user_id AND status = 'confirmed';
  SELECT count(*) INTO _referral_count FROM public.referrals WHERE referrer_id = _user_id AND status = 'joined';

  _new_score := _base_score
    + (COALESCE(_income_count, 0) * 10)
    + (COALESCE(_closed_loans_count, 0) * 100)
    + (COALESCE(_susu_contrib_count, 0) * 15)
    + (COALESCE(_referral_count, 0) * 50); -- +50 per referral

  IF _new_score > 900 THEN _new_score := 900; END IF;

  UPDATE public.profiles SET clip_score = _new_score, updated_at = now() WHERE id = _user_id;
  RETURN _new_score;
END;
$$;

-- RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);

ALTER TABLE public.revenue_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON public.revenue_goals FOR ALL USING (auth.uid() = user_id);

GRANT ALL ON public.referrals TO authenticated;
GRANT ALL ON public.revenue_goals TO authenticated;
