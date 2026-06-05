-- Trigger to automatically reduce loan balance when a repayment is confirmed
CREATE OR REPLACE FUNCTION public.handle_loan_repayment_confirmation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only subtract if status changed from something else to 'confirmed'
  IF (NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed')) THEN
    UPDATE public.loan_applications
    SET
      balance = balance - NEW.amount,
      updated_at = now()
    WHERE id = NEW.loan_id;

    -- If balance is now <= 0, mark loan as closed
    UPDATE public.loan_applications
    SET status = 'closed'
    WHERE id = NEW.loan_id AND balance <= 0;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_loan_repayment_confirmed ON public.loan_repayments;
CREATE TRIGGER on_loan_repayment_confirmed
  AFTER UPDATE OF status ON public.loan_repayments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_loan_repayment_confirmation();

-- Add a column to see the full repayment history for admin
ALTER TABLE public.loan_repayments ADD COLUMN IF NOT EXISTS admin_notes TEXT;
