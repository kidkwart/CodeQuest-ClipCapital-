-- Function to calculate and update ClipScore for a user
CREATE OR REPLACE FUNCTION public.calculate_clip_score(_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _base_score int := 600;
  _income_count int;
  _closed_loans_count int;
  _susu_contrib_count int;
  _new_score int;
BEGIN
  -- Count income entries (reward logging consistency)
  SELECT count(*) INTO _income_count FROM public.income_entries WHERE user_id = _user_id;

  -- Count closed loans (reward repayment)
  SELECT count(*) INTO _closed_loans_count FROM public.loan_applications
  WHERE user_id = _user_id AND status = 'closed';

  -- Count successful susu contributions
  SELECT count(*) INTO _susu_contrib_count FROM public.susu_contributions
  WHERE user_id = _user_id AND status = 'paid';

  -- Calculate score
  _new_score := _base_score
    + (COALESCE(_income_count, 0) * 5)
    + (COALESCE(_closed_loans_count, 0) * 30)
    + (COALESCE(_susu_contrib_count, 0) * 2);

  -- Cap at 850
  IF _new_score > 850 THEN
    _new_score := 850;
  END IF;

  -- Update profile
  UPDATE public.profiles
  SET clip_score = _new_score, updated_at = now()
  WHERE id = _user_id;

  RETURN _new_score;
END;
$$;

-- Triggers to auto-update score
CREATE OR REPLACE FUNCTION public.trigger_recalculate_clip_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- NEW.user_id works for income_entries, loan_applications, susu_contributions
  -- For some tables we might need to handle OLD as well if user_id changes (unlikely here)
  PERFORM public.calculate_clip_score(NEW.user_id);
  RETURN NEW;
END;
$$;

-- 1. On Income Entry
CREATE TRIGGER on_income_entry_score
  AFTER INSERT OR DELETE ON public.income_entries
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_clip_score();

-- 2. On Loan Status Change (e.g. to 'closed')
CREATE TRIGGER on_loan_status_change_score
  AFTER UPDATE OF status ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_clip_score();

-- 3. On Susu Contribution
CREATE TRIGGER on_susu_contribution_score
  AFTER UPDATE OF status ON public.susu_contributions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_clip_score();
