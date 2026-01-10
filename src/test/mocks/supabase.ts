import { vi } from 'vitest';

export const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      order: vi.fn(() => ({
        eq: vi.fn(),
      })),
      single: vi.fn(),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(),
    })),
    eq: vi.fn(() => ({
      order: vi.fn(),
    })),
  })),
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signOut: vi.fn(),
  },
};

export function createMockSupabaseResponse<T>(data: T, error: any = null) {
  return {
    data,
    error,
    status: error ? 400 : 200,
    statusText: error ? 'Error' : 'OK',
  };
}

