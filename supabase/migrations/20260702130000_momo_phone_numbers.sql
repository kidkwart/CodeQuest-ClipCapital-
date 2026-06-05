-- Add phone_number to orders and repayments
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS momo_number TEXT;
ALTER TABLE public.loan_repayments ADD COLUMN IF NOT EXISTS momo_number TEXT;
ALTER TABLE public.susu_contributions ADD COLUMN IF NOT EXISTS momo_number TEXT;
