import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Client } from '@/hooks/useClients';
import { formatPhone } from '@/lib/phone';

interface ExportOptions {
  format: 'excel' | 'pdf';
  includeStats?: boolean;
}

export function exportClients(clients: Client[], options: ExportOptions = { format: 'excel' }) {
  if (!clients || clients.length === 0) {
    throw new Error('Nenhum cliente para exportar');
  }

  // Preparar dados para exportação
  const exportData = clients.map((client, index) => {
    const row: Record<string, any> = {
      'Nº': index + 1,
      'Nome': client.name || '',
      'Telefone': client.phone || '',
      'WhatsApp': client.whatsapp || '',
      'Email': client.email || '',
      'Endereço': client.address || '',
      'Observações': client.notes || '',
      'Data de Cadastro': client.created_at 
        ? format(new Date(client.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
        : '',
    };

    return row;
  });

  // Criar workbook
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  // Ajustar largura das colunas
  const columnWidths = [
    { wch: 5 },   // Nº
    { wch: 25 },  // Nome
    { wch: 15 },  // Telefone
    { wch: 15 },  // WhatsApp
    { wch: 30 },  // Email
    { wch: 40 },  // Endereço
    { wch: 50 },  // Observações
    { wch: 20 },  // Data de Cadastro
  ];
  worksheet['!cols'] = columnWidths;

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

  // Gerar nome do arquivo com data
  const fileName = `clientes_${format(new Date(), 'dd-MM-yyyy_HH-mm', { locale: ptBR })}`;

  if (options.format === 'excel') {
    // Exportar como Excel (.xlsx)
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } else {
    // Exportar como PDF - Layout landscape para caber mais colunas
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(20, 184, 166); // Cor primária
    doc.setFont(undefined, 'bold');
    doc.text('Lista de Clientes', 14, 15);
    
    // Data de exportação e total
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text(
      `Exportado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} | Total: ${clients.length} cliente(s)`,
      14,
      22
    );
    
    // Tabela completa
    const tableData = clients.map((client, index) => [
      (index + 1).toString(),
      client.name || '-',
      client.phone ? formatPhone(client.phone) : '-',
      client.whatsapp ? formatPhone(client.whatsapp) : '-',
      client.email || '-',
      client.address ? (client.address.length > 30 ? client.address.substring(0, 27) + '...' : client.address) : '-',
      client.notes ? (client.notes.length > 25 ? client.notes.substring(0, 22) + '...' : client.notes) : '-',
      client.created_at 
        ? format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })
        : '-',
    ]);

    // Calcula largura igual para todas as colunas (8 colunas)
    // Largura disponível: 297mm (A4 landscape) - 28mm (margens) = 269mm
    // Dividido por 8 colunas = ~33.6mm cada
    const equalWidth = (297 - 28) / 8; // ~33.6mm por coluna

    autoTable(doc, {
      head: [['Nº', 'Nome', 'Telefone', 'WhatsApp', 'Email', 'Endereço', 'Observações', 'Data']],
      body: tableData,
      startY: 28,
      styles: { 
        fontSize: 7, 
        cellPadding: 1.5,
        overflow: 'linebreak',
      },
      headStyles: { 
        fillColor: [20, 184, 166], // Cor primária (teal)
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { top: 28, left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: equalWidth * 0.6, halign: 'left', fontSize: 6.5 }, // Nº (menor, alinhado à esquerda)
        1: { cellWidth: equalWidth, halign: 'left' }, // Nome
        2: { cellWidth: equalWidth, halign: 'left' }, // Telefone
        3: { cellWidth: equalWidth, halign: 'left' }, // WhatsApp
        4: { cellWidth: equalWidth, halign: 'left' }, // Email
        5: { cellWidth: equalWidth, halign: 'left' }, // Endereço
        6: { cellWidth: equalWidth, halign: 'left' }, // Observações
        7: { cellWidth: equalWidth, halign: 'left' }, // Data
      },
      didDrawPage: (data) => {
        // Rodapé em cada página
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, 'normal');
        const pageCount = doc.getNumberOfPages();
        doc.text(
          `Página ${data.pageNumber} de ${pageCount} - Total: ${clients.length} cliente(s)`,
          14,
          doc.internal.pageSize.height - 10
        );
      },
    });

    doc.save(`${fileName}.pdf`);
  }
}

