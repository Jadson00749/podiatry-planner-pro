import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnamnesisTemplate, QuestionType } from '@/hooks/useAnamnesisTemplates';

interface TemplatePreviewModalProps {
  template: AnamnesisTemplate | null;
  isOpen: boolean;
  onClose: () => void;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  yes_no: 'Sim/Não',
  yes_no_details: 'Sim/Não com detalhes',
  multiple_choice: 'Múltipla escolha',
  text_short: 'Texto curto',
  text_long: 'Texto longo',
  number: 'Número',
  date: 'Data',
  section: 'Seção/Título',
};

export function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>{template.name}</span>
            {template.is_system_template && (
              <Badge variant="outline" className="text-xs ml-2">
                Template do Sistema
              </Badge>
            )}
          </DialogTitle>
          {template.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {template.description}
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {template.questions && template.questions.length > 0 ? (
              template.questions.map((question, index) => (
                <div
                  key={question.id}
                  className={`p-4 rounded-lg border ${
                    question.question_type === 'section'
                      ? 'bg-muted/50 border-primary/20'
                      : 'bg-background'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-medium text-muted-foreground shrink-0 mt-0.5">
                      {question.question_type === 'section' ? '📑' : `${index + 1}.`}
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className={`text-sm ${
                          question.question_type === 'section'
                            ? 'font-semibold text-lg'
                            : 'font-medium'
                        }`}>
                          {question.question_text}
                          {question.is_required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </p>
                      </div>
                      
                      {question.question_type !== 'section' && (
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {QUESTION_TYPE_LABELS[question.question_type]}
                          </Badge>
                          
                          {question.has_observations && (
                            <Badge variant="secondary" className="text-xs">
                              Com observações
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {question.options && question.options.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs text-muted-foreground mb-2">Opções:</p>
                          {question.options.map((option, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                              <span className="text-muted-foreground">{option}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Este template ainda não possui perguntas</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}









