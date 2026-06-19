-- Add notification and security preferences to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS privacy_mode_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS security_2fa_enabled BOOLEAN DEFAULT false;
