
-- Ensure cycle_index starts at 1 for existing and new groups
UPDATE public.susu_groups SET cycle_index = 1 WHERE cycle_index = 0;
ALTER TABLE public.susu_groups ALTER COLUMN cycle_index SET DEFAULT 1;

-- Function to handle the automatic rotation and payout
CREATE OR REPLACE FUNCTION public.process_susu_rotation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_members_count INT;
  v_contributions_count INT;
  v_pot_amount NUMERIC;
  v_payout_user_id UUID;
  v_current_cycle INT;
BEGIN
  -- We only care about confirmed/paid contributions
  IF (NEW.status NOT IN ('confirmed', 'paid')) THEN
    RETURN NEW;
  END IF;

  -- 1. Get group details
  SELECT members_count, pot, cycle_index INTO v_members_count, v_pot_amount, v_current_cycle
  FROM public.susu_groups
  WHERE id = NEW.group_id;

  -- 2. Count how many members have paid for THIS specific cycle
  SELECT COUNT(DISTINCT user_id) INTO v_contributions_count
  FROM public.susu_contributions
  WHERE group_id = NEW.group_id
    AND cycle_index = v_current_cycle
    AND status IN ('confirmed', 'paid');

  -- 3. If everyone has contributed, trigger payout
  IF v_contributions_count >= v_members_count THEN

    -- A. Find the winner (whose payout_order matches current cycle)
    SELECT user_id INTO v_payout_user_id
    FROM public.susu_memberships
    WHERE group_id = NEW.group_id AND payout_order = v_current_cycle;

    -- If no exact match (e.g. member left), pick the first available
    IF v_payout_user_id IS NULL THEN
      SELECT user_id INTO v_payout_user_id
      FROM public.susu_memberships
      WHERE group_id = NEW.group_id
      ORDER BY payout_order ASC
      LIMIT 1;
    END IF;

    -- B. Record the payout
    INSERT INTO public.susu_payouts (group_id, user_id, amount, cycle_index, paid_at)
    VALUES (NEW.group_id, v_payout_user_id, v_pot_amount, v_current_cycle, now());

    -- C. Update Winner's Wallet
    UPDATE public.profiles
    SET wallet_balance = wallet_balance + v_pot_amount
    WHERE id = v_payout_user_id;

    -- D. Update Group State for next cycle
    UPDATE public.susu_groups
    SET
      pot = 0,
      cycle_index = CASE
        WHEN cycle_index >= v_members_count THEN 1
        ELSE cycle_index + 1
      END
    WHERE id = NEW.group_id;

    -- E. Notify the winner
    INSERT INTO public.notifications (user_id, title, body, type)
    VALUES (
      v_payout_user_id,
      'Susu Payout Received!',
      'Congratulations! You have received the pot of GH₵ ' || v_pot_amount || ' for this cycle.',
      'success'
    );

  END IF;

  RETURN NEW;
END; $$;

-- Attach the rotation trigger
DROP TRIGGER IF EXISTS on_susu_contribution_rotation ON public.susu_contributions;
CREATE TRIGGER on_susu_contribution_rotation
  AFTER INSERT OR UPDATE OF status ON public.susu_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.process_susu_rotation();
