
-- Update susu_groups frequency constraint to be more flexible and include Monthly
ALTER TABLE public.susu_groups DROP CONSTRAINT IF EXISTS susu_groups_frequency_check;
ALTER TABLE public.susu_groups ADD CONSTRAINT susu_groups_frequency_check
  CHECK (lower(frequency) IN ('daily', 'weekly', 'monthly'));

-- Ensure pot and members_count are always initialized correctly in insert
ALTER TABLE public.susu_groups ALTER COLUMN pot SET DEFAULT 0;
ALTER TABLE public.susu_groups ALTER COLUMN members_count SET DEFAULT 1;

-- Add a trigger to auto-generate invite_code if missing (backup for frontend)
CREATE OR REPLACE FUNCTION public.ensure_susu_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := substr(md5(random()::text), 1, 8);
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER on_susu_create_invite
  BEFORE INSERT ON public.susu_groups
  FOR EACH ROW EXECUTE FUNCTION public.ensure_susu_invite_code();
