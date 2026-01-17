import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('deve renderizar o input', () => {
    render(<Input placeholder="Digite algo" />);
    
    const input = screen.getByPlaceholderText('Digite algo');
    expect(input).toBeInTheDocument();
  });

  it('deve permitir digitação', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Digite algo" />);
    
    const input = screen.getByPlaceholderText('Digite algo');
    await user.type(input, 'Texto de teste');
    
    expect(input).toHaveValue('Texto de teste');
  });

  it('deve chamar onChange quando o valor muda', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'a');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('deve estar desabilitado quando disabled é true', () => {
    render(<Input disabled placeholder="Desabilitado" />);
    
    const input = screen.getByPlaceholderText('Desabilitado');
    expect(input).toBeDisabled();
  });

  it('deve aplicar className customizada', () => {
    render(<Input className="custom-class" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('deve suportar diferentes tipos de input', () => {
    const { rerender } = render(<Input type="email" />);
    let input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<Input type="password" />);
    input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('deve suportar value controlado', () => {
    render(<Input value="Valor controlado" onChange={() => {}} />);
    
    const input = screen.getByDisplayValue('Valor controlado');
    expect(input).toHaveValue('Valor controlado');
  });
});















