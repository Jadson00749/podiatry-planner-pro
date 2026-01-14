import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface Anamnesis {
  id: string;
  client_id: string;
  profile_id: string;
  // Template dinâmico (novo)
  template_id?: string | null;
  dynamic_answers?: Record<string, any> | null;
  // Queixa Principal
  main_complaint: string | null;
  // Histórico do Problema
  problem_history: string | null;
  // Condições de Saúde (checkboxes)
  has_diabetes: boolean;
  has_circulatory_problems: boolean;
  has_hypertension: boolean;
  uses_continuous_medication: boolean;
  has_allergies: boolean;
  is_pregnant: boolean;
  // Avaliação Clínica
  skin_type: string | null; // seca / normal / úmida
  sensitivity: string | null; // normal / reduzida / aumentada
  nail_condition: string | null;
  calluses_fissures: string | null;
  // Observações Clínicas
  clinical_observations: string | null;
  created_at: string;
  updated_at: string;
}

export function useAnamnesis(clientId: string) {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['anamnesis', profile?.id, clientId],
    queryFn: async () => {
      if (!profile?.id || !clientId) return null;
      
      // @ts-ignore - anamnesis table exists but not in Supabase types
      const { data, error } = await supabase
        .from('anamnesis')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('client_id', clientId)
        .maybeSingle();

      if (error) throw error;
      return data as Anamnesis | null;
    },
    enabled: !!profile?.id && !!clientId,
  });
}

export function useCreateAnamnesis() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (anamnesis: Partial<Omit<Anamnesis, 'id' | 'profile_id' | 'created_at' | 'updated_at'>> & { client_id: string }) => {
      if (!profile?.id) throw new Error('Profile not found');

      // @ts-ignore - anamnesis table exists but not in Supabase types
      const { data, error } = await supabase
        .from('anamnesis')
        .insert({ ...anamnesis, profile_id: profile.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar todas as queries de anamnese para este cliente
      queryClient.invalidateQueries({ queryKey: ['anamnesis', profile?.id, variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ['all-anamnesis'] });
    },
  });
}

export function useUpdateAnamnesis() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Anamnesis> & { id: string }) => {
      // @ts-ignore - anamnesis table exists but not in Supabase types
      const { data, error } = await supabase
        .from('anamnesis')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidar todas as queries de anamnese para este cliente
      queryClient.invalidateQueries({ queryKey: ['anamnesis', profile?.id, data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['all-anamnesis'] });
    },
  });
}

export function useAllAnamnesis() {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['all-anamnesis', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      // @ts-ignore - anamnesis table exists but not in Supabase types
      const { data, error } = await supabase
        .from('anamnesis')
        .select('*')
        .eq('profile_id', profile.id);

      if (error) throw error;
      return (data || []) as Anamnesis[];
    },
    enabled: !!profile?.id,
  });
}












