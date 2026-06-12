
-- Add wallet balance to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(12,2) DEFAULT 0.00;

-- Simple CSV Export view (optional, but good for reference)
-- We'll handle CSV generation in the frontend for better performance.
