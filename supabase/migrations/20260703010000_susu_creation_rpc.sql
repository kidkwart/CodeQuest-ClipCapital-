
-- RPC to create a Susu group and add the owner as the first member atomically
CREATE OR REPLACE FUNCTION public.create_susu_group_v2(
  _name text,
  _contribution numeric,
  _frequency text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_group_id uuid;
  _invite_code text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Generate invite code
  _invite_code := substr(md5(random()::text), 1, 8);

  -- 1. Create the group
  INSERT INTO public.susu_groups (
    name,
    contribution,
    frequency,
    owner_id,
    members_count,
    pot,
    status,
    invite_code
  )
  VALUES (
    _name,
    _contribution,
    _frequency,
    auth.uid(),
    1,
    0,
    'active',
    _invite_code
  )
  RETURNING id INTO _new_group_id;

  -- 2. Add the owner as the first member
  INSERT INTO public.susu_memberships (
    group_id,
    user_id,
    payout_order,
    joined_at
  )
  VALUES (
    _new_group_id,
    auth.uid(),
    1,
    now()
  );

  RETURN _new_group_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_susu_group_v2(text, numeric, text) TO authenticated;
