-- Adicionar RLS policy para permitir leitura pública de appointments
-- Necessário para o sistema de agendamento público verificar horários ocupados

-- Permitir que usuários autenticados vejam appointments para verificar disponibilidade
CREATE POLICY "Allow authenticated users to read appointments for booking"
ON public.appointments
FOR SELECT
USING (auth.role() = 'authenticated');

-- Se quiser permitir leitura anônima também (mais permissivo):
-- CREATE POLICY "Allow public read appointments for booking availability"
-- ON public.appointments
-- FOR SELECT
-- USING (true);

-- Verificar policies existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'appointments';

