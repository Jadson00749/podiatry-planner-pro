-- Add avatar_url column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment
COMMENT ON COLUMN public.clients.avatar_url IS 'URL da foto do cliente armazenada no Supabase Storage';

