-- Improve the trigger to handle both INSERT and UPDATE for automatic balance deduction
CREATE OR REPLACE FUNCTION public.handle_loan_repayment_automation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- If status is 'confirmed' (from Paystack)
  IF (NEW.status = 'confirmed') THEN
    -- 1. Deduct from the loan balance
    UPDATE public.loan_applications
    SET
      balance = balance - NEW.amount,
      updated_at = now()
    WHERE id = NEW.loan_id;

    -- 2. If balance reaches zero, close the loan
    UPDATE public.loan_applications
    SET status = 'closed'
    WHERE id = NEW.loan_id AND balance <= 0;

    -- 3. Recalculate ClipScore (Reward for repayment)
    PERFORM public.calculate_clip_score(NEW.user_id);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_loan_repayment_automation ON public.loan_repayments;
CREATE TRIGGER on_loan_repayment_automation
  AFTER INSERT OR UPDATE OF status ON public.loan_repayments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_loan_repayment_automation();
