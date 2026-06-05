-- Restrict profile deletes to the owner
CREATE POLICY "own profile delete" ON public.profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- Restrict susu_groups visibility to members only
DROP POLICY IF EXISTS "susu public read" ON public.susu_groups;

CREATE POLICY "members can read susu groups" ON public.susu_groups
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.susu_memberships m
    WHERE m.group_id = susu_groups.id AND m.user_id = auth.uid()
  ));

REVOKE SELECT ON public.susu_groups FROM anon;