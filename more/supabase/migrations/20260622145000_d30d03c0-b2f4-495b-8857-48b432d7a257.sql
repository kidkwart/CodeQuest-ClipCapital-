
-- =========================================================================
-- ROLES
-- =========================================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'vendor', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "users read own roles" ON public.user_roles
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins manage roles" ON public.user_roles
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_exists boolean;
BEGIN
  INSERT INTO public.profiles (id, display_name, business_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'business_name', '')
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO admin_exists;
  IF NOT admin_exists THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user' FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT DO NOTHING;

-- =========================================================================
-- PROFILES cleanup
-- =========================================================================
ALTER TABLE public.profiles DROP COLUMN IF EXISTS loan_balance;

-- =========================================================================
-- SUSU
-- =========================================================================
TRUNCATE TABLE public.susu_memberships CASCADE;
TRUNCATE TABLE public.susu_groups CASCADE;

ALTER TABLE public.susu_groups
  ADD COLUMN owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN start_date date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN next_payout_date date,
  ADD COLUMN status text NOT NULL DEFAULT 'active',
  ADD COLUMN cycle_index integer NOT NULL DEFAULT 0,
  ADD COLUMN invite_code text NOT NULL DEFAULT substr(md5(random()::text), 1, 8) UNIQUE;

ALTER TABLE public.susu_memberships
  ADD COLUMN payout_order integer NOT NULL DEFAULT 0,
  ADD COLUMN has_received boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT susu_memberships_unique UNIQUE (group_id, user_id);

CREATE POLICY "owner creates susu group" ON public.susu_groups
FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "owner updates susu group" ON public.susu_groups
FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "owner deletes susu group" ON public.susu_groups
FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE public.susu_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.susu_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  cycle_index integer NOT NULL DEFAULT 0,
  momo_provider text NOT NULL DEFAULT 'mtn',
  momo_reference text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.susu_contributions TO authenticated;
GRANT ALL ON public.susu_contributions TO service_role;
ALTER TABLE public.susu_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read contributions" ON public.susu_contributions
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.susu_memberships m
          WHERE m.group_id = susu_contributions.group_id AND m.user_id = auth.uid())
);
CREATE POLICY "members insert own contribution" ON public.susu_contributions
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.susu_memberships m
    WHERE m.group_id = susu_contributions.group_id AND m.user_id = auth.uid()
  )
);
CREATE POLICY "owner confirms contributions" ON public.susu_contributions
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.susu_groups g WHERE g.id = susu_contributions.group_id AND g.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.susu_groups g WHERE g.id = susu_contributions.group_id AND g.owner_id = auth.uid()));

CREATE TABLE public.susu_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.susu_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  cycle_index integer NOT NULL DEFAULT 0,
  momo_reference text NOT NULL DEFAULT '',
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.susu_payouts TO authenticated;
GRANT ALL ON public.susu_payouts TO service_role;
ALTER TABLE public.susu_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read payouts" ON public.susu_payouts
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.susu_memberships m WHERE m.group_id = susu_payouts.group_id AND m.user_id = auth.uid())
);
CREATE POLICY "owner records payouts" ON public.susu_payouts
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.susu_groups g WHERE g.id = susu_payouts.group_id AND g.owner_id = auth.uid())
);

-- =========================================================================
-- LOANS
-- =========================================================================
CREATE TABLE public.loan_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  term_months integer NOT NULL CHECK (term_months > 0),
  purpose text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  balance numeric NOT NULL DEFAULT 0,
  decision_note text NOT NULL DEFAULT '',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  disbursed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.loan_applications TO authenticated;
GRANT ALL ON public.loan_applications TO service_role;
ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "borrower reads own loans" ON public.loan_applications
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "borrower creates own loan" ON public.loan_applications
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "admin updates loans" ON public.loan_applications
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.loan_repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  momo_provider text NOT NULL DEFAULT 'mtn',
  momo_reference text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.loan_repayments TO authenticated;
GRANT ALL ON public.loan_repayments TO service_role;
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "borrower reads own repayments" ON public.loan_repayments
FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "borrower creates own repayment" ON public.loan_repayments
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin confirms repayment" ON public.loan_repayments
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================================
-- MARKETPLACE
-- =========================================================================
DROP TABLE IF EXISTS public.cart_items;

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL CHECK (price >= 0),
  image_url text NOT NULL DEFAULT '',
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authed reads active products" ON public.products
FOR SELECT TO authenticated USING (active = true OR vendor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "vendor creates own product" ON public.products
FOR INSERT TO authenticated WITH CHECK (auth.uid() = vendor_id AND public.has_role(auth.uid(), 'vendor'));
CREATE POLICY "vendor updates own product" ON public.products
FOR UPDATE TO authenticated USING (auth.uid() = vendor_id) WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "vendor deletes own product" ON public.products
FOR DELETE TO authenticated USING (auth.uid() = vendor_id);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total numeric NOT NULL CHECK (total >= 0),
  momo_provider text NOT NULL DEFAULT 'mtn',
  momo_reference text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  vendor_id uuid NOT NULL REFERENCES auth.users(id),
  qty integer NOT NULL CHECK (qty > 0),
  price numeric NOT NULL CHECK (price >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Now both tables exist; create cross-referencing policies
CREATE POLICY "buyer or vendor reads orders" ON public.orders
FOR SELECT TO authenticated USING (
  auth.uid() = buyer_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = orders.id AND oi.vendor_id = auth.uid())
);
CREATE POLICY "buyer creates own order" ON public.orders
FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "buyer or vendor updates order" ON public.orders
FOR UPDATE TO authenticated USING (
  auth.uid() = buyer_id
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.order_items oi WHERE oi.order_id = orders.id AND oi.vendor_id = auth.uid())
) WITH CHECK (true);

CREATE POLICY "buyer or vendor reads items" ON public.order_items
FOR SELECT TO authenticated USING (
  vendor_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.buyer_id = auth.uid())
);
CREATE POLICY "buyer creates own items" ON public.order_items
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.buyer_id = auth.uid())
);

-- =========================================================================
-- updated_at triggers
-- =========================================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER loan_applications_touch BEFORE UPDATE ON public.loan_applications
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
