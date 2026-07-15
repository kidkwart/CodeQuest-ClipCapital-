-- Add sms_backup_enabled to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sms_backup_enabled BOOLEAN DEFAULT false;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
