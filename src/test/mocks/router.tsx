import { MemoryRouter } from 'react-router-dom';
import { ReactNode } from 'react';

export function TestRouter({ children, initialEntries = ['/'] }: { 
  children: ReactNode; 
  initialEntries?: string[];
}) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );
}

