
-- Seed some premium barber/stylist products
INSERT INTO public.products (name, description, price, image_url, stock, active, vendor_id)
SELECT
  'Professional Cordless Clipper',
  'High-performance cordless clipper with precision blades.',
  850.00,
  'https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5?w=400&q=80',
  10,
  true,
  id
FROM auth.users
WHERE email = 'bernardyawkwarteng8@gmail.com'
LIMIT 1;

INSERT INTO public.products (name, description, price, image_url, stock, active, vendor_id)
SELECT
  'Barber Chair Classic',
  'Heavy-duty hydraulic barber chair with premium leather.',
  2500.00,
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
  5,
  true,
  id
FROM auth.users
WHERE email = 'bernardyawkwarteng8@gmail.com'
LIMIT 1;

INSERT INTO public.products (name, description, price, image_url, stock, active, vendor_id)
SELECT
  'Pro Hair Dryer',
  'Ionic hair dryer for fast drying and smooth results.',
  450.00,
  'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400&q=80',
  15,
  true,
  id
FROM auth.users
WHERE email = 'bernardyawkwarteng8@gmail.com'
LIMIT 1;

INSERT INTO public.products (name, description, price, image_url, stock, active, vendor_id)
SELECT
  'Straight Razor Set',
  'Professional straight razor with replaceable blades.',
  120.00,
  'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80',
  20,
  true,
  id
FROM auth.users
WHERE email = 'bernardyawkwarteng8@gmail.com'
LIMIT 1;
