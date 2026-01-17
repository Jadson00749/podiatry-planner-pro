-- Renomear coluna 'responses' para 'dynamic_answers' na tabela anamnesis
-- para manter consistência com o código da aplicação

-- Verificar se a coluna 'responses' existe e renomeá-la
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'anamnesis' 
        AND column_name = 'responses'
    ) THEN
        ALTER TABLE public.anamnesis RENAME COLUMN responses TO dynamic_answers;
    END IF;
END $$;

-- Se a coluna 'dynamic_answers' não existir, criá-la
ALTER TABLE public.anamnesis 
ADD COLUMN IF NOT EXISTS dynamic_answers JSONB DEFAULT '{}'::jsonb;

-- Atualizar comentário
COMMENT ON COLUMN public.anamnesis.dynamic_answers IS 'Respostas dinâmicas baseadas no template: {"question_id": {"answer": "...", "details": "..."}}';







