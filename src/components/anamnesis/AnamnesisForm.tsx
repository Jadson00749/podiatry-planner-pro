import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AnamnesisTemplate, TemplateQuestion } from '@/hooks/useAnamnesisTemplates';

interface AnamnesisFormProps {
  template: AnamnesisTemplate;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  isLoading?: boolean;
}

export function AnamnesisForm({ 
  template, 
  initialData = {}, 
  onSubmit,
  isLoading = false 
}: AnamnesisFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (questionId: string, value: any) => {
    setFormData(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    const requiredQuestions = template.questions?.filter(q => q.is_required) || [];
    const missingRequired = requiredQuestions.some(q => {
      const value = formData[q.id];
      return !value || (typeof value === 'string' && !value.trim());
    });

    if (missingRequired) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    onSubmit(formData);
  };

  const renderQuestion = (question: TemplateQuestion, index: number) => {
    const questionId = question.id;
    const value = formData[questionId];

    // Seção (título)
    if (question.question_type === 'section') {
      return (
        <div key={questionId} className="col-span-full pt-6 pb-2 border-b-2 border-primary/20">
          <h3 className="text-xl font-semibold text-foreground">{question.question_text}</h3>
        </div>
      );
    }

    return (
      <div key={questionId} className="space-y-2">
        <Label htmlFor={questionId} className="text-sm font-medium">
          {index + 1}. {question.question_text}
          {question.is_required && <span className="text-destructive ml-1">*</span>}
        </Label>

        {/* Sim/Não */}
        {question.question_type === 'yes_no' && (
          <RadioGroup
            value={value || ''}
            onValueChange={(val) => handleChange(questionId, val)}
          >
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sim" id={`${questionId}-sim`} />
                <Label htmlFor={`${questionId}-sim`} className="font-normal cursor-pointer">Sim</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="nao" id={`${questionId}-nao`} />
                <Label htmlFor={`${questionId}-nao`} className="font-normal cursor-pointer">Não</Label>
              </div>
            </div>
          </RadioGroup>
        )}

        {/* Sim/Não com Detalhes */}
        {question.question_type === 'yes_no_details' && (
          <div className="space-y-2">
            <RadioGroup
              value={formData[questionId]?.answer || ''}
              onValueChange={(val) => 
                handleChange(questionId, { ...formData[questionId], answer: val })
              }
            >
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sim" id={`${questionId}-sim`} />
                  <Label htmlFor={`${questionId}-sim`} className="font-normal cursor-pointer">Sim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nao" id={`${questionId}-nao`} />
                  <Label htmlFor={`${questionId}-nao`} className="font-normal cursor-pointer">Não</Label>
                </div>
              </div>
            </RadioGroup>
            
            {formData[questionId]?.answer === 'sim' && (
              <Textarea
                placeholder="Detalhes..."
                value={formData[questionId]?.details || ''}
                onChange={(e) =>
                  handleChange(questionId, { 
                    ...formData[questionId], 
                    details: e.target.value 
                  })
                }
                className="mt-2"
              />
            )}
          </div>
        )}

        {/* Texto Curto */}
        {question.question_type === 'text_short' && (
          <Input
            id={questionId}
            value={value || ''}
            onChange={(e) => handleChange(questionId, e.target.value)}
            placeholder="Digite sua resposta..."
          />
        )}

        {/* Texto Longo */}
        {question.question_type === 'text_long' && (
          <Textarea
            id={questionId}
            value={value || ''}
            onChange={(e) => handleChange(questionId, e.target.value)}
            placeholder="Digite sua resposta..."
            className="min-h-[100px]"
          />
        )}

        {/* Múltipla Escolha */}
        {question.question_type === 'multiple_choice' && (
          <Select
            value={value || ''}
            onValueChange={(val) => handleChange(questionId, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma opção..." />
            </SelectTrigger>
            <SelectContent>
              {(question.options || []).map((option, i) => (
                <SelectItem key={i} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Número */}
        {question.question_type === 'number' && (
          <Input
            id={questionId}
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(questionId, e.target.value)}
            placeholder="Digite um número..."
          />
        )}

        {/* Data */}
        {question.question_type === 'date' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !value && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione uma data'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => handleChange(questionId, date?.toISOString())}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Campo de Observações Adicional */}
        {question.has_observations && question.question_type !== 'yes_no_details' && (
          <Textarea
            placeholder="Observações adicionais..."
            value={formData[`${questionId}_obs`] || ''}
            onChange={(e) => handleChange(`${questionId}_obs`, e.target.value)}
            className="mt-2"
          />
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {template.questions?.map((question, index) => 
          renderQuestion(question, index)
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar Anamnese'}
        </Button>
      </div>
    </form>
  );
}

