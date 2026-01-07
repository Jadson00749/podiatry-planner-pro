-- Adicionar campo de dias de funcionamento na tabela profiles
-- Armazena um array de números: 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5]::INTEGER[];

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.working_days IS 'Array de dias da semana em que a clínica funciona. 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado. Padrão: segunda a sexta';

