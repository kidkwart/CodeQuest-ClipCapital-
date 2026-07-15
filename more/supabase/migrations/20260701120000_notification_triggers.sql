-- Trigger to notify user when loan application status changes
CREATE OR REPLACE FUNCTION public.handle_loan_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.notifications (user_id, title, body, type, data)
    VALUES (
      NEW.user_id,
      'Loan Application ' || initcap(NEW.status),
      CASE
        WHEN NEW.status = 'approved' THEN 'Your loan application for GH₵ ' || NEW.amount || ' has been approved!'
        WHEN NEW.status = 'rejected' THEN 'Your loan application for GH₵ ' || NEW.amount || ' was not approved. Decision note: ' || COALESCE(NEW.decision_note, 'No additional info.')
        WHEN NEW.status = 'disbursed' THEN 'GH₵ ' || NEW.amount || ' has been sent to your Mobile Money account.'
        ELSE 'Your loan application status has been updated to ' || NEW.status || '.'
      END,
      'loan',
      jsonb_build_object('loan_id', NEW.id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_loan_status_change
  AFTER UPDATE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_loan_status_change();

-- Trigger to notify user when a Susu payout is recorded
CREATE OR REPLACE FUNCTION public.handle_susu_payout()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _group_name TEXT;
BEGIN
  SELECT name INTO _group_name FROM public.susu_groups WHERE id = NEW.group_id;

  INSERT INTO public.notifications (user_id, title, body, type, data)
  VALUES (
    NEW.user_id,
    'Susu Payout Received!',
    'Your payout of GH₵ ' || NEW.amount || ' from ' || COALESCE(_group_name, 'your Susu group') || ' has been processed.',
    'susu',
    jsonb_build_object('group_id', NEW.group_id, 'payout_id', NEW.id)
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_susu_payout_insert
  AFTER INSERT ON public.susu_payouts
  FOR EACH ROW EXECUTE FUNCTION public.handle_susu_payout();

-- Trigger to notify admins of new loan applications
CREATE OR REPLACE FUNCTION public.handle_new_loan_application()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, type, data)
  SELECT
    user_id,
    'New Loan Application',
    'A new loan application for GH₵ ' || NEW.amount || ' requires review.',
    'loan_admin',
    jsonb_build_object('loan_id', NEW.id)
  FROM public.user_roles
  WHERE role = 'admin';

  RETURN NEW;
END; $$;

CREATE TRIGGER on_loan_application_insert
  AFTER INSERT ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_loan_application();

-- Trigger to notify vendors of new orders
CREATE OR REPLACE FUNCTION public.handle_new_order_item()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Only notify if this vendor hasn't been notified for this order yet in the last 10 seconds (to prevent duplicates in bulk insert)
  IF NOT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = NEW.vendor_id
      AND type = 'order'
      AND (data->>'order_id')::uuid = NEW.order_id
  ) THEN
    INSERT INTO public.notifications (user_id, title, body, type, data)
    VALUES (
      NEW.vendor_id,
      'New Order Received',
      'A new order has been placed for your products.',
      'order',
      jsonb_build_object('order_id', NEW.order_id)
    );
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_order_item_insert
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_order_item();
