import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Client } from '@/hooks/useClients';
import { AnamnesisTemplate, TemplateQuestion } from '@/hooks/useAnamnesisTemplates';

interface ExportAnamnesisOptions {
  client: Client;
  template: AnamnesisTemplate;
  answers: Record<string, any>;
  clinicName?: string;
  lastUpdate?: string;
}

export function exportAnamnesisToPDF(options: ExportAnamnesisOptions) {
  const { client, template, answers, clinicName = 'AgendaPro', lastUpdate } = options;

  if (!client || !template) {
    throw new Error('Cliente ou template não encontrado');
  }

  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.width;
  
  // ==================== CABEÇALHO ====================
  // Nome da Clínica
  doc.setFontSize(16);
  doc.setTextColor(20, 184, 166);
  doc.setFont(undefined, 'bold');
  doc.text(clinicName, pageWidth / 2, 15, { align: 'center' });
  
  // Título do documento
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text('FICHA DE ANAMNESE', pageWidth / 2, 25, { align: 'center' });
  
  // Linha decorativa
  doc.setDrawColor(20, 184, 166);
  doc.setLineWidth(0.5);
  doc.line(14, 28, pageWidth - 14, 28);
  
  let currentY = 35;

  // ==================== DADOS DO CLIENTE ====================
  doc.setFontSize(12);
  doc.setTextColor(20, 184, 166);
  doc.setFont(undefined, 'bold');
  doc.text('Dados do Paciente', 14, currentY);
  currentY += 7;

  const clientTableData = [
    ['Nome Completo', client.name || '-'],
    ['Telefone', client.phone || '-'],
    ['WhatsApp', client.whatsapp || '-'],
    ['Email', client.email || '-'],
    ['Data de Cadastro', client.created_at 
      ? format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR }) 
      : '-'
    ],
  ];

  autoTable(doc, {
    body: clientTableData,
    startY: currentY,
    styles: { 
      fontSize: 10, 
      cellPadding: 3,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { 
        cellWidth: 45, 
        fontStyle: 'bold', 
        fillColor: [245, 245, 245],
        textColor: [60, 60, 60],
      },
      1: { 
        cellWidth: 'auto',
        textColor: [0, 0, 0],
      },
    },
    margin: { left: 14, right: 14 },
    theme: 'plain',
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // ==================== NOME DO TEMPLATE ====================
  doc.setFontSize(12);
  doc.setTextColor(20, 184, 166);
  doc.setFont(undefined, 'bold');
  doc.text(`Template: ${template.name}`, 14, currentY);
  
  if (lastUpdate) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text(
      `Última atualização: ${format(new Date(lastUpdate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      14,
      currentY + 5
    );
    currentY += 10;
  } else {
    currentY += 7;
  }

  // Linha separadora
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 8;

  // ==================== PERGUNTAS E RESPOSTAS ====================
  doc.setFontSize(12);
  doc.setTextColor(20, 184, 166);
  doc.setFont(undefined, 'bold');
  doc.text('Respostas da Anamnese', 14, currentY);
  currentY += 8;

  // Processar cada pergunta
  let questionNumber = 0;
  const anamnesisData: string[][] = [];

  template.questions?.forEach((question: TemplateQuestion) => {
    const answer = answers[question.id];
    
    // Seções são títulos, não perguntas numeradas
    if (question.question_type === 'section') {
      // Se há dados acumulados, renderizar a tabela antes da seção
      if (anamnesisData.length > 0) {
        // Verificar se precisa de nova página
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        autoTable(doc, {
          body: anamnesisData,
          startY: currentY,
          styles: { 
            fontSize: 9.5, 
            cellPadding: 3,
            overflow: 'linebreak',
          },
          columnStyles: {
            0: { 
              cellWidth: 80, 
              fontStyle: 'bold',
              textColor: [60, 60, 60],
            },
            1: { 
              cellWidth: 'auto',
              textColor: [0, 0, 0],
            },
          },
          margin: { left: 14, right: 14 },
          theme: 'striped',
          alternateRowStyles: { fillColor: [250, 250, 250] },
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
        anamnesisData.length = 0; // Limpar array
      }

      // Verificar se precisa de nova página para a seção
      if (currentY > 260) {
        doc.addPage();
        currentY = 20;
      }

      // Renderizar título da seção
      doc.setFontSize(11);
      doc.setTextColor(20, 184, 166);
      doc.setFont(undefined, 'bold');
      doc.text(question.question_text, 14, currentY);
      
      // Linha sob o título da seção
      doc.setDrawColor(20, 184, 166);
      doc.setLineWidth(0.3);
      doc.line(14, currentY + 1, pageWidth - 14, currentY + 1);
      
      currentY += 8;
      questionNumber = 0; // Reiniciar numeração dentro da seção
      return;
    }

    // Incrementar número da pergunta
    questionNumber++;
    
    // Formatar a resposta baseado no tipo
    let formattedAnswer = 'Não informado';
    
    if (answer !== undefined && answer !== null && answer !== '') {
      if (typeof answer === 'object') {
        // Perguntas tipo yes_no com detalhes
        formattedAnswer = `${answer.answer}`;
        if (answer.details) {
          formattedAnswer += ` - ${answer.details}`;
        }
      } else if (typeof answer === 'boolean') {
        formattedAnswer = answer ? 'Sim' : 'Não';
      } else {
        formattedAnswer = String(answer);
      }
    }

    // Adicionar à lista de dados
    const questionText = `${questionNumber}. ${question.question_text}${question.is_required ? ' *' : ''}`;
    anamnesisData.push([questionText, formattedAnswer]);
  });

  // Renderizar tabela restante (se houver)
  if (anamnesisData.length > 0) {
    // Verificar se precisa de nova página
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    autoTable(doc, {
      body: anamnesisData,
      startY: currentY,
      styles: { 
        fontSize: 9.5, 
        cellPadding: 3,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { 
          cellWidth: 80, 
          fontStyle: 'bold',
          textColor: [60, 60, 60],
        },
        1: { 
          cellWidth: 'auto',
          textColor: [0, 0, 0],
        },
      },
      margin: { left: 14, right: 14 },
      theme: 'striped',
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });
  }

  // ==================== RODAPÉ ====================
  const pageCount = doc.getNumberOfPages();
  const today = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Linha superior do rodapé
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, doc.internal.pageSize.height - 20, pageWidth - 14, doc.internal.pageSize.height - 20);
    
    // Texto do rodapé
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    
    // Data de emissão (esquerda)
    doc.text(`Emitido em: ${today}`, 14, doc.internal.pageSize.height - 15);
    
    // Nome da clínica (centro)
    doc.text(clinicName, pageWidth / 2, doc.internal.pageSize.height - 15, { align: 'center' });
    
    // Número da página (direita)
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - 14,
      doc.internal.pageSize.height - 15,
      { align: 'right' }
    );
    
    // Linha de assinatura (apenas na última página)
    if (i === pageCount) {
      const signatureY = doc.internal.pageSize.height - 35;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(pageWidth / 2 - 40, signatureY, pageWidth / 2 + 40, signatureY);
      
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text('Assinatura do Paciente', pageWidth / 2, signatureY + 5, { align: 'center' });
    }
  }

  // ==================== SALVAR ARQUIVO ====================
  const fileName = `anamnese_${client.name?.replace(/\s+/g, '_') || 'paciente'}_${format(new Date(), 'dd-MM-yyyy_HH-mm', { locale: ptBR })}.pdf`;
  doc.save(fileName);
}







