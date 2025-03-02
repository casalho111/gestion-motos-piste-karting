import { PrismaClient } from '@prisma/client';
import { createOptimizedPrismaClient } from './db-utils';

// Prisma client optimisé
const prisma = createOptimizedPrismaClient();

/**
 * Types d'événements pour le journal
 */
export enum LogEventType {
  // Événements liés aux motos
  MOTO_CREATE = 'MOTO_CREATE',
  MOTO_UPDATE = 'MOTO_UPDATE',
  MOTO_DELETE = 'MOTO_DELETE',
  MOTO_STATE_CHANGE = 'MOTO_STATE_CHANGE',
  
  // Événements liés aux moteurs
  MOTEUR_CREATE = 'MOTEUR_CREATE',
  MOTEUR_UPDATE = 'MOTEUR_UPDATE',
  MOTEUR_DELETE = 'MOTEUR_DELETE',
  MOTEUR_STATE_CHANGE = 'MOTEUR_STATE_CHANGE',
  
  // Événements liés au montage/démontage
  MOTEUR_MONTAGE = 'MOTEUR_MONTAGE',
  MOTEUR_DEMONTAGE = 'MOTEUR_DEMONTAGE',
  
  // Événements liés à la maintenance
  MAINTENANCE_CREATE = 'MAINTENANCE_CREATE',
  MAINTENANCE_UPDATE = 'MAINTENANCE_UPDATE',
  MAINTENANCE_COMPLETE = 'MAINTENANCE_COMPLETE',
  
  // Événements liés aux pièces
  PIECE_CREATE = 'PIECE_CREATE',
  PIECE_UPDATE = 'PIECE_UPDATE',
  PIECE_DELETE = 'PIECE_DELETE',
  STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',
  
  // Événements liés à l'utilisation
  UTILISATION_CREATE = 'UTILISATION_CREATE',
  UTILISATION_DELETE = 'UTILISATION_DELETE',
  
  // Événements liés aux alertes
  ALERTE_CREATE = 'ALERTE_CREATE',
  ALERTE_RESOLVE = 'ALERTE_RESOLVE',
  
  // Événements liés au planning
  PLANNING_CREATE = 'PLANNING_CREATE',
  PLANNING_UPDATE = 'PLANNING_UPDATE',
  PLANNING_COMPLETE = 'PLANNING_COMPLETE',
  
  // Événements système
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  SYSTEM_WARNING = 'SYSTEM_WARNING',
  SYSTEM_INFO = 'SYSTEM_INFO',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_ACTION = 'USER_ACTION'
}

/**
 * Niveaux de sévérité pour le journal
 */
export enum LogSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Interface pour les entrées du journal
 */
export interface LogEntry {
  timestamp: Date;
  eventType: LogEventType;
  severity: LogSeverity;
  userId?: string;
  userName?: string;
  message: string;
  details?: any;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

/**
 * Adapté à MongoDB, cette classe crée des entrées de journal
 * et offre des méthodes pour les requêter.
 */
export class Logger {
  private static instance: Logger;
  private prisma: PrismaClient;
  private collectionName: string;
  
  /**
   * Créer un singleton de Logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  private constructor() {
    this.prisma = prisma;
    this.collectionName = 'Journal'; // Nom de la collection MongoDB
  }
  
  /**
   * Créer une entrée dans le journal
   */
  public async log(entry: Omit<LogEntry, 'timestamp'>): Promise<void> {
    try {
      const completeEntry: LogEntry = {
        ...entry,
        timestamp: new Date()
      };
      
      // Utiliser Prisma pour insérer dans la collection MongoDB
      // Note: Dans un projet réel, vous auriez un modèle Prisma pour 'Journal'
      // Ici, nous utilisons $runCommandRaw pour la démonstration
      await (this.prisma as any).$runCommandRaw({
        insert: this.collectionName,
        documents: [completeEntry]
      });
    } catch (error) {
      console.error('Erreur lors de la journalisation:', error);
      // Éviter de générer plus d'erreurs en cas d'échec de journalisation
    }
  }
  
  /**
   * Utilitaire pour créer une entrée de type information
   */
  public async info(
    message: string,
    eventType: LogEventType,
    options: Partial<Omit<LogEntry, 'timestamp' | 'message' | 'eventType' | 'severity'>> = {}
  ): Promise<void> {
    await this.log({
      message,
      eventType,
      severity: LogSeverity.INFO,
      ...options
    });
  }
  
  /**
   * Utilitaire pour créer une entrée de type warning
   */
  public async warn(
    message: string,
    eventType: LogEventType,
    options: Partial<Omit<LogEntry, 'timestamp' | 'message' | 'eventType' | 'severity'>> = {}
  ): Promise<void> {
    await this.log({
      message,
      eventType,
      severity: LogSeverity.WARNING,
      ...options
    });
  }
  
  /**
   * Utilitaire pour créer une entrée de type erreur
   */
  public async error(
    message: string,
    eventType: LogEventType,
    options: Partial<Omit<LogEntry, 'timestamp' | 'message' | 'eventType' | 'severity'>> = {}
  ): Promise<void> {
    await this.log({
      message,
      eventType,
      severity: LogSeverity.ERROR,
      ...options
    });
  }
  
  /**
   * Utilitaire pour créer une entrée de type critique
   */
  public async critical(
    message: string,
    eventType: LogEventType,
    options: Partial<Omit<LogEntry, 'timestamp' | 'message' | 'eventType' | 'severity'>> = {}
  ): Promise<void> {
    await this.log({
      message,
      eventType,
      severity: LogSeverity.CRITICAL,
      ...options
    });
  }
  
  /**
   * Journalise l'action d'un utilisateur
   */
  public async logUserAction(
    userId: string,
    userName: string,
    action: string,
    entityType?: string,
    entityId?: string,
    details?: any
  ): Promise<void> {
    await this.info(
      action,
      LogEventType.USER_ACTION,
      {
        userId,
        userName,
        entityType,
        entityId,
        details
      }
    );
  }
  
  /**
   * Requêter les entrées du journal
   */
  public async getEntries(options: {
    startDate?: Date;
    endDate?: Date;
    eventTypes?: LogEventType[];
    severities?: LogSeverity[];
    entityType?: string;
    entityId?: string;
    userId?: string;
    limit?: number;
    offset?: number;
    sortDirection?: 'asc' | 'desc';
  } = {}): Promise<LogEntry[]> {
    const {
      startDate,
      endDate,
      eventTypes,
      severities,
      entityType,
      entityId,
      userId,
      limit = 100,
      offset = 0,
      sortDirection = 'desc'
    } = options;
    
    // Construire la requête MongoDB
    const query: any = {};
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }
    
    if (eventTypes && eventTypes.length > 0) {
      query.eventType = { $in: eventTypes };
    }
    
    if (severities && severities.length > 0) {
      query.severity = { $in: severities };
    }
    
    if (entityType) {
      query.entityType = entityType;
    }
    
    if (entityId) {
      query.entityId = entityId;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    // Exécuter la requête via Prisma
    const result = await (this.prisma as any).$runCommandRaw({
      find: this.collectionName,
      filter: query,
      sort: { timestamp: sortDirection === 'asc' ? 1 : -1 },
      limit,
      skip: offset
    });
    
    return result.cursor.firstBatch as LogEntry[];
  }
  
  /**
   * Obtenir l'historique des actions pour une entité spécifique
   */
  public async getEntityHistory(
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<LogEntry[]> {
    return this.getEntries({
      entityType,
      entityId,
      limit,
      sortDirection: 'desc'
    });
  }
  
  /**
   * Obtenir l'historique des actions d'un utilisateur
   */
  public async getUserHistory(
    userId: string,
    limit: number = 50
  ): Promise<LogEntry[]> {
    return this.getEntries({
      userId,
      limit,
      sortDirection: 'desc'
    });
  }
}

// Exporter une instance du logger pour utilisation dans l'application
export const logger = Logger.getInstance();

/**
 * Décorateur pour journaliser les appels de méthodes (en TypeScript)
 */
export function LogMethod(
  eventType: LogEventType,
  severity: LogSeverity = LogSeverity.INFO,
  messageTemplate?: string
) {
  return function(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const logger = Logger.getInstance();
      const message = messageTemplate || `Méthode ${propertyKey} appelée`;
      
      try {
        // Journaliser avant l'exécution
        await logger.log({
          eventType,
          severity,
          message: `${message} (début)`,
          details: { args },
          metadata: {
            class: target.constructor.name,
            method: propertyKey
          }
        });
        
        // Exécuter la méthode originale
        const result = await originalMethod.apply(this, args);
        
        // Journaliser après l'exécution avec succès
        await logger.log({
          eventType,
          severity,
          message: `${message} (terminé)`,
          details: { result },
          metadata: {
            class: target.constructor.name,
            method: propertyKey
          }
        });
        
        return result;
      } catch (error) {
        // Journaliser l'erreur
        await logger.log({
          eventType,
          severity: LogSeverity.ERROR,
          message: `${message} (erreur)`,
          details: { 
            args,
            error: error instanceof Error ? {
              message: error.message,
              stack: error.stack
            } : String(error)
          },
          metadata: {
            class: target.constructor.name,
            method: propertyKey
          }
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
}