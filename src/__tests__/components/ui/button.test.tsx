import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('deve renderizar o botão com texto', () => {
    render(<Button>Clique aqui</Button>);
    
    const button = screen.getByRole('button', { name: /clique aqui/i });
    expect(button).toBeInTheDocument();
  });

  it('deve chamar onClick quando clicado', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Clique</Button>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('deve estar desabilitado quando disabled é true', () => {
    render(<Button disabled>Desabilitado</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('deve aplicar variantes corretamente', () => {
    const { rerender } = render(<Button variant="destructive">Destrutivo</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('border');
  });

  it('deve aplicar tamanhos corretamente', () => {
    const { rerender } = render(<Button size="sm">Pequeno</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('h-9');

    rerender(<Button size="lg">Grande</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('h-11');
  });

  it('deve renderizar como link quando variant é link', () => {
    render(<Button variant="link">Link</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('underline-offset-4');
  });
});

