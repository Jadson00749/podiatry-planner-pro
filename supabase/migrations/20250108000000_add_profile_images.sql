-- Migration: Adiciona campos para avatar e logo da clínica
-- Executa no SQL Editor do Supabase

-- Adiciona colunas para URLs das imagens
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS clinic_logo_url TEXT;

-- Comentários
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL da foto do profissional';
COMMENT ON COLUMN public.profiles.clinic_logo_url IS 'URL do logo da clínica';











