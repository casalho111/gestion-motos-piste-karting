import { z } from 'zod';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { withMiddleware, RequestContext } from '@/lib/utils/middleware-validation';

// Définition locale de UserRole
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  STAFF = 'STAFF'
}

// Fonction utilitaire pour créer un mock de RequestContext
export function createMockContext(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    timestamp: Date.now(),
    user: {
      id: 'test-user-id',
      name: 'Test User',
      role: UserRole.ADMIN as unknown as NonNullable<RequestContext['user']>['role']
    },
    ...overrides
  };
}

// Fonction utilitaire pour simuler un Server Action
export function mockServerAction<T, R>(
  handler: (data: T, context: RequestContext) => Promise<R>,
  schema?: z.ZodType<T>
) {
  const middleware = withMiddleware(handler, {
    validation: schema
  });
  
  return {
    execute: async (data: T, context: Partial<RequestContext> = {}) => {
      return middleware(data, createMockContext(context));
    }
  };
}

// Fonction utilitaire pour tester les transactions MongoDB
export async function mockTransaction<T>(
  result: T
): Promise<T> {
  const mockPrisma = mockDeep<PrismaClient>();
  // Simuler le comportement de $transaction
  (mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
    return await fn(mockPrisma);
  });
  return result;
}
