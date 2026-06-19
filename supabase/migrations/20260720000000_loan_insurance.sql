-- ADD INSURANCE TO LOANS
ALTER TABLE public.loan_applications
  ADD COLUMN IF NOT EXISTS insurance_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS insurance_premium NUMERIC DEFAULT 0;

-- COMMENT explaining the insurance
COMMENT ON COLUMN public.loan_applications.insurance_enabled IS 'Whether the user opted for credit protection insurance';
COMMENT ON COLUMN public.loan_applications.insurance_premium IS 'The fee charged for credit protection';
