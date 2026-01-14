import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientAvatarProps {
  avatarUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ClientAvatar({ avatarUrl, name, size = 'md', className }: ClientAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
  };

  // Pegar primeira letra do nome
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={cn('relative shrink-0', className)}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={cn(
            'rounded-full object-cover border-2 border-border',
            sizeClasses[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary border-2 border-primary/20',
            sizeClasses[size]
          )}
        >
          {initial}
        </div>
      )}
    </div>
  );
}



