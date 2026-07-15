-- Function to handle repayment confirmation
CREATE OR REPLACE FUNCTION public.handle_loan_repayment_confirmation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- When status changes to 'paid' (or similar confirmed status)
  IF (OLD.status = 'pending' AND NEW.status = 'paid') THEN
    -- Deduct from loan balance
    UPDATE public.loan_applications
    SET
      balance = balance - NEW.amount,
      updated_at = now()
    WHERE id = NEW.loan_id;

    -- If balance is 0 or less, close the loan
    UPDATE public.loan_applications
    SET
      status = 'closed',
      updated_at = now()
    WHERE id = NEW.loan_id AND balance <= 0;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_repayment_paid
  AFTER UPDATE OF status ON public.loan_repayments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_loan_repayment_confirmation();
