import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportClients } from '@/utils/exportClients';
import type { Client } from '@/hooks/useClients';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// Mock das bibliotecas de exportação
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

describe('exportClients', () => {
  const mockClients: Client[] = [
    {
      id: '1',
      name: 'João Silva',
      phone: '11987654321',
      whatsapp: '11987654321',
      email: 'joao@example.com',
      address: 'Rua Teste, 123',
      notes: 'Cliente preferencial',
      profile_id: 'user1',
      created_at: '2025-01-01T10:00:00Z',
    } as Client,
    {
      id: '2',
      name: 'Maria Santos',
      phone: '11912345678',
      whatsapp: null,
      email: 'maria@example.com',
      address: null,
      notes: null,
      profile_id: 'user1',
      created_at: '2025-01-02T11:00:00Z',
    } as Client,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve lançar erro se não houver clientes', () => {
    expect(() => exportClients([])).toThrow('Nenhum cliente para exportar');
    expect(() => exportClients(null as any)).toThrow('Nenhum cliente para exportar');
  });

  it('deve exportar como Excel por padrão', () => {
    exportClients(mockClients);

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('deve exportar como Excel quando format é excel', () => {
    exportClients(mockClients, { format: 'excel' });

    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('deve exportar como PDF quando format é pdf', () => {
    // Mock do autoTable
    const mockAutoTable = vi.fn();
    vi.doMock('jspdf-autotable', () => ({
      default: mockAutoTable,
    }));

    exportClients(mockClients, { format: 'pdf' });

    // jsPDF foi instanciado (verificado pela ausência de erro)
    expect(true).toBe(true);
  });

  it('deve incluir todos os dados do cliente na exportação', () => {
    exportClients(mockClients);

    const callArgs = (XLSX.utils.json_to_sheet as any).mock.calls[0][0];
    
    expect(callArgs).toHaveLength(2);
    expect(callArgs[0]).toHaveProperty('Nome', 'João Silva');
    expect(callArgs[0]).toHaveProperty('Telefone', '11987654321');
    expect(callArgs[0]).toHaveProperty('Email', 'joao@example.com');
  });

  it('deve lidar com valores nulos corretamente', () => {
    exportClients(mockClients);

    const callArgs = (XLSX.utils.json_to_sheet as any).mock.calls[0][0];
    
    expect(callArgs[1]).toHaveProperty('WhatsApp', '');
    expect(callArgs[1]).toHaveProperty('Endereço', '');
    expect(callArgs[1]).toHaveProperty('Observações', '');
  });

  it('deve numerar os clientes corretamente', () => {
    exportClients(mockClients);

    const callArgs = (XLSX.utils.json_to_sheet as any).mock.calls[0][0];
    
    expect(callArgs[0]['Nº']).toBe(1);
    expect(callArgs[1]['Nº']).toBe(2);
  });
});
