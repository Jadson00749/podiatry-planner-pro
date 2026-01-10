import { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImageUpload } from '@/hooks/useImageUpload';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  folder: 'avatars' | 'logos';
  label?: string;
  description?: string;
  className?: string;
}

export function ImageUpload({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  folder,
  label,
  description,
  className,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isRemoving, setIsRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, deleteImage, uploading, error } = useImageUpload();

  // Sincronizar preview com currentImageUrl quando mudar
  useEffect(() => {
    if (currentImageUrl) {
      setPreview(currentImageUrl);
    } else {
      setPreview(null);
    }
  }, [currentImageUrl]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const url = await uploadImage(file, folder);
    if (url) {
      onImageUploaded(url);
    }

    // Reset input
    e.target.value = '';
  };

  const handleRemove = async () => {
    if (!currentImageUrl) {
      setPreview(null);
      onImageRemoved?.();
      return;
    }

    setIsRemoving(true);
    const success = await deleteImage(currentImageUrl);
    if (success) {
      setPreview(null);
      onImageRemoved?.();
    }
    setIsRemoving(false);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <div>
          <label className="text-sm font-medium text-foreground">{label}</label>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Preview da Imagem */}
        <div className="relative">
          {preview ? (
            <div className="relative group">
              <img
                src={preview}
                alt={label || 'Preview'}
                className={cn(
                  'rounded-lg border-2 border-border object-cover',
                  folder === 'avatars' ? 'w-24 h-24' : 'w-32 h-32'
                )}
              />
              {currentImageUrl && (
                <button
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
                  title="Remover imagem"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ) : (
            <div
              className={cn(
                'rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center',
                folder === 'avatars' ? 'w-24 h-24' : 'w-32 h-32'
              )}
            >
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col gap-2 flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Enviando...' : preview ? 'Trocar Imagem' : 'Escolher Imagem'}
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isRemoving || uploading}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
              {isRemoving ? 'Removendo...' : 'Remover'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Formatos aceitos: JPG, PNG, WEBP. Tamanho máximo: 5MB
      </p>
    </div>
  );
}




