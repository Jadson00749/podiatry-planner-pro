import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment } from '@/hooks/useAppointments';
import { formatPhone } from '@/lib/phone';

interface ExportOptions {
  format: 'excel' | 'pdf';
  startDate: string;
  endDate: string;
}

const statusLabels: Record<string, string> = {
  scheduled: 'Agendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};

const paymentLabels: Record<string, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  partial: 'Parcial',
};

export function exportFinancial(
  appointments: Appointment[], 
  options: ExportOptions
) {
  if (!appointments || appointments.length === 0) {
    throw new Error('Nenhum agendamento para exportar');
  }

  // Filtrar agendamentos do período e apenas os pagos (para relatório financeiro)
  const filteredAppointments = appointments.filter(apt => {
    if (!apt.appointment_date) return false;
    const aptDate = apt.appointment_date;
    return aptDate >= options.startDate && aptDate <= options.endDate && apt.payment_status === 'paid';
  });

  if (filteredAppointments.length === 0) {
    throw new Error('Nenhum agendamento pago encontrado no período selecionado');
  }

  // Calcular totais
  const totalReceived = filteredAppointments.reduce((sum, apt) => sum + (Number(apt.price) || 0), 0);
  const totalAppointments = filteredAppointments.length;

  // Preparar dados para exportação
  const exportData = filteredAppointments.map((appointment, index) => {
    const row: Record<string, any> = {
      'Nº': index + 1,
      'Data': appointment.appointment_date 
        ? format(new Date(appointment.appointment_date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })
        : '',
      'Horário': appointment.appointment_time ? appointment.appointment_time.slice(0, 5) : '',
      'Cliente': appointment.clients?.name || '',
      'Telefone': appointment.clients?.phone ? formatPhone(appointment.clients.phone) : '',
      'WhatsApp': appointment.clients?.whatsapp ? formatPhone(appointment.clients.whatsapp) : '',
      'Procedimento': appointment.procedures?.name || '',
      'Valor': appointment.price ? `R$ ${appointment.price.toFixed(2).replace('.', ',')}` : 'R$ 0,00',
      'Status': statusLabels[appointment.status] || appointment.status,
      'Observações': appointment.notes || '',
    };

    return row;
  });

  // Criar workbook
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  // Ajustar largura das colunas
  const columnWidths = [
    { wch: 5 },   // Nº
    { wch: 12 },  // Data
    { wch: 10 },  // Horário
    { wch: 25 },  // Cliente
    { wch: 15 },  // Telefone
    { wch: 15 },  // WhatsApp
    { wch: 30 },  // Procedimento
    { wch: 12 },  // Valor
    { wch: 12 },  // Status
    { wch: 50 },  // Observações
  ];
  worksheet['!cols'] = columnWidths;

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Receitas');

  // Gerar nome do arquivo com período
  const periodLabel = `${format(new Date(options.startDate), 'dd-MM-yyyy', { locale: ptBR })}_a_${format(new Date(options.endDate), 'dd-MM-yyyy', { locale: ptBR })}`;
  const fileName = `receitas_${periodLabel}`;

  if (options.format === 'excel') {
    // Exportar como Excel (.xlsx)
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } else {
    // Exportar como PDF
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(20, 184, 166); // Cor primária
    doc.setFont(undefined, 'bold');
    doc.text('Relatório Financeiro', 14, 15);
    
    // Período e totais
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text(
      `Período: ${format(new Date(options.startDate), "dd/MM/yyyy", { locale: ptBR })} a ${format(new Date(options.endDate), "dd/MM/yyyy", { locale: ptBR })}`,
      14,
      22
    );
    doc.setFont(undefined, 'bold');
    doc.setTextColor(20, 184, 166);
    doc.text(
      `Total Recebido: R$ ${totalReceived.toFixed(2).replace('.', ',')} | Total de Agendamentos: ${totalAppointments}`,
      14,
      27
    );
    
    // Tabela
    const tableData = filteredAppointments.map((appointment, index) => [
      (index + 1).toString(),
      appointment.appointment_date 
        ? format(new Date(appointment.appointment_date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })
        : '-',
      appointment.appointment_time ? appointment.appointment_time.slice(0, 5) : '-',
      appointment.clients?.name || '-',
      appointment.procedures?.name || '-',
      appointment.price ? `R$ ${appointment.price.toFixed(2).replace('.', ',')}` : 'R$ 0,00',
    ]);

    // Calcula largura igual para todas as colunas (6 colunas)
    const equalWidth = (297 - 28) / 6; // ~44.8mm por coluna

    autoTable(doc, {
      head: [['Nº', 'Data', 'Horário', 'Cliente', 'Procedimento', 'Valor']],
      body: tableData,
      startY: 33,
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
      margin: { top: 33, left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: equalWidth * 0.6, halign: 'left', fontSize: 6.5 }, // Nº
        1: { cellWidth: equalWidth, halign: 'left' }, // Data
        2: { cellWidth: equalWidth, halign: 'left' }, // Horário
        3: { cellWidth: equalWidth, halign: 'left' }, // Cliente
        4: { cellWidth: equalWidth, halign: 'left' }, // Procedimento
        5: { cellWidth: equalWidth, halign: 'left' }, // Valor
      },
      didDrawPage: (data) => {
        // Rodapé em cada página
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, 'normal');
        const pageCount = doc.getNumberOfPages();
        doc.text(
          `Página ${data.pageNumber} de ${pageCount} - Total: R$ ${totalReceived.toFixed(2).replace('.', ',')} (${totalAppointments} agendamento(s))`,
          14,
          doc.internal.pageSize.height - 10
        );
      },
    });

    doc.save(`${fileName}.pdf`);
  }
}








