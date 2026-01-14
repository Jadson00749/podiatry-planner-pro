import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/AppLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  useAnamnesisTemplate,
  useCreateAnamnesisTemplate,
  useUpdateAnamnesisTemplate,
  useAddTemplateQuestion,
  useUpdateTemplateQuestion,
  useDeleteTemplateQuestion,
  useReorderTemplateQuestions,
  QuestionType,
} from '@/hooks/useAnamnesisTemplates';
import { QuestionEditorItem, QuestionFormData } from '@/components/anamnesis/QuestionEditorItem';
import { TemplatePreviewModal } from '@/components/anamnesis/TemplatePreviewModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableQuestionItem({
  question,
  index,
  onUpdate,
  onDelete,
}: {
  question: QuestionFormData;
  index: number;
  onUpdate: (index: number, data: Partial<QuestionFormData>) => void;
  onDelete: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id || `temp-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <QuestionEditorItem
        question={question}
        index={index}
        onUpdate={onUpdate}
        onDelete={onDelete}
        isDragging={isDragging}
        dragListeners={listeners}
      />
    </div>
  );
}

export default function TemplateEditor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('id');
  const isEditing = !!templateId;

  const { data: template, isLoading } = useAnamnesisTemplate(templateId);
  const createTemplate = useCreateAnamnesisTemplate();
  const updateTemplate = useUpdateAnamnesisTemplate();
  const addQuestion = useAddTemplateQuestion();
  const updateQuestion = useUpdateTemplateQuestion();
  const deleteQuestion = useDeleteTemplateQuestion();
  const reorderQuestions = useReorderTemplateQuestions();

  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load template data
  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      setTemplateDescription(template.description || '');
      setQuestions(
        template.questions?.map((q) => ({
          id: q.id,
          question_type: q.question_type,
          question_text: q.question_text,
          is_required: q.is_required,
          has_observations: q.has_observations,
          options: q.options || undefined,
        })) || []
      );
    }
  }, [template]);

  const handleAddQuestion = (type?: QuestionType) => {
    const newQuestion: QuestionFormData = {
      question_type: type || 'text_short',
      question_text: '',
      is_required: false,
      has_observations: false,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (index: number, data: Partial<QuestionFormData>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...data };
    setQuestions(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => (item.id || `temp-${items.indexOf(item)}`) === active.id);
        const newIndex = items.findIndex((item) => (item.id || `temp-${items.indexOf(item)}`) === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nome obrigatório',
        description: 'Por favor, dê um nome ao modelo',
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Adicione perguntas',
        description: 'O modelo precisa ter pelo menos uma pergunta',
      });
      return;
    }

    // Validar perguntas
    const emptyQuestions = questions.filter((q) => !q.question_text.trim());
    if (emptyQuestions.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Perguntas vazias',
        description: 'Todas as perguntas precisam ter texto',
      });
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing && templateId) {
        // Atualizar template existente
        await updateTemplate.mutateAsync({
          id: templateId,
          name: templateName,
          description: templateDescription,
        });

        // Deletar perguntas antigas em paralelo
        const existingQuestions = template?.questions || [];
        if (existingQuestions.length > 0) {
          await Promise.all(
            existingQuestions.map((q) =>
              deleteQuestion.mutateAsync({ id: q.id, template_id: templateId })
            )
          );
        }

        // Inserir novas perguntas em paralelo
        await Promise.all(
          questions.map((q, i) =>
            addQuestion.mutateAsync({
              template_id: templateId,
              question_order: i,
              question_type: q.question_type,
              question_text: q.question_text,
              is_required: q.is_required,
              has_observations: q.has_observations,
              options: q.options,
            })
          )
        );

        toast({
          title: 'Modelo atualizado!',
          description: 'Suas alterações foram salvas',
        });
      } else {
        // Criar novo template
        const newTemplate = await createTemplate.mutateAsync({
          name: templateName,
          description: templateDescription,
        });

        // Adicionar perguntas em paralelo
        await Promise.all(
          questions.map((q, i) =>
            addQuestion.mutateAsync({
              template_id: newTemplate.id,
              question_order: i,
              question_type: q.question_type,
              question_text: q.question_text,
              is_required: q.is_required,
              has_observations: q.has_observations,
              options: q.options,
            })
          )
        );

        toast({
          title: 'Modelo criado!',
          description: 'Seu modelo foi salvo com sucesso',
        });
      }

      navigate('/modelos-anamnese');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Tente novamente mais tarde',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const previewTemplate = {
    id: templateId || 'preview',
    profile_id: '',
    name: templateName || 'Visualização',
    description: templateDescription,
    is_default: false,
    is_system_template: false,
    area: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    questions: questions.map((q, i) => ({
      id: q.id || `temp-${i}`,
      template_id: templateId || 'preview',
      question_order: i,
      question_type: q.question_type,
      question_text: q.question_text,
      is_required: q.is_required,
      has_observations: q.has_observations,
      options: q.options || [],
      created_at: new Date().toISOString(),
    })),
  };

  return (
    <AppLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/modelos-anamnese')}
            className="-ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Voltar para Modelos</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {isEditing ? 'Editar Modelo' : 'Criar Modelo'}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Personalize as perguntas da sua ficha de anamnese
            </p>
          </div>
        </div>

      {/* Sticky Action Bar - Top */}
      <div className="sticky top-2 sm:top-4 z-50 bg-background border rounded-lg shadow-lg py-2.5 px-3 sm:py-3 sm:px-4">
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPreview(true)}
            className="text-xs sm:text-sm"
          >
            <Eye className="w-4 h-4 mr-1.5 sm:mr-2" />
            Visualizar
          </Button>
          <Button 
            size="sm"
            onClick={handleSave} 
            disabled={isSaving}
            className="text-xs sm:text-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 sm:mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5 sm:mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Template Info */}
      <div className="space-y-3 sm:space-y-4 p-4 sm:p-6 rounded-xl border bg-card">
        <div>
          <Label htmlFor="name" className="text-sm">Nome do Modelo *</Label>
          <Input
            id="name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Ex: Avaliação Inicial, Primeira Consulta..."
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-sm">Descrição (opcional)</Label>
          <Textarea
            id="description"
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            placeholder="Breve descrição sobre quando usar este modelo..."
            className="mt-1.5 min-h-[60px] sm:min-h-[80px] text-sm"
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Perguntas</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Arraste para reordenar
            </p>
          </div>
          <Button 
            onClick={() => handleAddQuestion()} 
            variant="outline" 
            size="sm"
            className="w-full sm:w-auto text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Pergunta
          </Button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-xl bg-muted/30">
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
              Nenhuma pergunta adicionada ainda
            </p>
            <Button 
              onClick={() => handleAddQuestion()} 
              variant="outline"
              size="sm"
              className="text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar primeira pergunta
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((q, i) => q.id || `temp-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2.5 sm:space-y-3">
                {questions.map((question, index) => (
                  <SortableQuestionItem
                    key={question.id || `temp-${index}`}
                    question={question}
                    index={index}
                    onUpdate={handleUpdateQuestion}
                    onDelete={handleDeleteQuestion}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
      </div>
    </AppLayout>
  );
}

