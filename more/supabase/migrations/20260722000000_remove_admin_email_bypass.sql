-- Fix: Remove hardcoded admin email bypass from RLS policies
-- The user_roles table should be the only source of truth for admin access

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON public.withdrawal_requests;

-- Recreate policies without email bypass
CREATE POLICY "Admins can view all withdrawal requests"
  ON public.withdrawal_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update withdrawal requests"
  ON public.withdrawal_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );