-- Migration: Configurar políticas RLS para o bucket profile-images (CORRIGIDO)
-- Executa no SQL Editor do Supabase

-- IMPORTANTE: 
-- 1. Primeiro, DELETE as políticas antigas se já foram criadas:
--    DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
--    DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
--    DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- 2. Depois execute este arquivo

-- Política 1: Permitir Upload (INSERT)
-- Permite usuários autenticados fazerem upload nas pastas avatars/ e logos/
CREATE POLICY "Users can upload their own images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' 
  AND (
    (storage.foldername(name))[1] = 'avatars'
    OR (storage.foldername(name))[1] = 'logos'
  )
);

-- Política 2: Permitir Leitura (SELECT)
-- Permite leitura pública (já que o bucket é público)
CREATE POLICY "Public can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- Política 3: Permitir Atualização (UPDATE)
-- Permite usuários atualizarem imagens nas pastas avatars/ e logos/
CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' 
  AND (
    (storage.foldername(name))[1] = 'avatars'
    OR (storage.foldername(name))[1] = 'logos'
  )
);

-- Política 4: Permitir Exclusão (DELETE)
-- Permite usuários deletarem imagens nas pastas avatars/ e logos/
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' 
  AND (
    (storage.foldername(name))[1] = 'avatars'
    OR (storage.foldername(name))[1] = 'logos'
  )
);




