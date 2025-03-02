import { PrismaClient } from '@prisma/client';

// Type pour les options de performance Prisma
type PrismaPerformanceOptions = {
  debugQueries?: boolean;
  slowQueryThreshold?: number; // en ms
};

// Type pour les options de monitor de query
type QueryMonitorOptions = {
  model: string;
  action: string;
  startTime: number;
};

/**
 * Crée une instance Prisma optimisée avec monitoring des performances
 */
export function createOptimizedPrismaClient(options: PrismaPerformanceOptions = {}) {
  const {
    debugQueries = process.env.NODE_ENV === 'development',
    slowQueryThreshold = 100 // 100ms par défaut
  } = options;

  // Éviter la multiplication des instances Prisma en développement
  const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined;
  };

  // Options de journalisation pour Prisma
  const logOptions = debugQueries
    ? ['query', 'error', 'warn']
    : ['error'];

  // Créer l'instance avec les options adéquates
  const prismaBase = globalForPrisma.prisma ?? new PrismaClient({
    log: logOptions as any[]
  });

  // Ajouter un middleware pour monitorer les performances
  prismaBase.$use(async (params, next) => {
    const startTime = Date.now();
    
    const monitorOptions: QueryMonitorOptions = {
      model: params.model || 'unknown',
      action: params.action,
      startTime
    };

    try {
      // Exécuter la requête
      const result = await next(params);
      
      // Mesurer le temps écoulé
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Journaliser les requêtes lentes
      if (debugQueries && duration > slowQueryThreshold) {
        console.warn(
          `⚠️ Requête lente (${duration}ms): ${params.model}.${params.action}`,
          params.args ? `\nArgs: ${JSON.stringify(params.args)}` : ''
        );
      }
      
      return result;
    } catch (error) {
      // En cas d'erreur, journaliser la requête problématique
      console.error(
        `❌ Erreur dans la requête: ${params.model}.${params.action}`,
        params.args ? `\nArgs: ${JSON.stringify(params.args)}` : '',
        `\nErreur: ${error}`
      );
      throw error;
    }
  });

  // En développement, sauvegarder l'instance pour réutilisation
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaBase;
  }

  return prismaBase;
}

/**
 * Utilitaire pour optimiser les sélections de champs dans les requêtes Prisma
 * Permet de n'inclure que les champs nécessaires pour réduire la taille des données
 */
export function optimizeSelection<T extends Record<string, any>>(
  fields: (keyof T)[],
  includeId: boolean = true
): Record<string, boolean> {
  const selection: Record<string, boolean> = {};
  
  if (includeId) {
    selection['id'] = true;
  }
  
  fields.forEach(field => {
    selection[field as string] = true;
  });
  
  return selection;
}

/**
 * Utilitaire pour paginer les résultats
 */
export function getPaginationParams(
  page: number = 1,
  limit: number = 10
) {
  const skip = Math.max(0, (page - 1) * limit);
  return {
    skip,
    take: limit
  };
}

/**
 * Utilitaire pour formater les résultats de pagination
 */
export function formatPaginationResults<T>(
  data: T[],
  total: number,
  page: number = 1,
  limit: number = 10
) {
  return {
    data,
    pagination: {
      total,
      pageCount: Math.ceil(total / limit),
      currentPage: page,
      perPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  };
}

/**
 * Fonction pour construire dynamiquement un paramètre de recherche MongoDB
 */
export function buildMongoTextSearch(
  searchTerm: string,
  fields: string[]
): Record<string, any> {
  if (!searchTerm || !fields.length) {
    return {};
  }

  // Échapper les caractères spéciaux de MongoDB
  const sanitizedTerm = searchTerm.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  
  // Construire l'expression régulière pour chaque champ
  return {
    OR: fields.map(field => ({
      [field]: {
        contains: sanitizedTerm,
        mode: 'insensitive'
      }
    }))
  };
}

/**
 * Gestionnaire de cache en mémoire pour réduire les requêtes répétitives
 * Utile pour les données statiques ou qui changent rarement
 */
export class MemoryQueryCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private defaultTTL: number;

  constructor(ttlInSeconds: number = 60) {
    this.defaultTTL = ttlInSeconds * 1000; // Conversion en millisecondes
  }

  /**
   * Récupérer une valeur du cache
   * @param key Clé du cache
   * @returns Valeur mise en cache ou undefined si absente ou expirée
   */
  get(key: string): any | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Vérifier si l'entrée est expirée
    const now = Date.now();
    if (now - entry.timestamp > this.defaultTTL) {
      // Nettoyer l'entrée expirée
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.data;
  }

  /**
   * Mettre en cache une valeur
   * @param key Clé du cache
   * @param data Données à mettre en cache
   * @param ttlInSeconds TTL personnalisé (optionnel)
   */
  set(key: string, data: any, ttlInSeconds?: number): void {
    const entry = {
      data,
      timestamp: Date.now(),
    };
    
    this.cache.set(key, entry);
    
    // Si un TTL personnalisé est fourni, planifier le nettoyage
    if (ttlInSeconds !== undefined) {
      setTimeout(() => {
        this.delete(key);
      }, ttlInSeconds * 1000);
    }
  }

  /**
   * Supprimer une entrée du cache
   * @param key Clé à supprimer
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Vider tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Nettoyer les entrées expirées
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Utiliser une fonction de rappel si la valeur n'est pas en cache
   * ou si elle est expirée
   * @param key Clé du cache
   * @param callback Fonction à exécuter si la valeur n'est pas en cache
   * @param ttlInSeconds TTL personnalisé (optionnel)
   * @returns Valeur du cache ou résultat du callback
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttlInSeconds?: number
  ): Promise<T> {
    const cachedValue = this.get(key);
    
    if (cachedValue !== undefined) {
      return cachedValue as T;
    }
    
    const result = await callback();
    this.set(key, result, ttlInSeconds);
    return result;
  }
}