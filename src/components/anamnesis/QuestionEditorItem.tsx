import { GripVertical, Trash, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { QuestionType } from '@/hooks/useAnamnesisTemplates';
import { useState } from 'react';

const QUESTION_TYPES: { value: QuestionType; label: string; description: string }[] = [
  { value: 'section', label: '📑 Seção/Título', description: 'Separador visual' },
  { value: 'yes_no', label: '✅ Sim/Não', description: 'Resposta binária' },
  { value: 'yes_no_details', label: '✅📝 Sim/Não + Detalhes', description: 'Com campo de observação' },
  { value: 'text_short', label: '📝 Texto Curto', description: 'Uma linha' },
  { value: 'text_long', label: '📄 Texto Longo', description: 'Várias linhas' },
  { value: 'multiple_choice', label: '☑️ Múltipla Escolha', description: 'Lista de opções' },
  { value: 'number', label: '🔢 Número', description: 'Valor numérico' },
  { value: 'date', label: '📅 Data', description: 'Seletor de data' },
];

export interface QuestionFormData {
  id?: string;
  question_type: QuestionType;
  question_text: string;
  is_required: boolean;
  has_observations: boolean;
  options?: string[];
}

interface QuestionEditorItemProps {
  question: QuestionFormData;
  index: number;
  onUpdate: (index: number, data: Partial<QuestionFormData>) => void;
  onDelete: (index: number) => void;
  isDragging?: boolean;
  dragListeners?: any;
}

export function QuestionEditorItem({
  question,
  index,
  onUpdate,
  onDelete,
  isDragging = false,
  dragListeners,
}: QuestionEditorItemProps) {
  const [newOption, setNewOption] = useState('');

  const handleAddOption = () => {
    if (!newOption.trim()) return;
    const currentOptions = question.options || [];
    onUpdate(index, { options: [...currentOptions, newOption.trim()] });
    setNewOption('');
  };

  const handleRemoveOption = (optionIndex: number) => {
    const currentOptions = question.options || [];
    onUpdate(index, {
      options: currentOptions.filter((_, i) => i !== optionIndex),
    });
  };

  const isSection = question.question_type === 'section';

  return (
    <div
      className={`p-3 sm:p-4 rounded-lg border-2 bg-card transition-all ${
        isDragging ? 'opacity-50 border-primary' : 'border-border'
      } ${isSection ? 'bg-muted/30 border-primary/20' : ''}`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Drag Handle */}
        <div 
          className="flex items-center gap-1.5 sm:gap-2 mt-2 cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 hover:bg-muted/50 rounded transition-colors"
          {...dragListeners}
        >
          <GripVertical className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">{index + 1}.</span>
        </div>

        {/* Question Content */}
        <div className="flex-1 space-y-3 sm:space-y-4">
          {/* Tipo de Pergunta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label className="text-xs">Tipo de Pergunta</Label>
              <Select
                value={question.question_type}
                onValueChange={(value) =>
                  onUpdate(index, { question_type: value as QuestionType })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Options for non-section */}
            {!isSection && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Checkbox
                    id={`required-${index}`}
                    checked={question.is_required}
                    onCheckedChange={(checked) =>
                      onUpdate(index, { is_required: checked as boolean })
                    }
                  />
                  <Label htmlFor={`required-${index}`} className="text-xs cursor-pointer">
                    Obrigatório
                  </Label>
                </div>

                {(question.question_type === 'yes_no' || question.question_type === 'yes_no_details') && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Checkbox
                      id={`observations-${index}`}
                      checked={question.has_observations}
                      onCheckedChange={(checked) =>
                        onUpdate(index, { has_observations: checked as boolean })
                      }
                    />
                    <Label htmlFor={`observations-${index}`} className="text-xs cursor-pointer">
                      Campo de observações
                    </Label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Texto da Pergunta / Título da Seção */}
          <div>
            <Label className="text-xs">
              {isSection ? 'Título da Seção' : 'Pergunta'} *
            </Label>
            {isSection ? (
              <Input
                value={question.question_text}
                onChange={(e) => onUpdate(index, { question_text: e.target.value })}
                placeholder="Ex: Dados Pessoais"
                className={`mt-1 font-semibold ${isSection ? 'text-lg' : ''}`}
              />
            ) : (
              <Textarea
                value={question.question_text}
                onChange={(e) => onUpdate(index, { question_text: e.target.value })}
                placeholder="Digite sua pergunta..."
                className="mt-1 min-h-[60px]"
              />
            )}
          </div>

          {/* Opções de Múltipla Escolha */}
          {question.question_type === 'multiple_choice' && (
            <div className="space-y-2">
              <Label className="text-xs">Opções</Label>
              <div className="space-y-2">
                {(question.options || []).map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <div className="flex-1 p-2 rounded border bg-muted/30 text-sm">
                      {option}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(optionIndex)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Nova opção..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(index)}
          className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

