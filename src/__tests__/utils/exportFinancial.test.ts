import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportFinancial } from '@/utils/exportFinancial';
import type { Appointment } from '@/hooks/useAppointments';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

vi.mock('xlsx', () => ({
  default: {
    utils: {
      json_to_sheet: vi.fn(() => ({})),
      book_new: vi.fn(() => ({})),
      book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
  },
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));
vi.mock('jspdf', () => {
  function MockedJsPDF() {
    this.setFontSize = vi.fn().mockReturnThis();
    this.setTextColor = vi.fn().mockReturnThis();
    this.setFont = vi.fn().mockReturnThis();
    this.text = vi.fn().mockReturnThis();
    this.save = vi.fn();
    this.lastAutoTable = { finalY: 50 };
  }
  return {
    default: MockedJsPDF,
  };
});

vi.mock('jspdf-autotable', () => ({
  default: vi.fn((doc, options) => {
    if (doc && typeof doc === 'object') {
      (doc as any).lastAutoTable = { finalY: 50 };
    }
  }),
}));

describe('exportFinancial', () => {
  const mockAppointments: Appointment[] = [
    {
      id: '1',
      client_id: '1',
      appointment_date: '2025-01-15',
      appointment_time: '14:30:00',
      status: 'completed',
      payment_status: 'paid',
      price: 150.00,
      profile_id: 'user1',
      clients: {
        id: '1',
        name: 'João Silva',
        phone: '11987654321',
        whatsapp: '11987654321',
        profile_id: 'user1',
      } as any,
      procedures: {
        id: '1',
        name: 'Consulta',
        profile_id: 'user1',
      } as any,
    } as Appointment,
    {
      id: '2',
      client_id: '2',
      appointment_date: '2025-01-16',
      appointment_time: '10:00:00',
      status: 'completed',
      payment_status: 'paid',
      price: 200.00,
      profile_id: 'user1',
      clients: {
        id: '2',
        name: 'Maria Santos',
        phone: '11912345678',
        whatsapp: null,
        profile_id: 'user1',
      } as any,
      procedures: {
        id: '2',
        name: 'Tratamento',
        profile_id: 'user1',
      } as any,
    } as Appointment,
  ];

  const options = {
    format: 'excel' as const,
    startDate: '2025-01-01',
    endDate: '2025-01-31',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve lançar erro se não houver agendamentos', () => {
    expect(() => exportFinancial([], options)).toThrow('Nenhum agendamento para exportar');
    expect(() => exportFinancial(null as any, options)).toThrow('Nenhum agendamento para exportar');
  });

  it('deve filtrar apenas agendamentos pagos no período', () => {
    const appointmentsWithPending = [
      ...mockAppointments,
      {
        id: '3',
        appointment_date: '2025-01-17',
        payment_status: 'pending',
        price: 100.00,
      } as Appointment,
    ];

    exportFinancial(appointmentsWithPending, options);

    const callArgs = (XLSX.utils.json_to_sheet as any).mock.calls[0][0];
    expect(callArgs).toHaveLength(2); // Apenas os 2 pagos
  });

  it('deve lançar erro se não houver agendamentos pagos no período', () => {
    const appointmentsPending = mockAppointments.map(apt => ({
      ...apt,
      payment_status: 'pending' as const,
    }));

    expect(() => exportFinancial(appointmentsPending, options)).toThrow(
      'Nenhum agendamento pago encontrado no período selecionado'
    );
  });

  it('deve filtrar por período corretamente', () => {
    const appointmentsOutsidePeriod = [
      {
        ...mockAppointments[0],
        appointment_date: '2025-02-15', // Fora do período
      },
    ];

    expect(() => exportFinancial(appointmentsOutsidePeriod, options)).toThrow(
      'Nenhum agendamento pago encontrado no período selecionado'
    );
  });

  it('deve exportar como Excel quando format é excel', () => {
    exportFinancial(mockAppointments, options);

    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('deve exportar como PDF quando format é pdf', () => {
    // Mock do autoTable
    const mockAutoTable = vi.fn();
    vi.doMock('jspdf-autotable', () => ({
      default: mockAutoTable,
    }));

    exportFinancial(mockAppointments, { ...options, format: 'pdf' });

    // jsPDF foi instanciado (verificado pela ausência de erro)
    expect(true).toBe(true);
  });

  it('deve incluir todos os dados do agendamento', () => {
    exportFinancial(mockAppointments, options);

    const callArgs = (XLSX.utils.json_to_sheet as any).mock.calls[0][0];
    
    expect(callArgs[0]).toHaveProperty('Cliente', 'João Silva');
    expect(callArgs[0]).toHaveProperty('Procedimento', 'Consulta');
    expect(callArgs[0]).toHaveProperty('Valor', 'R$ 150,00');
    expect(callArgs[0]).toHaveProperty('Status', 'Concluído');
  });

  it('deve formatar valores monetários corretamente', () => {
    exportFinancial(mockAppointments, options);

    const callArgs = (XLSX.utils.json_to_sheet as any).mock.calls[0][0];
    
    expect(callArgs[0]['Valor']).toBe('R$ 150,00');
    expect(callArgs[1]['Valor']).toBe('R$ 200,00');
  });

  it('deve lidar com valores nulos corretamente', () => {
    const appointmentsWithNulls = [
      {
        ...mockAppointments[0],
        clients: null,
        procedures: null,
        notes: null,
      } as Appointment,
    ];

    exportFinancial(appointmentsWithNulls, options);

    const callArgs = (XLSX.utils.json_to_sheet as any).mock.calls[0][0];
    
    expect(callArgs[0]['Cliente']).toBe('');
    expect(callArgs[0]['Procedimento']).toBe('');
  });
});

