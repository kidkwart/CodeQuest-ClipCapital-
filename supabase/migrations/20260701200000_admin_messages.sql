-- Table for direct messages between users and admin
CREATE TABLE IF NOT EXISTS public.admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Users can see their own message history
CREATE POLICY "Users see own messages" ON public.admin_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can send messages to admin
CREATE POLICY "Users send messages" ON public.admin_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND is_from_admin = false);

-- Admins can see all messages
CREATE POLICY "Admins see all messages" ON public.admin_messages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Grant access
GRANT ALL ON public.admin_messages TO authenticated;
