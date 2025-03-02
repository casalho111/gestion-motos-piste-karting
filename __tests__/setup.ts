import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';

// Mock global fetch
global.fetch = jest.fn();

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: mockDeep<PrismaClient>(),
  createOptimizedPrismaClient: jest.fn(() => mockDeep<PrismaClient>())
}));

// Import mocked Prisma instance
import { prisma } from '@/lib/db';

// Reset mocks between tests
beforeEach(() => {
  mockReset(prisma);
  jest.clearAllMocks();
});

// Mock revalidatePath from Next.js
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));