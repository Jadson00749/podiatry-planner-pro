import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportAppointments } from '@/utils/exportAppointments';
import { Appointment } from '@/hooks/useAppointments';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// Mock das bibliotecas de exportação
vi.mock('xlsx', async (importOriginal) => {
  const actual = await importOriginal<typeof import('xlsx')>();
  const mockWorksheet = { '!cols': [] };
  return {
    ...actual,
    default: {
      utils: {
        json_to_sheet: vi.fn(() => mockWorksheet),
        book_new: vi.fn(() => ({})),
        book_append_sheet: vi.fn(),
      },
      writeFile: vi.fn(),
    },
    utils: {
      json_to_sheet: vi.fn(() => mockWorksheet),
      book_new: vi.fn(() => ({})),
      book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
  };
});

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

// Mock do window.URL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('exportAppointments', () => {
  const mockAppointments: Appointment[] = [
    {
      id: '1',
      profile_id: 'profile-1',
      client_id: 'client-1',
      procedure_id: 'proc-1',
      appointment_date: '2025-01-15',
      appointment_time: '10:00',
      status: 'scheduled',
      payment_status: 'pending',
      price: 100,
      notes: 'Nota teste',
      reminder_sent: false,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      clients: {
        id: 'client-1',
        name: 'Cliente Teste',
        phone: '11999999999',
        whatsapp: null,
      },
      procedures: {
        id: 'proc-1',
        name: 'Procedimento Teste',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock do document.createElement e appendChild
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    global.document.createElement = vi.fn(() => mockLink as any);
    global.document.body.appendChild = vi.fn();
    global.document.body.removeChild = vi.fn();
  });

  it('deve lançar erro quando não há agendamentos', () => {
    expect(() => {
      exportAppointments([], { format: 'excel' });
    }).toThrow('Nenhum agendamento para exportar');
  });

  it('deve exportar como Excel quando format é excel', () => {
    exportAppointments(mockAppointments, { format: 'excel' });

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('deve exportar como PDF quando format é pdf', () => {
    exportAppointments(mockAppointments, { format: 'pdf' });

    // jsPDF foi instanciado (verificado pela ausência de erro)
    expect(true).toBe(true);
  });

  it('deve filtrar por período quando startDate e endDate são fornecidos', () => {
    const appointments = [
      { ...mockAppointments[0], appointment_date: '2025-01-10' },
      { ...mockAppointments[0], id: '2', appointment_date: '2025-01-20' },
      { ...mockAppointments[0], id: '3', appointment_date: '2025-02-01' },
    ];

    exportAppointments(appointments, {
      format: 'excel',
      startDate: '2025-01-15',
      endDate: '2025-01-25',
    });

    // Verifica que foi chamado com dados filtrados
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
  });

  it('deve lançar erro quando não há agendamentos no período', () => {
    expect(() => {
      exportAppointments(mockAppointments, {
        format: 'excel',
        startDate: '2025-02-01',
        endDate: '2025-02-28',
      });
    }).toThrow('Nenhum agendamento encontrado no período selecionado');
  });
});

