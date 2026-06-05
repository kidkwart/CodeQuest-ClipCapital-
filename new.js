    (await (await import('./src/integrations/supabase/client')).supabase.auth.getUser()).data.user.id
    