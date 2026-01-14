-- Adicionar campo template_id na tabela anamnesis existente
ALTER TABLE public.anamnesis 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.anamnesis_templates(id) ON DELETE SET NULL;

-- Adicionar campo responses para armazenar respostas dinâmicas em JSON
ALTER TABLE public.anamnesis 
ADD COLUMN IF NOT EXISTS responses JSONB DEFAULT '{}'::jsonb;

-- Índice para melhor performance nas queries
CREATE INDEX IF NOT EXISTS idx_anamnesis_template_id ON public.anamnesis(template_id);

-- Comentário
COMMENT ON COLUMN public.anamnesis.template_id IS 'ID do template usado para criar esta anamnese';
COMMENT ON COLUMN public.anamnesis.responses IS 'Respostas dinâmicas baseadas no template: {"question_id": {"answer": "...", "details": "..."}}';

-- Exemplo de estrutura do campo responses:
-- {
--   "uuid-da-pergunta-1": {
--     "answer": "Sim",
--     "details": "Diabetes tipo 2 desde 2020"
--   },
--   "uuid-da-pergunta-2": {
--     "answer": "Normal"
--   }
-- }

