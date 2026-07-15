-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id SERIAL PRIMARY KEY,
    interest_rate DECIMAL DEFAULT 10.0,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage settings
CREATE POLICY "Admins can manage system settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- Allow everyone (authenticated) to read settings
CREATE POLICY "Anyone can read system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

-- Insert default settings
INSERT INTO public.system_settings (id, interest_rate, maintenance_mode)
VALUES (1, 10.0, FALSE)
ON CONFLICT (id) DO NOTHING;
