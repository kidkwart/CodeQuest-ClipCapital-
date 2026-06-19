
-- Add bank/momo details to profiles for payouts
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_name TEXT, -- e.g., 'MTN', 'Telecel', 'AirtelTigo', or 'GCB'
  ADD COLUMN IF NOT EXISTS account_number TEXT, -- The MoMo number or bank account number
  ADD COLUMN IF NOT EXISTS account_name TEXT; -- The name on the account for verification
