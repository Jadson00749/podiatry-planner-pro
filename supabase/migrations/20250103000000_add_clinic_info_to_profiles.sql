-- Adicionar campos de informações da clínica na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS clinic_email TEXT,
ADD COLUMN IF NOT EXISTS clinic_address TEXT,
ADD COLUMN IF NOT EXISTS clinic_cnpj TEXT,
ADD COLUMN IF NOT EXISTS clinic_website TEXT,
ADD COLUMN IF NOT EXISTS clinic_instagram TEXT,
ADD COLUMN IF NOT EXISTS clinic_facebook TEXT;

-- Comentários explicativos
COMMENT ON COLUMN public.profiles.clinic_email IS 'Email da clínica';
COMMENT ON COLUMN public.profiles.clinic_address IS 'Endereço completo da clínica';
COMMENT ON COLUMN public.profiles.clinic_cnpj IS 'CNPJ da clínica (apenas números)';
COMMENT ON COLUMN public.profiles.clinic_website IS 'Site da clínica';
COMMENT ON COLUMN public.profiles.clinic_instagram IS 'Instagram da clínica';
COMMENT ON COLUMN public.profiles.clinic_facebook IS 'Facebook da clínica';



