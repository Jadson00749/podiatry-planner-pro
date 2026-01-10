import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment } from '@/hooks/useAppointments';
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

describe('useAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve buscar agendamentos quando profile existe', async () => {
    const mockProfile = { id: 'profile-1' };
    (useProfile as any).mockReturnValue({ data: mockProfile });

    const mockAppointments = [
      {
        id: '1',
        appointment_date: '2025-01-15',
        appointment_time: '10:00',
        client_id: 'client-1',
        profile_id: 'profile-1',
        status: 'scheduled',
        payment_status: 'pending',
        price: 100,
      },
    ];

    // A query do useAppointments chama order duas vezes (date e time)
    const mockOrder2 = vi.fn().mockResolvedValue({ data: mockAppointments, error: null });
    const mockOrder1 = vi.fn().mockReturnValue({
      order: mockOrder2,
    });
    const mockEq = vi.fn().mockReturnValue({
      order: mockOrder1,
    });
    const mockSelect = vi.fn().mockReturnValue({
      eq: mockEq,
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useAppointments(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.data).toBeTruthy();
    }, { timeout: 3000 });

    expect(result.current.data).toEqual(mockAppointments);
  });

  it('deve filtrar por data quando fornecida', async () => {
    const mockProfile = { id: 'profile-1' };
    (useProfile as any).mockReturnValue({ data: mockProfile });

    const mockEqDate = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockOrder2 = vi.fn().mockReturnValue({
      eq: mockEqDate,
    });
    const mockOrder1 = vi.fn().mockReturnValue({
      order: mockOrder2,
    });
    const mockEq = vi.fn().mockReturnValue({
      order: mockOrder1,
    });
    const mockSelect = vi.fn().mockReturnValue({
      eq: mockEq,
    });

    (supabase.from as any).mockReturnValue({
      select: mockSelect,
    });

    const { result } = renderHook(() => useAppointments('2025-01-15'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess || result.current.data !== undefined).toBeTruthy();
    }, { timeout: 3000 });

    expect(mockEqDate).toHaveBeenCalledWith('appointment_date', '2025-01-15');
  });
});

describe('useCreateAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve criar agendamento com sucesso', async () => {
    const mockProfile = { id: 'profile-1' };
    (useProfile as any).mockReturnValue({ data: mockProfile });

    const newAppointment = {
      client_id: 'client-1',
      procedure_id: 'proc-1',
      appointment_date: '2025-01-15',
      appointment_time: '10:00',
      status: 'scheduled' as const,
      payment_status: 'pending' as const,
      price: 100,
      notes: null,
      reminder_sent: false,
    };

    const mockInsert = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'new-id', ...newAppointment, profile_id: 'profile-1' },
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

    const { result } = renderHook(() => useCreateAppointment(), { wrapper: createWrapper() });

    await result.current.mutateAsync(newAppointment);

    expect(mockInsert).toHaveBeenCalledWith({
      ...newAppointment,
      profile_id: 'profile-1',
    });
  });
});

describe('useUpdateAppointment', () => {
  it('deve atualizar agendamento com sucesso', async () => {
    const mockUpdate = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: '1', status: 'completed' },
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

    const { result } = renderHook(() => useUpdateAppointment(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ id: '1', status: 'completed' });

    expect(mockUpdate).toHaveBeenCalledWith({ status: 'completed' });
    expect(mockEq).toHaveBeenCalledWith('id', '1');
  });
});

describe('useDeleteAppointment', () => {
  it('deve deletar agendamento com sucesso', async () => {
    const mockDelete = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockResolvedValue({ error: null });

    (supabase.from as any).mockReturnValue({
      delete: mockDelete,
    });
    mockDelete.mockReturnValue({
      eq: mockEq,
    });

    const { result } = renderHook(() => useDeleteAppointment(), { wrapper: createWrapper() });

    await result.current.mutateAsync('1');

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', '1');
  });
});

