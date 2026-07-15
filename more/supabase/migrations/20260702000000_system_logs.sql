-- Table for global system logs (Admin visibility only)
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'signup', 'loan_request', 'purchase', 'susu_payment'
  user_id UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins see logs" ON public.system_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Triggers to auto-log important events
CREATE OR REPLACE FUNCTION public.log_system_event()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_TABLE_NAME = 'profiles' AND TG_OP = 'INSERT') THEN
    INSERT INTO public.system_logs (event_type, user_id, details)
    VALUES ('signup', NEW.id, jsonb_build_object('name', NEW.display_name));
  ELSIF (TG_TABLE_NAME = 'loan_applications' AND TG_OP = 'INSERT') THEN
    INSERT INTO public.system_logs (event_type, user_id, details)
    VALUES ('loan_request', NEW.user_id, jsonb_build_object('amount', NEW.amount));
  ELSIF (TG_TABLE_NAME = 'orders' AND TG_OP = 'INSERT') THEN
    INSERT INTO public.system_logs (event_type, user_id, details)
    VALUES ('purchase', NEW.buyer_id, jsonb_build_object('total', NEW.total));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_profile_signup AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_system_event();
CREATE TRIGGER log_loan_request AFTER INSERT ON public.loan_applications FOR EACH ROW EXECUTE FUNCTION public.log_system_event();
CREATE TRIGGER log_purchase AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.log_system_event();
