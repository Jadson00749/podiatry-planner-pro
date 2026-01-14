import { Edit2, Trash, Copy, Eye, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserTemplateCardProps {
  id: string;
  name: string;
  description: string | null;
  questionCount: number;
  isDefault: boolean;
  updatedAt: string;
  onPreview: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

export function UserTemplateCard({
  name,
  description,
  questionCount,
  isDefault,
  updatedAt,
  onPreview,
  onEdit,
  onDuplicate,
  onDelete,
  onSetDefault,
}: UserTemplateCardProps) {
  return (
    <Card className="p-5 hover:shadow-md transition-shadow border-2 hover:border-primary/20">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
            {isDefault && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Padrão
              </Badge>
            )}
          </div>
          
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {description}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{questionCount} {questionCount === 1 ? 'pergunta' : 'perguntas'}</span>
            <span>•</span>
            <span>
              Modificado {format(new Date(updatedAt), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreview}
          className="h-8 text-xs flex-1"
        >
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          Ver
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="h-8 text-xs flex-1"
        >
          <Edit2 className="w-3.5 h-3.5 mr-1.5" />
          Editar
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 px-3">
              ⋯
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicar
            </DropdownMenuItem>
            {!isDefault && (
              <DropdownMenuItem onClick={onSetDefault}>
                <Star className="w-4 h-4 mr-2" />
                Definir como padrão
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}

