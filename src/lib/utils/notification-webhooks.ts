import { PrismaClient } from '@prisma/client';
import { createOptimizedPrismaClient } from './db-utils';
import { logger, LogEventType, LogSeverity } from './logging-system';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Prisma client
const prisma = createOptimizedPrismaClient();

/**
 * Types d'événements pour les notifications et webhooks
 */
export enum NotificationEventType {
  // Événements liés aux motos
  MOTO_STATUS_CHANGE = 'MOTO_STATUS_CHANGE',  
  
  // Événements liés à la maintenance
  MAINTENANCE_DUE = 'MAINTENANCE_DUE',
  MAINTENANCE_OVERDUE = 'MAINTENANCE_OVERDUE',
  MAINTENANCE_COMPLETED = 'MAINTENANCE_COMPLETED',
  
  // Événements liés aux pièces
  STOCK_LOW = 'STOCK_LOW',
  STOCK_OUT = 'STOCK_OUT',
  
  // Événements liés au planning
  PLANNING_REMINDER = 'PLANNING_REMINDER',
  
  // Événements liés aux contrôles
  CONTROL_FAILED = 'CONTROL_FAILED',
  
  // Événements liés aux alertes
  NEW_ALERT = 'NEW_ALERT',
  CRITICAL_ALERT = 'CRITICAL_ALERT',
  
  // Événements système
  SYSTEM_STATUS = 'SYSTEM_STATUS'
}

/**
 * Canaux de notification disponibles
 */
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WEBHOOK = 'WEBHOOK',
  IN_APP = 'IN_APP'
}

/**
 * Interface pour une notification
 */
export interface Notification {
  id?: string;
  eventType: NotificationEventType;
  title: string;
  message: string;
  channel: NotificationChannel;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  sentAt?: Date;
  payload?: any;
  metadata?: Record<string, any>;
  createdAt?: Date;
}

/**
 * Configuration pour un webhook
 */
export interface WebhookConfig {
  id?: string;
  name: string;
  url: string;
  eventTypes: NotificationEventType[];
  isActive: boolean;
  secret?: string;
  headers?: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
  lastCalledAt?: Date;
  failureCount?: number;
}

/**
 * Gestionnaire de notifications et webhooks
 */
export class NotificationService {
  private static instance: NotificationService;
  private emailTransporter: nodemailer.Transporter | null = null;
  
  /**
   * Obtenir l'instance singleton
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  private constructor() {
    this.initEmailTransporter();
  }
  
  /**
   * Initialiser le transporteur d'email
   */
  private initEmailTransporter(): void {
    try {
      // En production, utilisez votre service SMTP préféré
      if (process.env.NODE_ENV === 'production') {
        this.emailTransporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
          }
        });
      } else {
        // En développement, utiliser Ethereal pour tester
        nodemailer.createTestAccount().then((account: nodemailer.TestAccount) => {
          this.emailTransporter = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: {
              user: account.user,
              pass: account.pass
            }
          });
        }).catch((err: Error) => {
          console.error('Erreur lors de la création du compte de test Ethereal:', err);
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du transporteur email:', error);
      logger.error('Échec de l\'initialisation du transporteur email', LogEventType.SYSTEM_ERROR, {
        details: error
      });
    }
  }
  
  /**
   * Créer une notification
   */
  public async createNotification(notification: Omit<Notification, 'id' | 'status' | 'createdAt'>): Promise<Notification> {
    try {
      const newNotification: Notification = {
        ...notification,
        status: 'PENDING',
        createdAt: new Date()
      };
      
      // Dans un projet réel, vous sauvegarderiez ceci dans la base de données
      // Ici nous simulons simplement la création
      
      // Traiter la notification immédiatement
      await this.processNotification(newNotification);
      
      return newNotification;
    } catch (error) {
      logger.error('Erreur lors de la création de la notification', LogEventType.SYSTEM_ERROR, {
        details: { error, notification }
      });
      throw new Error('Impossible de créer la notification');
    }
  }
  
  /**
   * Traiter une notification selon son canal
   */
  private async processNotification(notification: Notification): Promise<void> {
    try {
      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          await this.sendEmailNotification(notification);
          break;
        case NotificationChannel.WEBHOOK:
          await this.triggerWebhooks(notification);
          break;
        case NotificationChannel.IN_APP:
          await this.saveInAppNotification(notification);
          break;
        default:
          logger.warn(`Canal de notification non implémenté: ${notification.channel}`, 
            LogEventType.SYSTEM_WARNING, { details: notification });
      }
      
      // Mettre à jour le statut de la notification
      notification.status = 'SENT';
      notification.sentAt = new Date();
      
    } catch (error) {
      logger.error('Erreur lors du traitement de la notification', LogEventType.SYSTEM_ERROR, {
        details: { error, notification }
      });
      
      notification.status = 'FAILED';
    }
  }
  
  /**
   * Envoyer une notification par email
   */
  private async sendEmailNotification(notification: Notification): Promise<void> {
    if (!this.emailTransporter) {
      throw new Error('Transporteur email non initialisé');
    }
    
    if (!notification.recipientEmail) {
      throw new Error('Email du destinataire manquant');
    }
    
    try {
      const result = await this.emailTransporter.sendMail({
        from: `"Système de Gestion Motos" <${process.env.SMTP_FROM || 'noreply@moto-circuit.fr'}>`,
        to: notification.recipientEmail,
        subject: notification.title,
        text: notification.message,
        html: this.generateHtmlEmail(notification),
      });
      
      logger.info(`Email envoyé: ${result.messageId}`, LogEventType.SYSTEM_INFO, {
        details: { notification, messageId: result.messageId }
      });
      
      // En mode développement, afficher l'URL de prévisualisation
      if (process.env.NODE_ENV !== 'production') {
        console.log('URL de prévisualisation:', nodemailer.getTestMessageUrl(result));
      }
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de l\'email', LogEventType.SYSTEM_ERROR, {
        details: { error, notification }
      });
      throw error;
    }
  }
  
  /**
   * Générer le contenu HTML d'un email
   */
  private generateHtmlEmail(notification: Notification): string {
    // Ici, vous pourriez utiliser un moteur de template comme Handlebars
    // Pour simplifier, nous créons juste du HTML basique
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${notification.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f0f0f0; padding: 10px; border-radius: 5px; }
            .content { padding: 20px 0; }
            .footer { font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${notification.title}</h2>
            </div>
            <div class="content">
              <p>${notification.message}</p>
              ${notification.payload ? `<pre>${JSON.stringify(notification.payload, null, 2)}</pre>` : ''}
            </div>
            <div class="footer">
              <p>Ceci est un message automatique du système de gestion des motos de circuit.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  
  /**
   * Sauvegarder une notification in-app dans la base de données
   */
  private async saveInAppNotification(notification: Notification): Promise<void> {
    try {
      // Dans un projet réel, vous sauvegarderiez ceci dans la base de données
      // avec Prisma, par exemple:
      /*
      await prisma.inAppNotification.create({
        data: {
          title: notification.title,
          message: notification.message,
          userId: notification.recipientId,
          eventType: notification.eventType,
          isRead: false,
          payload: notification.payload
        }
      });
      */
      
      logger.info('Notification in-app créée', LogEventType.SYSTEM_INFO, {
        details: notification
      });
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde de la notification in-app', LogEventType.SYSTEM_ERROR, {
        details: { error, notification }
      });
      throw error;
    }
  }
  
  /**
   * Déclencher les webhooks pour un événement donné
   */
  private async triggerWebhooks(notification: Notification): Promise<void> {
    try {
      // Récupérer tous les webhooks actifs pour ce type d'événement
      const webhooks = await this.getActiveWebhooks(notification.eventType);
      
      if (webhooks.length === 0) {
        return;
      }
      
      // Préparer le payload à envoyer
      const payload = {
        id: crypto.randomUUID(),
        eventType: notification.eventType,
        timestamp: new Date().toISOString(),
        data: notification.payload || {},
      };
      
      // Déclencher chaque webhook en parallèle
      await Promise.all(webhooks.map(webhook => 
        this.callWebhook(webhook, payload)
      ));
      
    } catch (error) {
      logger.error('Erreur lors du déclenchement des webhooks', LogEventType.SYSTEM_ERROR, {
        details: { error, notification }
      });
      throw error;
    }
  }
  
  /**
   * Récupérer tous les webhooks actifs pour un type d'événement
   */
  private async getActiveWebhooks(eventType: NotificationEventType): Promise<WebhookConfig[]> {
    try {
      // Dans un projet réel, vous récupéreriez cela depuis la base de données
      // avec Prisma, par exemple:
      /*
      return prisma.webhook.findMany({
        where: {
          isActive: true,
          eventTypes: {
            has: eventType
          }
        }
      });
      */
      
      // Pour cet exemple, nous retournons un tableau vide
      return [];
    } catch (error) {
      logger.error('Erreur lors de la récupération des webhooks', LogEventType.SYSTEM_ERROR, {
        details: { error, eventType }
      });
      return [];
    }
  }
  
  /**
   * Appeler un webhook spécifique
   */
  private async callWebhook(webhook: WebhookConfig, payload: any): Promise<void> {
    try {
      // Préparer les en-têtes
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...webhook.headers || {}
      };
      
      // Ajouter une signature de sécurité si un secret est configuré
      if (webhook.secret) {
        const signature = this.generateWebhookSignature(payload, webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }
      
      // Appeler le webhook
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      
      // Vérifier la réponse
      if (!response.ok) {
        throw new Error(`Webhook responded with status ${response.status}: ${await response.text()}`);
      }
      
      // Mettre à jour les statistiques du webhook
      // Dans un projet réel, vous mettriez à jour la base de données
      
      logger.info(`Webhook déclenché avec succès: ${webhook.name}`, LogEventType.SYSTEM_INFO, {
        details: { webhook: webhook.id, payload }
      });
    } catch (error) {
      logger.error(`Échec de l'appel au webhook: ${webhook.name}`, LogEventType.SYSTEM_ERROR, {
        details: { error, webhook: webhook.id, payload }
      });
      
      // Dans un projet réel, vous mettriez à jour le compteur d'échecs
      // et désactiveriez éventuellement le webhook s'il échoue trop souvent
      
      throw error;
    }
  }
  
  /**
   * Générer une signature HMAC pour un webhook
   */
  private generateWebhookSignature(payload: any, secret: string): string {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }
  
  /**
   * Envoyer une notification pour un entretien à venir
   */
  public async sendMaintenanceReminder(
    entity: { id: string; numSerie: string; type: 'moto' | 'moteur' },
    kilometrageRestant: number,
    recipientEmail: string
  ): Promise<void> {
    const title = `Rappel d'entretien pour ${entity.type} ${entity.numSerie}`;
    let message = '';
    
    if (kilometrageRestant <= 0) {
      message = `L'entretien pour ${entity.type} ${entity.numSerie} est maintenant DÉPASSÉ. Veuillez planifier une maintenance dès que possible.`;
    } else {
      message = `Un entretien est requis dans ${kilometrageRestant} km pour ${entity.type} ${entity.numSerie}.`;
    }
    
    await this.createNotification({
      eventType: kilometrageRestant <= 0 
        ? NotificationEventType.MAINTENANCE_OVERDUE 
        : NotificationEventType.MAINTENANCE_DUE,
      title,
      message,
      channel: NotificationChannel.EMAIL,
      recipientEmail,
      payload: {
        entityId: entity.id,
        entityType: entity.type,
        numSerie: entity.numSerie,
        kilometrageRestant
      }
    });
  }
  
  /**
   * Envoyer une notification pour un stock bas
   */
  public async sendLowStockAlert(
    piece: { id: string; reference: string; nom: string; quantiteStock: number; quantiteMinimale: number },
    recipientEmail: string
  ): Promise<void> {
    const isOutOfStock = piece.quantiteStock === 0;
    
    const title = isOutOfStock 
      ? `STOCK ÉPUISÉ: ${piece.nom}` 
      : `Stock bas: ${piece.nom}`;
      
    const message = isOutOfStock
      ? `La pièce ${piece.nom} (réf: ${piece.reference}) est ÉPUISÉE. Veuillez commander de nouvelles pièces.`
      : `Le stock de la pièce ${piece.nom} (réf: ${piece.reference}) est bas: ${piece.quantiteStock}/${piece.quantiteMinimale}.`;
    
    await this.createNotification({
      eventType: isOutOfStock 
        ? NotificationEventType.STOCK_OUT 
        : NotificationEventType.STOCK_LOW,
      title,
      message,
      channel: NotificationChannel.EMAIL,
      recipientEmail,
      payload: {
        pieceId: piece.id,
        reference: piece.reference,
        nom: piece.nom,
        quantiteStock: piece.quantiteStock,
        quantiteMinimale: piece.quantiteMinimale
      }
    });
  }
  
  /**
   * Envoyer une notification pour un contrôle journalier échoué
   */
  public async sendFailedControlAlert(
    controle: { 
      id: string; 
      cycleId: string; 
      date: Date; 
      controleur: string;
      cycle: { numSerie: string; modele: string } 
    },
    problemes: string[],
    recipientEmail: string
  ): Promise<void> {
    const title = `Contrôle échoué: ${controle.cycle.numSerie}`;
    const message = `
      Le contrôle journalier de la moto ${controle.cycle.numSerie} (${controle.cycle.modele}) a échoué.
      
      Problèmes détectés:
      ${problemes.map(p => `- ${p}`).join('\n')}
      
      Contrôleur: ${controle.controleur}
      Date: ${controle.date.toLocaleDateString()}
    `;
    
    await this.createNotification({
      eventType: NotificationEventType.CONTROL_FAILED,
      title,
      message,
      channel: NotificationChannel.EMAIL,
      recipientEmail,
      payload: {
        controleId: controle.id,
        cycleId: controle.cycleId,
        numSerie: controle.cycle.numSerie,
        modele: controle.cycle.modele,
        problemes,
        controleur: controle.controleur,
        date: controle.date
      }
    });
  }
}