import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PeriodDates {
  start: string;
  end: string;
  startDate: Date;
  endDate: Date;
}

interface ExportOptions {
  format: 'excel' | 'pdf';
  periodDates: PeriodDates;
  periodLabel: string;
}

// 3.1. Exportação Relatório por Procedimento
export function exportProcedureReport(
  data: Array<{ name: string; count: number; total: number; average: number; percentage: number }>,
  options: ExportOptions
) {
  if (!data || data.length === 0) {
    throw new Error('Nenhum dado para exportar');
  }

  const exportData = data.map((item, index) => ({
    'Nº': index + 1,
    'Procedimento': item.name,
    'Quantidade': item.count,
    'Faturamento': `R$ ${item.total.toFixed(2).replace('.', ',')}`,
    'Ticket Médio': `R$ ${item.average.toFixed(2).replace('.', ',')}`,
    '% do Total': `${item.percentage.toFixed(2)}%`,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 5 },   // Nº
    { wch: 35 },  // Procedimento
    { wch: 12 },  // Quantidade
    { wch: 15 },  // Faturamento
    { wch: 15 },  // Ticket Médio
    { wch: 12 },  // % do Total
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Procedimentos');

  const fileName = `relatorio_procedimentos_${format(new Date(), 'dd-MM-yyyy_HH-mm', { locale: ptBR })}`;

  if (options.format === 'excel') {
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } else {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.setTextColor(20, 184, 166);
    doc.setFont(undefined, 'bold');
    doc.text('Relatório por Procedimento', 105, 15, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text(`Período: ${options.periodLabel}`, 105, 22, { align: 'center' });
    doc.text(
      `Exportado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      105,
      27,
      { align: 'center' }
    );

    const tableData = data.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.count.toString(),
      `R$ ${item.total.toFixed(2).replace('.', ',')}`,
      `R$ ${item.average.toFixed(2).replace('.', ',')}`,
      `${item.percentage.toFixed(2)}%`,
    ]);

    autoTable(doc, {
      head: [['Nº', 'Procedimento', 'Quantidade', 'Faturamento', 'Ticket Médio', '% do Total']],
      body: tableData,
      startY: 33,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { top: 33, left: 14, right: 14 },
    });

    doc.save(`${fileName}.pdf`);
  }
}

// 3.2. Exportação Relatório de Clientes Mais Frequentes
export function exportClientFrequencyReport(
  data: Array<{ name: string; count: number; total: number; average: number; lastAppointment: string | null }>,
  options: ExportOptions
) {
  if (!data || data.length === 0) {
    throw new Error('Nenhum dado para exportar');
  }

  const exportData = data.map((item, index) => ({
    'Nº': index + 1,
    'Cliente': item.name,
    'Consultas': item.count,
    'Total Gasto': `R$ ${item.total.toFixed(2).replace('.', ',')}`,
    'Ticket Médio': `R$ ${item.average.toFixed(2).replace('.', ',')}`,
    'Última Consulta': item.lastAppointment 
      ? format(new Date(item.lastAppointment + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })
      : '-',
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 5 },   // Nº
    { wch: 30 },  // Cliente
    { wch: 12 },  // Consultas
    { wch: 15 },  // Total Gasto
    { wch: 15 },  // Ticket Médio
    { wch: 15 },  // Última Consulta
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes Frequentes');

  const fileName = `relatorio_clientes_frequentes_${format(new Date(), 'dd-MM-yyyy_HH-mm', { locale: ptBR })}`;

  if (options.format === 'excel') {
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } else {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.setTextColor(20, 184, 166);
    doc.setFont(undefined, 'bold');
    doc.text('Relatório de Clientes Mais Frequentes', 105, 15, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text(`Período: ${options.periodLabel}`, 105, 22, { align: 'center' });
    doc.text(
      `Exportado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      105,
      27,
      { align: 'center' }
    );

    const tableData = data.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.count.toString(),
      `R$ ${item.total.toFixed(2).replace('.', ',')}`,
      `R$ ${item.average.toFixed(2).replace('.', ',')}`,
      item.lastAppointment 
        ? format(new Date(item.lastAppointment + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })
        : '-',
    ]);

    autoTable(doc, {
      head: [['Nº', 'Cliente', 'Consultas', 'Total Gasto', 'Ticket Médio', 'Última Consulta']],
      body: tableData,
      startY: 33,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { top: 33, left: 14, right: 14 },
    });

    doc.save(`${fileName}.pdf`);
  }
}

// 3.3. Exportação Relatório de Horários Mais Ocupados
export function exportScheduleReport(
  data: { byTime: Array<{ time: string; count: number; percentage: number }>; byDay: Array<{ day: number; dayName: string; count: number; percentage: number }> },
  options: ExportOptions
) {
  if (!data || (data.byTime.length === 0 && data.byDay.length === 0)) {
    throw new Error('Nenhum dado para exportar');
  }

  const workbook = XLSX.utils.book_new();

  // Worksheet 1: Por Horário
  if (data.byTime.length > 0) {
    const timeData = data.byTime.map((item, index) => ({
      'Nº': index + 1,
      'Horário': item.time,
      'Agendamentos': item.count,
      '% Ocupação': `${item.percentage.toFixed(2)}%`,
    }));

    const timeWorksheet = XLSX.utils.json_to_sheet(timeData);
    timeWorksheet['!cols'] = [
      { wch: 5 },   // Nº
      { wch: 12 },  // Horário
      { wch: 15 },  // Agendamentos
      { wch: 15 },  // % Ocupação
    ];
    XLSX.utils.book_append_sheet(workbook, timeWorksheet, 'Por Horário');
  }

  // Worksheet 2: Por Dia da Semana
  if (data.byDay.length > 0) {
    const dayData = data.byDay.map((item, index) => ({
      'Nº': index + 1,
      'Dia': item.dayName,
      'Agendamentos': item.count,
      '% Ocupação': `${item.percentage.toFixed(2)}%`,
    }));

    const dayWorksheet = XLSX.utils.json_to_sheet(dayData);
    dayWorksheet['!cols'] = [
      { wch: 5 },   // Nº
      { wch: 20 },  // Dia
      { wch: 15 },  // Agendamentos
      { wch: 15 },  // % Ocupação
    ];
    XLSX.utils.book_append_sheet(workbook, dayWorksheet, 'Por Dia da Semana');
  }

  const fileName = `relatorio_horarios_${format(new Date(), 'dd-MM-yyyy_HH-mm', { locale: ptBR })}`;

  if (options.format === 'excel') {
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } else {
    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    doc.setFontSize(18);
    doc.setTextColor(20, 184, 166);
    doc.setFont(undefined, 'bold');
    doc.text('Relatório de Horários Mais Ocupados', 105, 15, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text(`Período: ${options.periodLabel}`, 105, 22, { align: 'center' });
    doc.text(
      `Exportado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      105,
      27,
      { align: 'center' }
    );

    let currentY = 35;

    // Por Horário
    if (data.byTime.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(20, 184, 166);
      doc.setFont(undefined, 'bold');
      doc.text('Por Horário', 14, currentY);
      currentY += 8;

      const timeTableData = data.byTime.map((item, index) => [
        (index + 1).toString(),
        item.time,
        item.count.toString(),
        `${item.percentage.toFixed(2)}%`,
      ]);

      autoTable(doc, {
        head: [['Nº', 'Horário', 'Agendamentos', '% Ocupação']],
        body: timeTableData,
        startY: currentY,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { top: currentY, left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Por Dia da Semana
    if (data.byDay.length > 0) {
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(20, 184, 166);
      doc.setFont(undefined, 'bold');
      doc.text('Por Dia da Semana', 14, currentY);
      currentY += 8;

      const dayTableData = data.byDay.map((item, index) => [
        (index + 1).toString(),
        item.dayName,
        item.count.toString(),
        `${item.percentage.toFixed(2)}%`,
      ]);

      autoTable(doc, {
        head: [['Nº', 'Dia', 'Agendamentos', '% Ocupação']],
        body: dayTableData,
        startY: currentY,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        margin: { top: currentY, left: 14, right: 14 },
      });
    }

    doc.save(`${fileName}.pdf`);
  }
}




