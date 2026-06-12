
-- Update loan calculation logic to use monthly interest instead of flat rate
CREATE OR REPLACE FUNCTION public.calculate_loan_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- When status changes from pending to approved, calculate total with monthly interest
  IF (OLD.status = 'pending' AND NEW.status = 'approved') THEN
    -- Formula: Total = Principal + (Principal * (Monthly_Rate/100) * Term_Months)
    NEW.total_payable := NEW.amount + (NEW.amount * (NEW.interest_rate / 100) * NEW.term_months);
    NEW.balance := NEW.total_payable;
  END IF;
  RETURN NEW;
END; $$;
