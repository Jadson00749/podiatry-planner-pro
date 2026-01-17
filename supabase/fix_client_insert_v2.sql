-- ============================================
-- FIX V2: Permitir que usuários autenticados criem seus registros de cliente
-- ============================================

-- Remover todas as policies de INSERT antigas
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Professionals can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Allow client creation during public booking" ON public.clients;
DROP POLICY IF EXISTS "Clients can create their own profile" ON public.clients;

-- Policy 1: Profissionais podem criar clientes
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

-- Policy 2: Usuários autenticados podem criar registro de cliente vinculado a eles
CREATE POLICY "Users can create their client profile"
ON public.clients
FOR INSERT
WITH CHECK (
  linked_user_id = auth.uid()
);

-- Garantir que clientes podem ver e atualizar seus próprios dados
DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;
DROP POLICY IF EXISTS "Clients can update their own data" ON public.clients;
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;

CREATE POLICY "Users can view their own client data"
ON public.clients
FOR SELECT
USING (
  linked_user_id = auth.uid()
  OR
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own client data"
ON public.clients
FOR UPDATE
USING (
  linked_user_id = auth.uid()
)
WITH CHECK (
  linked_user_id = auth.uid()
);


