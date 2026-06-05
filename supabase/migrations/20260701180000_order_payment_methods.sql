-- Add payment method to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'momo', -- 'momo' or 'loan'
  ADD COLUMN IF NOT EXISTS loan_id UUID REFERENCES public.loan_applications(id);

-- Policy to allow users to see their own orders (if not already handled correctly)
DROP POLICY IF EXISTS "buyer or vendor reads orders" ON public.orders;
CREATE POLICY "buyer reads own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Trigger to update loan balance when an order is paid via loan
CREATE OR REPLACE FUNCTION public.handle_loan_payment_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (NEW.payment_method = 'loan' AND NEW.loan_id IS NOT NULL) THEN
    UPDATE public.loan_applications
    SET
      balance = balance + NEW.total,
      updated_at = now()
    WHERE id = NEW.loan_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_order_loan_payment
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_loan_payment_order();
