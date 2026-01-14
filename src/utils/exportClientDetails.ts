import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment } from '@/hooks/useAppointments';
import { Client } from '@/hooks/useClients';
import { formatPhone } from '@/lib/phone';

interface Anamnesis {
  main_complaint?: string;
  problem_history?: string;
  has_diabetes?: boolean;
  has_circulatory_problems?: boolean;
  has_hypertension?: boolean;
  uses_continuous_medication?: boolean;
  has_allergies?: boolean;
  is_pregnant?: boolean;
  skin_type?: string;
  sensitivity?: string;
  nail_condition?: string;
  calluses_fissures?: string;
  clinical_observations?: string;
}

interface ExportOptions {
  format: 'excel' | 'pdf';
  client: Client;
  appointments: Appointment[];
  anamnesis?: Anamnesis | null;
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

export function exportClientDetails(options: ExportOptions) {
  const { format: exportFormat, client, appointments, anamnesis } = options;

  if (!client) {
    throw new Error('Cliente não encontrado');
  }

  // Preparar dados do cliente
  const clientData = [
    { 'Campo': 'Nome', 'Valor': client.name || '' },
    { 'Campo': 'Telefone', 'Valor': client.phone ? formatPhone(client.phone) : '' },
    { 'Campo': 'WhatsApp', 'Valor': client.whatsapp ? formatPhone(client.whatsapp) : '' },
    { 'Campo': 'Email', 'Valor': client.email || '' },
    { 'Campo': 'Endereço', 'Valor': client.address || '' },
    { 'Campo': 'Observações', 'Valor': client.notes || '' },
    { 'Campo': 'Data de Cadastro', 'Valor': client.created_at ? format(new Date(client.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '' },
  ];

  // Preparar dados dos agendamentos
  const appointmentsData = appointments.map((appointment, index) => ({
    'Nº': index + 1,
    'Data': appointment.appointment_date 
      ? format(new Date(appointment.appointment_date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })
      : '',
    'Horário': appointment.appointment_time ? appointment.appointment_time.slice(0, 5) : '',
    'Procedimento': appointment.procedures?.name || '',
    'Valor': appointment.price ? `R$ ${appointment.price.toFixed(2).replace('.', ',')}` : 'R$ 0,00',
    'Status': statusLabels[appointment.status] || appointment.status,
    'Pagamento': paymentLabels[appointment.payment_status] || appointment.payment_status,
    'Observações': appointment.notes || '',
  }));

  // Calcular totais
  const totalAppointments = appointments.length;
  const totalSpent = appointments.reduce((sum, apt) => sum + (Number(apt.price) || 0), 0);
  const totalPaid = appointments
    .filter(a => a.payment_status === 'paid')
    .reduce((sum, apt) => sum + (Number(apt.price) || 0), 0);
  const totalPending = appointments
    .filter(a => a.payment_status === 'pending' || a.payment_status === 'partial')
    .reduce((sum, apt) => sum + (Number(apt.price) || 0), 0);

  // Criar workbook
  const workbook = XLSX.utils.book_new();

  // Worksheet 1: Dados do Cliente
  const clientWorksheet = XLSX.utils.json_to_sheet(clientData);
  clientWorksheet['!cols'] = [
    { wch: 20 },  // Campo
    { wch: 50 },  // Valor
  ];
  XLSX.utils.book_append_sheet(workbook, clientWorksheet, 'Dados do Cliente');

  // Worksheet 2: Agendamentos
  if (appointmentsData.length > 0) {
    const appointmentsWorksheet = XLSX.utils.json_to_sheet(appointmentsData);
    appointmentsWorksheet['!cols'] = [
      { wch: 5 },   // Nº
      { wch: 12 },  // Data
      { wch: 10 },  // Horário
      { wch: 30 },  // Procedimento
      { wch: 12 },  // Valor
      { wch: 12 },  // Status
      { wch: 12 },  // Pagamento
      { wch: 50 },  // Observações
    ];
    XLSX.utils.book_append_sheet(workbook, appointmentsWorksheet, 'Agendamentos');
  }

  // Worksheet 3: Anamnese (se existir)
  if (anamnesis) {
    const anamnesisData = [
      { 'Campo': 'Queixa Principal', 'Valor': anamnesis.main_complaint || '' },
      { 'Campo': 'Histórico do Problema', 'Valor': anamnesis.problem_history || '' },
      { 'Campo': 'Tem Diabetes', 'Valor': anamnesis.has_diabetes ? 'Sim' : 'Não' },
      { 'Campo': 'Problemas Circulatórios', 'Valor': anamnesis.has_circulatory_problems ? 'Sim' : 'Não' },
      { 'Campo': 'Hipertensão', 'Valor': anamnesis.has_hypertension ? 'Sim' : 'Não' },
      { 'Campo': 'Medicação Contínua', 'Valor': anamnesis.uses_continuous_medication ? 'Sim' : 'Não' },
      { 'Campo': 'Alergias', 'Valor': anamnesis.has_allergies ? 'Sim' : 'Não' },
      { 'Campo': 'Gestante', 'Valor': anamnesis.is_pregnant ? 'Sim' : 'Não' },
      { 'Campo': 'Tipo de Pele', 'Valor': anamnesis.skin_type || '' },
      { 'Campo': 'Sensibilidade', 'Valor': anamnesis.sensitivity || '' },
      { 'Campo': 'Condição das Unhas', 'Valor': anamnesis.nail_condition || '' },
      { 'Campo': 'Calos/Fissuras', 'Valor': anamnesis.calluses_fissures || '' },
      { 'Campo': 'Observações Clínicas', 'Valor': anamnesis.clinical_observations || '' },
    ];
    const anamnesisWorksheet = XLSX.utils.json_to_sheet(anamnesisData);
    anamnesisWorksheet['!cols'] = [
      { wch: 25 },  // Campo
      { wch: 50 },  // Valor
    ];
    XLSX.utils.book_append_sheet(workbook, anamnesisWorksheet, 'Anamnese');
  }

  // Gerar nome do arquivo
  const fileName = `cliente_${client.name?.replace(/\s+/g, '_') || 'sem_nome'}_${format(new Date(), 'dd-MM-yyyy_HH-mm', { locale: ptBR })}`;

  if (exportFormat === 'excel') {
    // Exportar como Excel (.xlsx)
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } else {
    // Exportar como PDF
    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(20, 184, 166);
    doc.setFont(undefined, 'bold');
    doc.text('Histórico Completo do Cliente', 105, 15, { align: 'center' });
    
    // Data de exportação
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text(
      `Exportado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      105,
      21,
      { align: 'center' }
    );
    
    let currentY = 28;

    // Seção: Dados do Cliente
    doc.setFontSize(14);
    doc.setTextColor(20, 184, 184);
    doc.setFont(undefined, 'bold');
    doc.text('Dados do Cliente', 14, currentY);
    currentY += 8;

    const clientTableData = [
      ['Nome', client.name || '-'],
      ['Telefone', client.phone ? formatPhone(client.phone) : '-'],
      ['WhatsApp', client.whatsapp ? formatPhone(client.whatsapp) : '-'],
      ['Email', client.email || '-'],
      ['Endereço', client.address || '-'],
      ['Observações', client.notes || '-'],
      ['Data de Cadastro', client.created_at ? format(new Date(client.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '-'],
    ];

    autoTable(doc, {
      head: [['Campo', 'Valor']],
      body: clientTableData,
      startY: currentY,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { top: currentY, left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Seção: Resumo Financeiro
    doc.setFontSize(14);
    doc.setTextColor(20, 184, 166);
    doc.setFont(undefined, 'bold');
    doc.text('Resumo Financeiro', 14, currentY);
    currentY += 8;

    const financialData = [
      ['Total de Agendamentos', totalAppointments.toString()],
      ['Total Gasto', `R$ ${totalSpent.toFixed(2).replace('.', ',')}`],
      ['Total Pago', `R$ ${totalPaid.toFixed(2).replace('.', ',')}`],
      ['Total Pendente', `R$ ${totalPending.toFixed(2).replace('.', ',')}`],
    ];

    autoTable(doc, {
      head: [['Métrica', 'Valor']],
      body: financialData,
      startY: currentY,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { top: currentY, left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // Seção: Agendamentos
    if (appointments.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(20, 184, 166);
      doc.setFont(undefined, 'bold');
      doc.text('Histórico de Agendamentos', 14, currentY);
      currentY += 8;

      const appointmentsTableData = appointments.map((appointment, index) => [
        (index + 1).toString(),
        appointment.appointment_date 
          ? format(new Date(appointment.appointment_date + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })
          : '-',
        appointment.appointment_time ? appointment.appointment_time.slice(0, 5) : '-',
        appointment.procedures?.name || '-',
        appointment.price ? `R$ ${appointment.price.toFixed(2).replace('.', ',')}` : 'R$ 0,00',
        statusLabels[appointment.status] || appointment.status,
        paymentLabels[appointment.payment_status] || appointment.payment_status,
      ]);

      autoTable(doc, {
        head: [['Nº', 'Data', 'Horário', 'Procedimento', 'Valor', 'Status', 'Pagamento']],
        body: appointmentsTableData,
        startY: currentY,
        styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
        headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { top: currentY, left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 10, halign: 'left' },
          1: { cellWidth: 25, halign: 'left' },
          2: { cellWidth: 20, halign: 'left' },
          3: { cellWidth: 40, halign: 'left' },
          4: { cellWidth: 25, halign: 'left' },
          5: { cellWidth: 25, halign: 'left' },
          6: { cellWidth: 25, halign: 'left' },
        },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Seção: Anamnese (se existir)
    if (anamnesis) {
      // Verificar se precisa de nova página
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(20, 184, 166);
      doc.setFont(undefined, 'bold');
      doc.text('Anamnese do Paciente', 14, currentY);
      currentY += 8;

      const anamnesisTableData = [
        ['Queixa Principal', anamnesis.main_complaint || '-'],
        ['Histórico do Problema', anamnesis.problem_history || '-'],
        ['Tem Diabetes', anamnesis.has_diabetes ? 'Sim' : 'Não'],
        ['Problemas Circulatórios', anamnesis.has_circulatory_problems ? 'Sim' : 'Não'],
        ['Hipertensão', anamnesis.has_hypertension ? 'Sim' : 'Não'],
        ['Medicação Contínua', anamnesis.uses_continuous_medication ? 'Sim' : 'Não'],
        ['Alergias', anamnesis.has_allergies ? 'Sim' : 'Não'],
        ['Gestante', anamnesis.is_pregnant ? 'Sim' : 'Não'],
        ['Tipo de Pele', anamnesis.skin_type || '-'],
        ['Sensibilidade', anamnesis.sensitivity || '-'],
        ['Condição das Unhas', anamnesis.nail_condition || '-'],
        ['Calos/Fissuras', anamnesis.calluses_fissures || '-'],
        ['Observações Clínicas', anamnesis.clinical_observations || '-'],
      ];

      autoTable(doc, {
        head: [['Campo', 'Valor']],
        body: anamnesisTableData,
        startY: currentY,
        styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { top: currentY, left: 14, right: 14 },
      });
    }

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, 'normal');
      doc.text(
        `Página ${i} de ${pageCount} - AgendaPro`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`${fileName}.pdf`);
  }
}






