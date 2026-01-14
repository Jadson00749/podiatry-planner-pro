import { Copy, Eye, Scissors, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const AREA_ICONS = {
  salon: { icon: '💇', color: 'bg-pink-500/10 text-pink-600 border-pink-200' },
  health: { icon: '🦶', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  beauty: { icon: '💅', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  fitness: { icon: '🏋️', color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  pet: { icon: '🐕', color: 'bg-green-500/10 text-green-600 border-green-200' },
  other: { icon: '💼', color: 'bg-gray-500/10 text-gray-600 border-gray-200' },
};

interface SystemTemplateCardProps {
  id: string;
  name: string;
  description: string | null;
  area: string | null;
  questionCount: number;
  onPreview: () => void;
  onCopy: () => void;
}

export function SystemTemplateCard({
  name,
  description,
  area,
  questionCount,
  onPreview,
  onCopy,
}: SystemTemplateCardProps) {
  const areaConfig = area ? AREA_ICONS[area as keyof typeof AREA_ICONS] : AREA_ICONS.other;

  return (
    <Card className="p-5 hover:shadow-md transition-shadow border-2">
      <div className="flex items-start gap-4">
        <div className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 border-2',
          areaConfig.color
        )}>
          {areaConfig.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
            <Badge variant="outline" className="shrink-0 text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Pronto
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {questionCount} {questionCount === 1 ? 'pergunta' : 'perguntas'}
            </span>
            
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPreview}
                className="h-8 text-xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Ver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onCopy}
                className="h-8 text-xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Usar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}



