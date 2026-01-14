import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProcedures, useCreateProcedure, useUpdateProcedure, useDeleteProcedure } from '@/hooks/useProcedures';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/hooks/useProfile', () => ({
  useProfile: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useProcedures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve buscar procedimentos quando profile existe', async () => {
    const mockProfile = { id: 'profile-1' };
    (useProfile as any).mockReturnValue({ data: mockProfile });

    const mockProcedures = [
      { id: '1', name: 'Procedimento 1', default_price: 100, profile_id: 'profile-1' },
      { id: '2', name: 'Procedimento 2', default_price: 200, profile_id: 'profile-1' },
    ];

    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockOrder = vi.fn().mockResolvedValue({ data: mockProcedures, error: null });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      order: mockOrder,
    });

    const { result } = renderHook(() => useProcedures(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProcedures);
  });
});

describe('useCreateProcedure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve criar procedimento com sucesso', async () => {
    const mockProfile = { id: 'profile-1' };
    (useProfile as any).mockReturnValue({ data: mockProfile });

    const newProcedure = {
      name: 'Novo Procedimento',
      default_price: 150,
      duration_minutes: 30,
      description: 'Descrição do procedimento',
    };

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'new-id', ...newProcedure, profile_id: 'profile-1', created_at: '2025-01-01' },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      insert: mockInsert,
    });
    mockInsert.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
    });

    const { result } = renderHook(() => useCreateProcedure(), { wrapper: createWrapper() });

    await result.current.mutateAsync(newProcedure);

    expect(mockInsert).toHaveBeenCalledWith({
      ...newProcedure,
      profile_id: 'profile-1',
    });
  });
});

describe('useUpdateProcedure', () => {
  it('deve atualizar procedimento com sucesso', async () => {
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: '1', name: 'Procedimento Atualizado' },
      error: null,
    });

    (supabase.from as any).mockReturnValue({
      update: mockUpdate,
    });
    mockUpdate.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      single: mockSingle,
    });

    const { result } = renderHook(() => useUpdateProcedure(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ id: '1', name: 'Procedimento Atualizado' });

    expect(mockUpdate).toHaveBeenCalledWith({ name: 'Procedimento Atualizado' });
    expect(mockEq).toHaveBeenCalledWith('id', '1');
  });
});

describe('useDeleteProcedure', () => {
  it('deve deletar procedimento com sucesso', async () => {
    const mockDelete = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ error: null });

    (supabase.from as any).mockReturnValue({
      delete: mockDelete,
    });
    mockDelete.mockReturnValue({
      eq: mockEq,
    });

    const { result } = renderHook(() => useDeleteProcedure(), { wrapper: createWrapper() });

    await result.current.mutateAsync('1');

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', '1');
  });
});








