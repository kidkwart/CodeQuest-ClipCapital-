-- SAVINGS GOALS
CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'Equipment',
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.savings_goals TO authenticated;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own savings" ON public.savings_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DIGITAL INVOICES / RECEIPTS
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own invoices" ON public.invoices FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own invoice items" ON public.invoice_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_id AND user_id = auth.uid()));

-- RPC TO DEPOSIT INTO VAULT (Savings)
CREATE OR REPLACE FUNCTION public.deposit_to_vault(goal_id UUID, amount NUMERIC)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- 1. Deduct from wallet
  UPDATE public.profiles
  SET wallet_balance = wallet_balance - amount
  WHERE id = auth.uid() AND wallet_balance >= amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- 2. Add to savings goal
  UPDATE public.savings_goals
  SET current_amount = current_amount + amount
  WHERE id = goal_id AND user_id = auth.uid();
END;
$$;
