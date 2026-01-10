-- Migration: Adicionar campo onboarding_completed na tabela profiles
-- Executa no SQL Editor do Supabase

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Comentário
COMMENT ON COLUMN profiles.onboarding_completed IS 'Indica se o usuário completou o tutorial de onboarding';

