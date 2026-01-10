import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useImageUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (
    file: File,
    folder: 'avatars' | 'logos',
    fileName?: string
  ): Promise<string | null> => {
    if (!user) {
      setError('Usuário não autenticado');
      return null;
    }

    try {
      setUploading(true);
      setError(null);

      // Validação do arquivo
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('Arquivo muito grande. Tamanho máximo: 5MB');
        return null;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Formato inválido. Use JPG, PNG ou WEBP');
        return null;
      }

      // Gera nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 9);
      const finalFileName = fileName || `${user.id}_${timestamp}_${randomStr}.${fileExt}`;
      const filePath = `${folder}/${finalFileName}`;

      // Remove arquivo antigo se existir (opcional - pode deixar acumular)
      // Por enquanto, vamos deixar acumular para não perder imagens

      // Upload para Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false, // Não sobrescreve se já existir
        });

      if (uploadError) {
        // Se arquivo já existe, tenta com nome diferente
        if (uploadError.message.includes('already exists')) {
          const newFileName = `${user.id}_${timestamp}_${randomStr}_${Date.now()}.${fileExt}`;
          const newFilePath = `${folder}/${newFileName}`;
          
          const { data: retryData, error: retryError } = await supabase.storage
            .from('profile-images')
            .upload(newFilePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (retryError) {
            setError(retryError.message);
            return null;
          }

          // Obtém URL pública
          const { data: urlData } = supabase.storage
            .from('profile-images')
            .getPublicUrl(newFilePath);

          return urlData.publicUrl;
        }

        setError(uploadError.message);
        return null;
      }

      // Obtém URL pública
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (url: string): Promise<boolean> => {
    try {
      // Extrai o caminho do arquivo da URL
      const urlParts = url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('profile-images') + 1).join('/');

      const { error } = await supabase.storage
        .from('profile-images')
        .remove([filePath]);

      if (error) {
        setError(error.message);
        return false;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar imagem');
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploading,
    error,
  };
}




