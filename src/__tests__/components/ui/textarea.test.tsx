import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '@/components/ui/textarea';

describe('Textarea', () => {
  it('deve renderizar o textarea', () => {
    render(<Textarea placeholder="Digite algo" />);
    
    const textarea = screen.getByPlaceholderText('Digite algo');
    expect(textarea).toBeInTheDocument();
  });

  it('deve permitir digitação', async () => {
    const user = userEvent.setup();
    render(<Textarea placeholder="Digite algo" />);
    
    const textarea = screen.getByPlaceholderText('Digite algo');
    await user.type(textarea, 'Texto de teste');
    
    expect(textarea).toHaveValue('Texto de teste');
  });

  it('deve chamar onChange quando o valor muda', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(<Textarea onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'a');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('deve estar desabilitado quando disabled é true', () => {
    render(<Textarea disabled placeholder="Desabilitado" />);
    
    const textarea = screen.getByPlaceholderText('Desabilitado');
    expect(textarea).toBeDisabled();
  });

  it('deve aplicar className customizada', () => {
    render(<Textarea className="custom-class" />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('custom-class');
  });

  it('deve suportar value controlado', () => {
    render(<Textarea value="Valor controlado" onChange={() => {}} />);
    
    const textarea = screen.getByDisplayValue('Valor controlado');
    expect(textarea).toHaveValue('Valor controlado');
  });

  it('deve respeitar rows quando fornecido', () => {
    render(<Textarea rows={5} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
  });
});








