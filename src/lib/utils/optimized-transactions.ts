import { PrismaClient } from '@prisma/client';
import { createOptimizedPrismaClient } from './db-utils';

// Instance Prisma optimisée
const prisma = createOptimizedPrismaClient();

/**
 * Options pour les transactions
 */
interface TransactionOptions {
  // Temps maximum d'exécution en ms
  timeout?: number;
  // Nombre maximum de tentatives en cas d'erreur
  maxRetries?: number;
  // Délai initial entre les tentatives (en ms)
  initialRetryDelay?: number;
  // Fonction de log personnalisée
  logger?: (message: string, data?: any) => void;
  // Identifiant de la transaction (pour le logging)
  transactionId?: string;
}

/**
 * Gestionnaire d'erreurs pour les transactions
 */
class TransactionError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly transactionId?: string
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * Exécute une fonction dans une transaction MongoDB optimisée,
 * avec gestion des erreurs et retry automatique
 */
export async function runOptimizedTransaction<T>(
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const {
    timeout = 30000,
    maxRetries = 3,
    initialRetryDelay = 100,
    logger = console.log,
    transactionId = `tx-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  } = options;

  let retryCount = 0;
  let lastError: Error | null = null;

  // Fonction pour attendre avec un délai exponentiel
  const wait = (attempt: number) => 
    new Promise(resolve => 
      setTimeout(resolve, initialRetryDelay * Math.pow(2, attempt))
    );

  while (retryCount < maxRetries) {
    try {
      // Créer une promesse avec timeout
      const transactionPromise = prisma.$transaction(fn, {
        timeout
        // Note: isolationLevel n'est pas supporté dans MongoDB avec Prisma
      });

      // Exécuter la transaction avec timeout
      const result = await Promise.race([
        transactionPromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Transaction timeout (${timeout}ms)`)), timeout)
        )
      ]);

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Log détaillé de l'erreur
      logger(`Transaction ${transactionId} échouée (tentative ${retryCount + 1}/${maxRetries})`, {
        error: lastError.message,
        stack: lastError.stack
      });

      // Déterminer si on doit réessayer
      const shouldRetry = 
        // Erreurs liées aux sessions MongoDB
        lastError.message.includes('Transaction has been aborted') ||
        lastError.message.includes('Session has expired') ||
        // Erreurs de conflit
        lastError.message.includes('WriteConflict') ||
        lastError.message.includes('CommandError');

      if (shouldRetry && retryCount < maxRetries - 1) {
        retryCount++;
        await wait(retryCount);
        continue;
      }

      // Si on arrive ici, soit c'est une erreur non récupérable, soit on a épuisé les tentatives
      throw new TransactionError(
        `Transaction échouée après ${retryCount + 1} tentatives`,
        lastError,
        transactionId
      );
    }
  }

  // Normalement, on ne devrait jamais atteindre ce point, mais TypeScript l'exige
  throw new TransactionError(
    `Transaction échouée après ${maxRetries} tentatives`,
    lastError || new Error('Erreur inconnue'),
    transactionId
  );
}

/**
 * Exemple d'utilisation avec transactions imbriquées
 * 
 * Cette fonction montre comment utiliser des "sous-transactions" logiques
 * tout en n'utilisant qu'une seule vraie transaction au niveau de la base de données.
 */
export async function runNestedOperations<T>(
  fn: (operations: {
    step1: <R>(fn: (tx: any) => Promise<R>) => Promise<R>;
    step2: <R>(fn: (tx: any) => Promise<R>) => Promise<R>;
    step3: <R>(fn: (tx: any) => Promise<R>) => Promise<R>;
  }, tx: any) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  return runOptimizedTransaction(async (tx) => {
    // Créer des opérations imbriquées avec le même contexte de transaction
    const operations = {
      step1: <R>(stepFn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<R>) => stepFn(tx),
      step2: <R>(stepFn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<R>) => stepFn(tx),
      step3: <R>(stepFn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<R>) => stepFn(tx),
    };

    // Exécuter la fonction fournie avec les opérations et le contexte de transaction
    return await fn(operations, tx);
  }, options);
}

/**
 * Analyse les index MongoDB pour les requêtes fréquentes
 * Cette fonction est utile pour le diagnostic des performances
 */
export async function analyzeIndexUsage() {
  try {
    // Utiliser la connexion Prisma sous-jacente pour accéder directement à MongoDB
    const connection = (prisma as any)._engine?.client?.db();
    
    if (!connection) {
      throw new Error('Impossible d\'accéder à la connexion MongoDB');
    }

    // Analyser l'utilisation des index (nécessite des privilèges admin)
    const result = await connection.command({ aggregate: 1, pipeline: [{ $indexStats: {} }], cursor: {} });
    
    // Filtrer et trier les résultats
    const indexStats = result.cursor.firstBatch
      .sort((a: any, b: any) => b.accesses.ops - a.accesses.ops);

    return {
      indexStats,
      recommendations: generateIndexRecommendations(indexStats)
    };
  } catch (error) {
    console.error('Erreur lors de l\'analyse des index:', error);
    throw new Error('Impossible d\'analyser les index MongoDB');
  }
}

/**
 * Génère des recommandations pour l'optimisation des index
 * basées sur les statistiques d'utilisation
 */
function generateIndexRecommendations(indexStats: any[]) {
  const recommendations = [];

  // Identifier les index non utilisés
  const unusedIndexes = indexStats.filter((stat: any) => stat.accesses.ops === 0);
  if (unusedIndexes.length > 0) {
    recommendations.push({
      type: 'REMOVE_UNUSED_INDEXES',
      message: `${unusedIndexes.length} index non utilisés trouvés`,
      indexes: unusedIndexes.map((idx: any) => idx.name)
    });
  }

  // Identifier les collections sans index
  const collectionsWithIndexes = new Set(indexStats.map((stat: any) => stat.ns));
  // (Logique pour identifier les collections sans index omise pour simplifier)

  return recommendations;
}