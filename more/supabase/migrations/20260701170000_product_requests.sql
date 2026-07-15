-- Table for users to request products they want stocked
CREATE TABLE IF NOT EXISTS public.product_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  estimated_price NUMERIC,
  note TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewing, stocked, unavailable
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.product_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create requests" ON public.product_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see own requests" ON public.product_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can see and manage all requests" ON public.product_requests
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Grant access
GRANT ALL ON public.product_requests TO authenticated;
