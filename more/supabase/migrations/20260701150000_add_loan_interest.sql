-- Add interest fields to loan applications
ALTER TABLE public.loan_applications
  ADD COLUMN IF NOT EXISTS interest_rate NUMERIC NOT NULL DEFAULT 5.0, -- Default 5% monthly or flat
  ADD COLUMN IF NOT EXISTS total_payable NUMERIC NOT NULL DEFAULT 0;

-- Update existing loans to have total_payable = amount if they don't have it
UPDATE public.loan_applications SET total_payable = amount WHERE total_payable = 0;

-- Function to calculate total payable on approval
CREATE OR REPLACE FUNCTION public.calculate_loan_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- When status changes to approved, calculate the total payable and update balance
  IF (OLD.status = 'pending' AND NEW.status = 'approved') THEN
    -- Simple flat interest for now: Total = Principal + (Principal * (Rate/100))
    -- Or could be monthly: Principal + (Principal * (Rate/100) * term_months)
    -- Let's go with a simple flat rate for this micro-finance model
    NEW.total_payable := NEW.amount + (NEW.amount * (NEW.interest_rate / 100));
    NEW.balance := NEW.total_payable;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_loan_approval_calculate_totals
  BEFORE UPDATE OF status ON public.loan_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_loan_totals();
