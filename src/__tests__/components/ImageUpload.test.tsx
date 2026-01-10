import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUpload } from '@/components/ImageUpload';
import { TestQueryProvider } from '@/test/mocks/react-query';

// Mock do hook useImageUpload
vi.mock('@/hooks/useImageUpload', () => ({
  useImageUpload: () => ({
    uploadImage: vi.fn().mockResolvedValue('https://example.com/image.jpg'),
    deleteImage: vi.fn().mockResolvedValue(true),
    uploading: false,
    error: null,
  }),
}));

describe('ImageUpload', () => {
  const mockOnImageUploaded = vi.fn();
  const mockOnImageRemoved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o componente', () => {
    render(
      <TestQueryProvider>
        <ImageUpload
          folder="avatars"
          onImageUploaded={mockOnImageUploaded}
        />
      </TestQueryProvider>
    );

    expect(screen.getByRole('button', { name: /escolher imagem/i })).toBeInTheDocument();
  });

  it('deve exibir imagem atual se currentImageUrl for fornecido', () => {
    render(
      <TestQueryProvider>
        <ImageUpload
          folder="avatars"
          currentImageUrl="https://example.com/current.jpg"
          onImageUploaded={mockOnImageUploaded}
        />
      </TestQueryProvider>
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/current.jpg');
  });

  it('deve exibir label e description se fornecidos', () => {
    render(
      <TestQueryProvider>
        <ImageUpload
          folder="avatars"
          label="Foto de Perfil"
          description="Selecione uma foto"
          onImageUploaded={mockOnImageUploaded}
        />
      </TestQueryProvider>
    );

    expect(screen.getByText('Foto de Perfil')).toBeInTheDocument();
    expect(screen.getByText('Selecione uma foto')).toBeInTheDocument();
  });

  it('deve chamar onImageUploaded quando imagem é selecionada', async () => {
    const user = userEvent.setup();
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    render(
      <TestQueryProvider>
        <ImageUpload
          folder="avatars"
          onImageUploaded={mockOnImageUploaded}
        />
      </TestQueryProvider>
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    
    await user.upload(input, file);

    await waitFor(() => {
      expect(mockOnImageUploaded).toHaveBeenCalled();
    });
  });

  it('deve exibir botão de remover quando há imagem', () => {
    render(
      <TestQueryProvider>
        <ImageUpload
          folder="avatars"
          currentImageUrl="https://example.com/image.jpg"
          onImageUploaded={mockOnImageUploaded}
          onImageRemoved={mockOnImageRemoved}
        />
      </TestQueryProvider>
    );

    const removeButtons = screen.getAllByRole('button', { name: /remover/i });
    expect(removeButtons.length).toBeGreaterThan(0);
  });

  it('deve chamar onImageRemoved quando imagem é removida', async () => {
    const user = userEvent.setup();

    render(
      <TestQueryProvider>
        <ImageUpload
          folder="avatars"
          currentImageUrl="https://example.com/image.jpg"
          onImageUploaded={mockOnImageUploaded}
          onImageRemoved={mockOnImageRemoved}
        />
      </TestQueryProvider>
    );

    const removeButtons = screen.getAllByRole('button', { name: /remover/i });
    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(mockOnImageRemoved).toHaveBeenCalled();
    });
  });

  it('deve aplicar className customizada', () => {
    const { container } = render(
      <TestQueryProvider>
        <ImageUpload
          folder="avatars"
          className="custom-class"
          onImageUploaded={mockOnImageUploaded}
        />
      </TestQueryProvider>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

