import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export type QuestionType = 
  | 'yes_no' 
  | 'yes_no_details' 
  | 'multiple_choice' 
  | 'text_short' 
  | 'text_long' 
  | 'number' 
  | 'date' 
  | 'section';

export interface TemplateQuestion {
  id: string;
  template_id: string;
  question_order: number;
  question_type: QuestionType;
  question_text: string;
  is_required: boolean;
  has_observations: boolean;
  options?: string[];
  created_at: string;
}

export interface AnamnesisTemplate {
  id: string;
  profile_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_system_template: boolean;
  area: string | null;
  created_at: string;
  updated_at: string;
  questions?: TemplateQuestion[];
}

// Hook para buscar todos os templates (do usuário + sistema)
export function useAnamnesisTemplates() {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['anamnesis-templates', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anamnesis_templates')
        .select(`
          *,
          questions:template_questions(*)
        `)
        .order('is_system_template', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ordenar perguntas por question_order
      const templatesWithSortedQuestions = (data || []).map(template => ({
        ...template,
        questions: (template.questions || []).sort(
          (a: TemplateQuestion, b: TemplateQuestion) => a.question_order - b.question_order
        ),
      }));

      return templatesWithSortedQuestions as AnamnesisTemplate[];
    },
    enabled: !!profile?.id,
  });
}

// Hook para buscar um template específico
export function useAnamnesisTemplate(templateId: string | null) {
  return useQuery({
    queryKey: ['anamnesis-template', templateId],
    queryFn: async () => {
      if (!templateId) return null;

      const { data, error } = await supabase
        .from('anamnesis_templates')
        .select(`
          *,
          questions:template_questions(*)
        `)
        .eq('id', templateId)
        .single();

      if (error) throw error;

      // Ordenar perguntas
      const templateWithSortedQuestions = {
        ...data,
        questions: (data.questions || []).sort(
          (a: TemplateQuestion, b: TemplateQuestion) => a.question_order - b.question_order
        ),
      };

      return templateWithSortedQuestions as AnamnesisTemplate;
    },
    enabled: !!templateId,
  });
}

// Hook para criar template (copiando de um template do sistema ou do zero)
export function useCreateAnamnesisTemplate() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ 
      name, 
      description, 
      is_default, 
      area,
      sourceTemplateId 
    }: { 
      name: string;
      description?: string;
      is_default?: boolean;
      area?: string;
      sourceTemplateId?: string; // ID do template para copiar
    }) => {
      if (!profile?.id) throw new Error('Profile not found');

      // Criar o template
      const { data: newTemplate, error: templateError } = await supabase
        .from('anamnesis_templates')
        .insert({
          profile_id: profile.id,
          name,
          description,
          is_default: is_default || false,
          is_system_template: false,
          area,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Se tiver template de origem, copiar as perguntas
      if (sourceTemplateId) {
        const { data: questions, error: questionsError } = await supabase
          .from('template_questions')
          .select('*')
          .eq('template_id', sourceTemplateId)
          .order('question_order');

        if (questionsError) throw questionsError;

        // Copiar perguntas para o novo template
        if (questions && questions.length > 0) {
          const newQuestions = questions.map(q => ({
            template_id: newTemplate.id,
            question_order: q.question_order,
            question_type: q.question_type,
            question_text: q.question_text,
            is_required: q.is_required,
            has_observations: q.has_observations,
            options: q.options,
          }));

          const { error: insertError } = await supabase
            .from('template_questions')
            .insert(newQuestions);

          if (insertError) throw insertError;
        }
      }

      return newTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates'] });
    },
  });
}

// Hook para atualizar template
export function useUpdateAnamnesisTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      name, 
      description, 
      is_default 
    }: { 
      id: string;
      name?: string;
      description?: string;
      is_default?: boolean;
    }) => {
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (is_default !== undefined) updates.is_default = is_default;
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('anamnesis_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates'] });
      queryClient.invalidateQueries({ queryKey: ['anamnesis-template'] });
    },
  });
}

// Hook para deletar template
export function useDeleteAnamnesisTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('anamnesis_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates'] });
    },
  });
}

// Hook para adicionar pergunta ao template
export function useAddTemplateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (question: Omit<TemplateQuestion, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('template_questions')
        .insert(question)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-template', variables.template_id] });
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates'] });
    },
  });
}

// Hook para atualizar pergunta
export function useUpdateTemplateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<TemplateQuestion> & { id: string }) => {
      const { data, error } = await supabase
        .from('template_questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-template', data.template_id] });
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates'] });
    },
  });
}

// Hook para deletar pergunta
export function useDeleteTemplateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, template_id }: { id: string; template_id: string }) => {
      const { error } = await supabase
        .from('template_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return template_id;
    },
    onSuccess: (template_id) => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-template', template_id] });
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates'] });
    },
  });
}

// Hook para reordenar perguntas
export function useReorderTemplateQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      template_id, 
      questions 
    }: { 
      template_id: string;
      questions: { id: string; question_order: number }[];
    }) => {
      // Atualizar ordem de todas as perguntas
      const updates = questions.map(q =>
        supabase
          .from('template_questions')
          .update({ question_order: q.question_order })
          .eq('id', q.id)
      );

      await Promise.all(updates);
      return template_id;
    },
    onSuccess: (template_id) => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis-template', template_id] });
      queryClient.invalidateQueries({ queryKey: ['anamnesis-templates'] });
    },
  });
}

