ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;

DROP POLICY IF EXISTS "buyer or vendor updates order" ON public.orders;
CREATE POLICY "buyer or vendor updates order" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    (auth.uid() = buyer_id)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = orders.id AND oi.vendor_id = auth.uid())
  )
  WITH CHECK (
    (auth.uid() = buyer_id)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = orders.id AND oi.vendor_id = auth.uid())
  );

DROP POLICY IF EXISTS "borrower creates own repayment" ON public.loan_repayments;
CREATE POLICY "borrower creates own repayment" ON public.loan_repayments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.loan_applications la
      WHERE la.id = loan_id AND la.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "own memberships" ON public.susu_memberships;

CREATE POLICY "members read own memberships" ON public.susu_memberships
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.susu_groups g WHERE g.id = group_id AND g.owner_id = auth.uid())
  );

CREATE POLICY "members delete own membership" ON public.susu_memberships
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.susu_groups g WHERE g.id = group_id AND g.owner_id = auth.uid())
  );

CREATE POLICY "owner self-inserts membership" ON public.susu_memberships
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.susu_groups g WHERE g.id = group_id AND g.owner_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.join_susu_by_invite(_invite text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g RECORD;
  new_order int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id, members_count INTO g
  FROM public.susu_groups
  WHERE invite_code = trim(_invite);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  IF EXISTS (SELECT 1 FROM public.susu_memberships WHERE group_id = g.id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Already a member';
  END IF;

  new_order := COALESCE(g.members_count, 0) + 1;

  INSERT INTO public.susu_memberships (group_id, user_id, payout_order)
  VALUES (g.id, auth.uid(), new_order);

  UPDATE public.susu_groups SET members_count = new_order WHERE id = g.id;

  RETURN g.id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_susu_by_invite(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_susu_by_invite(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.join_susu_by_invite(text) TO authenticated;

DROP POLICY IF EXISTS "owner records payouts" ON public.susu_payouts;
CREATE POLICY "owner records payouts" ON public.susu_payouts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.susu_groups g WHERE g.id = group_id AND g.owner_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.susu_memberships m
      WHERE m.group_id = susu_payouts.group_id AND m.user_id = susu_payouts.user_id
    )
  );