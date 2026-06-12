
-- Seed more Susu groups for variety
INSERT INTO public.susu_groups (name, members_count, contribution, frequency, pot, owner_id)
SELECT
  'Accra Premium Stylists',
  5,
  100,
  'Weekly',
  500,
  id
FROM auth.users
WHERE email = 'bernardyawkwarteng8@gmail.com'
LIMIT 1;

INSERT INTO public.susu_groups (name, members_count, contribution, frequency, pot, owner_id)
SELECT
  'Kumasi Clippers Daily',
  20,
  10,
  'Daily',
  200,
  id
FROM auth.users
WHERE email = 'bernardyawkwarteng8@gmail.com'
LIMIT 1;

INSERT INTO public.susu_groups (name, members_count, contribution, frequency, pot, owner_id)
SELECT
  'Monthly Tool Fund',
  10,
  500,
  'Monthly',
  0,
  id
FROM auth.users
WHERE email = 'bernardyawkwarteng8@gmail.com'
LIMIT 1;

INSERT INTO public.susu_groups (name, members_count, contribution, frequency, pot, owner_id)
SELECT
  'Osu Hair Queens',
  8,
  30,
  'Weekly',
  240,
  id
FROM auth.users
WHERE email = 'bernardyawkwarteng8@gmail.com'
LIMIT 1;
