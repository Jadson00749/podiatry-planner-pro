-- ============================================
-- FIX: Permitir que clientes criem seus próprios registros
-- ============================================

-- Remover policy antiga se existir
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can create their own profile" ON public.clients;

-- Permitir que profissionais insiram clientes (já existia)
CREATE POLICY "Professionals can insert clients"
ON public.clients
FOR INSERT
WITH CHECK (
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'professional'
  )
);

-- NOVA: Permitir que sistema crie clientes automaticamente durante agendamento público
-- Isso permite que a API do backend crie clientes vinculados ao profissional
CREATE POLICY "Allow client creation during public booking"
ON public.clients
FOR INSERT
WITH CHECK (
  -- Permite inserir se o cliente será vinculado a um profissional válido
  profile_id IN (
    SELECT id FROM public.profiles 
    WHERE role = 'professional' 
    AND booking_enabled = true
  )
);

-- Permitir que clientes vejam e atualizem seus próprios dados
CREATE POLICY "Clients can view their own data"
ON public.clients
FOR SELECT
USING (
  linked_user_id = auth.uid()
  OR
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Clients can update their own data"
ON public.clients
FOR UPDATE
USING (
  linked_user_id = auth.uid()
)
WITH CHECK (
  linked_user_id = auth.uid()
);


