import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  todayStats?: {
    total: number;
    completed: number;
    totalReceived: number;
    totalPending: number;
  };
  monthStats?: {
    total: number;
    completed: number;
    cancelled: number;
    totalReceived: number;
    totalPending: number;
  };
  totalClients?: number;
  profileName?: string;
}

interface ExportOptions {
  format: 'excel' | 'pdf';
  stats: DashboardStats;
}

export function exportDashboard(options: ExportOptions) {
  const { format: exportFormat, stats } = options;
  const currentDate = new Date();

  // Preparar dados para exportação
  const exportData = [
    {
      'Categoria': 'CONSULTAS HOJE',
      'Valor': stats.todayStats?.total || 0,
      'Detalhes': `${stats.todayStats?.completed || 0} concluídas`,
    },
    {
      'Categoria': 'TOTAL DE CLIENTES',
      'Valor': stats.totalClients || 0,
      'Detalhes': 'Cadastrados',
    },
    {
      'Categoria': 'RECEBIDO HOJE',
      'Valor': `R$ ${(stats.todayStats?.totalReceived || 0).toFixed(2).replace('.', ',')}`,
      'Detalhes': '',
    },
    {
      'Categoria': 'PENDENTE HOJE',
      'Valor': `R$ ${(stats.todayStats?.totalPending || 0).toFixed(2).replace('.', ',')}`,
      'Detalhes': 'Aguardando pagamento',
    },
    {
      'Categoria': 'CONSULTAS DO MÊS',
      'Valor': stats.monthStats?.total || 0,
      'Detalhes': `${stats.monthStats?.cancelled || 0} canceladas`,
    },
    {
      'Categoria': 'RECEBIDO NO MÊS',
      'Valor': `R$ ${(stats.monthStats?.totalReceived || 0).toFixed(2).replace('.', ',')}`,
      'Detalhes': '',
    },
    {
      'Categoria': 'PENDENTE NO MÊS',
      'Valor': `R$ ${(stats.monthStats?.totalPending || 0).toFixed(2).replace('.', ',')}`,
      'Detalhes': '',
    },
  ];

  // Criar workbook
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  // Ajustar largura das colunas
  const columnWidths = [
    { wch: 25 },  // Categoria
    { wch: 20 },  // Valor
    { wch: 30 },  // Detalhes
  ];
  worksheet['!cols'] = columnWidths;

  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dashboard');

  // Gerar nome do arquivo com data
  const fileName = `dashboard_${format(currentDate, 'dd-MM-yyyy_HH-mm', { locale: ptBR })}`;

  if (exportFormat === 'excel') {
    // Exportar como Excel (.xlsx)
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  } else {
    // Exportar como PDF
    const doc = new jsPDF('portrait', 'mm', 'a4');
    
    // Título
    doc.setFontSize(20);
    doc.setTextColor(20, 184, 166); // Cor primária
    doc.setFont(undefined, 'bold');
    doc.text('Relatório do Dashboard', 105, 20, { align: 'center' });
    
    // Data de exportação
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text(
      `Exportado em: ${format(currentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      105,
      27,
      { align: 'center' }
    );

    // Nome do profissional
    if (stats.profileName) {
      doc.text(
        `Profissional: ${stats.profileName}`,
        105,
        32,
        { align: 'center' }
      );
    }
    
    // Estatísticas do Dia
    doc.setFontSize(14);
    doc.setTextColor(20, 184, 166);
    doc.setFont(undefined, 'bold');
    doc.text('Estatísticas do Dia', 14, 45);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text(`Data: ${format(currentDate, "dd/MM/yyyy", { locale: ptBR })}`, 14, 50);
    
    const todayData = [
      ['Consultas Hoje', `${stats.todayStats?.total || 0} (${stats.todayStats?.completed || 0} concluídas)`],
      ['Recebido Hoje', `R$ ${(stats.todayStats?.totalReceived || 0).toFixed(2).replace('.', ',')}`],
      ['Pendente Hoje', `R$ ${(stats.todayStats?.totalPending || 0).toFixed(2).replace('.', ',')}`],
    ];

    autoTable(doc, {
      head: [['Métrica', 'Valor']],
      body: todayData,
      startY: 55,
      styles: { 
        fontSize: 9, 
        cellPadding: 3,
      },
      headStyles: { 
        fillColor: [20, 184, 166],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { top: 55, left: 14, right: 14 },
    });

    // Estatísticas do Mês
    const monthStartY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setTextColor(20, 184, 166);
    doc.setFont(undefined, 'bold');
    doc.text('Estatísticas do Mês', 14, monthStartY);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text(`Mês: ${format(currentDate, "MMMM yyyy", { locale: ptBR })}`, 14, monthStartY + 5);
    
    const monthData = [
      ['Consultas do Mês', `${stats.monthStats?.total || 0} (${stats.monthStats?.cancelled || 0} canceladas)`],
      ['Recebido no Mês', `R$ ${(stats.monthStats?.totalReceived || 0).toFixed(2).replace('.', ',')}`],
      ['Pendente no Mês', `R$ ${(stats.monthStats?.totalPending || 0).toFixed(2).replace('.', ',')}`],
    ];

    autoTable(doc, {
      head: [['Métrica', 'Valor']],
      body: monthData,
      startY: monthStartY + 10,
      styles: { 
        fontSize: 9, 
        cellPadding: 3,
      },
      headStyles: { 
        fillColor: [20, 184, 166],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      margin: { top: monthStartY + 10, left: 14, right: 14 },
    });

    // Total de Clientes
    const clientsY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setTextColor(20, 184, 166);
    doc.setFont(undefined, 'bold');
    doc.text('Total de Clientes', 14, clientsY);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    doc.text(`${stats.totalClients || 0} cliente(s) cadastrado(s)`, 14, clientsY + 7);

    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    const pageCount = doc.getNumberOfPages();
    doc.text(
      `Página 1 de ${pageCount} - AgendaPro`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );

    doc.save(`${fileName}.pdf`);
  }
}









