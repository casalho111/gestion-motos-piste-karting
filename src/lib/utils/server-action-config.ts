import { z } from 'zod';
import { createOptimizedPrismaClient, MemoryQueryCache } from '@/lib/utils/db-utils';

// Exporter une instance optimisée de Prisma pour tous les Server Actions
export const prisma = createOptimizedPrismaClient({
  debugQueries: process.env.NODE_ENV === 'development',
  slowQueryThreshold: 150 // ms
});

// Cache pour les requêtes statiques ou fréquentes
export const queryCache = new MemoryQueryCache(300); // 5 minutes

// Configuration globale pour les actions
export const ServerActionConfig = {
  // Délai en ms pour les opérations de revalidation de cache
  revalidationDelay: 100,
  
  // Pages à revalider lors de certaines actions
  pages: {
    dashboard: '/dashboard',
    motos: '/dashboard/motos',
    moteurs: '/dashboard/moteurs',
    maintenance: '/dashboard/maintenance',
    controles: '/dashboard/controles',
    pieces: '/dashboard/pieces',
    utilisations: '/dashboard/utilisations',
    alertes: '/dashboard/alertes',
    planning: '/dashboard/planning',
    stats: '/dashboard/stats',
  },
  
  // Limites pour la pagination
  pagination: {
    defaultLimit: 10,
    maxLimit: 50,
    minLimit: 5
  }
};

/**
 * Type générique pour les résultats des Server Actions
 */
export type ServerActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: z.ZodError['errors'];
};

/**
 * Utilitaire pour gérer les erreurs des Server Actions
 */
export function handleServerActionError(error: unknown): ServerActionResult {
  console.error('Erreur Server Action:', error);
  
  if (error instanceof z.ZodError) {
    return { 
      success: false, 
      error: 'Données invalides', 
      validationErrors: error.errors 
    };
  }
  
  if (error instanceof Error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
  
  return { 
    success: false, 
    error: 'Une erreur inconnue est survenue. Veuillez réessayer.' 
  };
}

/**
 * Fonction d'assistance pour valider avec Zod et gérer les erreurs de manière uniforme
 */
export async function validateAndProcess<T, R>(
  schema: z.ZodType<T>,
  data: unknown,
  processor: (validData: T) => Promise<R>
): Promise<ServerActionResult<R>> {
  try {
    // Valider avec Zod
    const validData = schema.parse(data);
    
    // Exécuter le traitement
    const result = await processor(validData);
    
    return { success: true, data: result };
  } catch (error) {
    return handleServerActionError(error);
  }
}

/**
 * Fonction d'assistance pour la pagination standard
 */
export async function paginateResults<T>(
  queryFn: (skip: number, take: number) => Promise<T[]>,
  countFn: () => Promise<number>,
  page: number = 1,
  limit: number = ServerActionConfig.pagination.defaultLimit
): Promise<{
  data: T[];
  pagination: {
    total: number;
    pageCount: number;
    currentPage: number;
    perPage: number;
  }
}> {
  // Normaliser les paramètres de pagination
  const validatedLimit = Math.min(
    Math.max(limit, ServerActionConfig.pagination.minLimit),
    ServerActionConfig.pagination.maxLimit
  );
  
  const validatedPage = Math.max(1, page);
  
  const skip = (validatedPage - 1) * validatedLimit;
  
  // Exécuter les requêtes en parallèle
  const [data, total] = await Promise.all([
    queryFn(skip, validatedLimit),
    countFn()
  ]);
  
  return {
    data,
    pagination: {
      total,
      pageCount: Math.ceil(total / validatedLimit),
      currentPage: validatedPage,
      perPage: validatedLimit
    }
  };
}