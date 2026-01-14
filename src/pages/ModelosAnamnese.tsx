import { useState } from 'react';
import { Plus, FileText, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { usePlan } from '@/hooks/usePlan';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import {
  useAnamnesisTemplates,
  useCreateAnamnesisTemplate,
  useDeleteAnamnesisTemplate,
  useUpdateAnamnesisTemplate,
  AnamnesisTemplate,
} from '@/hooks/useAnamnesisTemplates';
import { SystemTemplateCard } from '@/components/anamnesis/SystemTemplateCard';
import { UserTemplateCard } from '@/components/anamnesis/UserTemplateCard';
import { TemplatePreviewModal } from '@/components/anamnesis/TemplatePreviewModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ModelosAnamnese() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { canUseAnamnesis, canCreateAnamnesisTemplate, maxAnamnesisTemplates, plan, isTrial } = usePlan();
  const { data: templates, isLoading } = useAnamnesisTemplates();
  const createTemplate = useCreateAnamnesisTemplate();
  const deleteTemplate = useDeleteAnamnesisTemplate();
  const updateTemplate = useUpdateAnamnesisTemplate();

  const [previewTemplate, setPreviewTemplate] = useState<AnamnesisTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [createDialog, setCreateDialog] = useState<{
    isOpen: boolean;
    sourceTemplateId?: string;
  }>({ isOpen: false });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Separar templates do sistema e do usuário
  const systemTemplates = templates?.filter(t => t.is_system_template) || [];
  const userTemplates = templates?.filter(t => !t.is_system_template) || [];

  const handleCopyTemplate = (templateId: string) => {
    // Verificar limite de templates
    if (!canCreateAnamnesisTemplate(userTemplates.length)) {
      toast({
        variant: 'destructive',
        title: 'Limite atingido',
        description: maxAnamnesisTemplates === 0 
          ? 'Faça upgrade para o plano Profissional para criar templates personalizados'
          : `Você atingiu o limite de ${maxAnamnesisTemplates} templates do seu plano. Faça upgrade para criar mais!`,
      });
      return;
    }

    const template = templates?.find(t => t.id === templateId);
    if (!template) return;

    setFormData({
      name: `${template.name} (Cópia)`,
      description: template.description || '',
    });
    setCreateDialog({ isOpen: true, sourceTemplateId: templateId });
  };

  const handleCreateFromScratch = () => {
    // Verificar limite de templates
    if (!canCreateAnamnesisTemplate(userTemplates.length)) {
      toast({
        variant: 'destructive',
        title: 'Limite atingido',
        description: maxAnamnesisTemplates === 0 
          ? 'Faça upgrade para o plano Profissional para criar templates personalizados'
          : `Você atingiu o limite de ${maxAnamnesisTemplates} templates do seu plano. Faça upgrade para criar mais!`,
      });
      return;
    }

    setFormData({
      name: '',
      description: '',
    });
    setCreateDialog({ isOpen: true, sourceTemplateId: undefined });
  };

  const handleSubmitCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Nome obrigatório',
        description: 'Por favor, dê um nome ao modelo',
      });
      return;
    }

    try {
      await createTemplate.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        sourceTemplateId: createDialog.sourceTemplateId,
      });

      toast({
        title: 'Modelo criado!',
        description: 'Você pode começar a adicionar perguntas agora',
      });

      setCreateDialog({ isOpen: false });
      setFormData({ name: '', description: '' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar modelo',
        description: 'Tente novamente mais tarde',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast({
        title: 'Modelo excluído',
        description: 'O modelo foi removido com sucesso',
      });
      setDeleteConfirm(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir modelo',
        description: 'Tente novamente mais tarde',
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Primeiro, remover padrão de todos
      const promises = userTemplates
        .filter(t => t.is_default && t.id !== id)
        .map(t => updateTemplate.mutateAsync({ id: t.id, is_default: false }));
      
      await Promise.all(promises);

      // Definir o novo padrão
      await updateTemplate.mutateAsync({ id, is_default: true });

      toast({
        title: 'Modelo padrão definido',
        description: 'Este modelo será usado por padrão',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao definir padrão',
        description: 'Tente novamente mais tarde',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/configuracoes')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Configurações
          </Button>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Modelos de Anamnese</h1>
          </div>
          <p className="text-muted-foreground">
            Crie modelos de fichas de anamnese personalizados para seu negócio
          </p>
        </div>

      {/* Verificar acesso à feature */}
      {!canUseAnamnesis() && (
        <UpgradePrompt
          feature="Modelos de Anamnese"
          requiredPlan="professional"
        />
      )}

      {canUseAnamnesis() && (
        <>
      {/* Templates do Sistema */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Templates Prontos</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Comece com um modelo pronto e personalize para suas necessidades
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemTemplates.map(template => (
            <SystemTemplateCard
              key={template.id}
              id={template.id}
              name={template.name}
              description={template.description}
              area={template.area}
              questionCount={template.questions?.length || 0}
              onPreview={() => setPreviewTemplate(template)}
              onCopy={() => handleCopyTemplate(template.id)}
            />
          ))}
        </div>
      </div>

      {/* Templates do Usuário */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Meus Modelos</h2>
              {maxAnamnesisTemplates !== -1 && !isTrial && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {userTemplates.length}/{maxAnamnesisTemplates}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Modelos personalizados que você criou
            </p>
          </div>
          <Button onClick={handleCreateFromScratch} className="shrink-0 cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Criar do zero
          </Button>
        </div>

        {userTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTemplates.map(template => (
              <UserTemplateCard
                key={template.id}
                id={template.id}
                name={template.name}
                description={template.description}
                questionCount={template.questions?.length || 0}
                isDefault={template.is_default}
                updatedAt={template.updated_at}
                onPreview={() => setPreviewTemplate(template)}
                onEdit={() => navigate(`/template-editor?id=${template.id}`)}
                onDuplicate={() => handleCopyTemplate(template.id)}
                onDelete={() => setDeleteConfirm(template.id)}
                onSetDefault={() => handleSetDefault(template.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Você ainda não tem modelos personalizados
            </p>
            <Button onClick={handleCreateFromScratch} variant="outline" className="cursor-pointer">
              <Plus className="w-4 h-4 mr-2" />
              Criar meu primeiro modelo
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Preview */}
      <TemplatePreviewModal
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />

      {/* Dialog de Criar/Copiar */}
      <Dialog open={createDialog.isOpen} onOpenChange={(open) => setCreateDialog({ isOpen: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createDialog.sourceTemplateId ? 'Copiar Modelo' : 'Criar Novo Modelo'}
            </DialogTitle>
            <DialogDescription>
              {createDialog.sourceTemplateId
                ? 'O modelo será copiado com todas as perguntas. Você poderá editá-lo depois.'
                : 'Crie um modelo personalizado do zero'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Modelo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Primeira Consulta"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descrição do modelo..."
                className="mt-1 min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialog({ isOpen: false })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitCreate}
              disabled={createTemplate.isPending}
            >
              {createTemplate.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Modelo'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Modelo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este modelo? Esta ação não pode ser desfeita.
              As anamneses já preenchidas não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
      )}
      </div>
    </AppLayout>
  );
}

