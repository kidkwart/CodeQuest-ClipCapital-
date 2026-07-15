
-- Function to automate Susu Pot updates
CREATE OR REPLACE FUNCTION public.handle_susu_contribution_automation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- If status changes to 'confirmed' (manual) or 'paid' (real-time Paystack)
  IF (TG_OP = 'INSERT' AND (NEW.status = 'confirmed' OR NEW.status = 'paid')) OR
     (TG_OP = 'UPDATE' AND (OLD.status NOT IN ('confirmed', 'paid')) AND (NEW.status IN ('confirmed', 'paid'))) THEN

    -- 1. Add to the group pot
    UPDATE public.susu_groups
    SET
      pot = pot + NEW.amount
    WHERE id = NEW.group_id;

    -- 2. Recalculate ClipScore (Reward for consistent saving)
    PERFORM public.calculate_clip_score(NEW.user_id);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_susu_contribution_confirmed
  AFTER INSERT OR UPDATE OF status ON public.susu_contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_susu_contribution_automation();
