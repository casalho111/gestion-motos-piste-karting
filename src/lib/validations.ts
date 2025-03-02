import { z } from 'zod';
import { EtatEntite, TypeEntretien, TypePiece, TypeUtilisation, Criticite } from '@prisma/client';

// ==== SCHÉMAS DE BASE POUR LES ENTITÉS PRINCIPALES ====

// Schéma pour la Partie Cycle
export const partieCycleSchema = z.object({
  numSerie: z.string().min(1, "Le numéro de série est requis"),
  modele: z.string().min(1, "Le modèle est requis"),
  dateAcquisition: z.date(),
  etat: z.nativeEnum(EtatEntite),
  notesEtat: z.string().optional(),
  couleur: z.string().optional(),
  moteurCourantId: z.string().optional(),
});

// Schéma pour le Moteur
export const moteurSchema = z.object({
  numSerie: z.string().min(1, "Le numéro de série est requis"),
  type: z.string().min(1, "Le type est requis"),
  cylindree: z.number().int().default(125),
  dateAcquisition: z.date(),
  heuresMoteur: z.number().optional(),
  etat: z.nativeEnum(EtatEntite),
  notesEtat: z.string().optional(),
});

// Schéma pour l'Historique de Montage
export const historiqueMontageSchema = z.object({
  dateDebut: z.date(),
  dateFin: z.date().optional(),
  kilometrageDebutCycle: z.number(),
  kilometrageDebutMoteur: z.number(),
  kilometrageFinCycle: z.number().optional(),
  kilometrageFinMoteur: z.number().optional(),
  technicien: z.string().min(1, "Le nom du technicien est requis"),
  notes: z.string().optional(),
  cycleId: z.string(),
  moteurId: z.string(),
});

// Schéma pour la Maintenance
export const maintenanceSchema = z.object({
  type: z.nativeEnum(TypeEntretien),
  dateRealisation: z.date(),
  kilometrageEffectue: z.number(),
  coutTotal: z.number().default(0),
  technicien: z.string().min(1, "Le nom du technicien est requis"),
  description: z.string().min(1, "La description est requise"),
  notes: z.string().optional(),
  cycleId: z.string().optional(),
  moteurId: z.string().optional(),
  piecesUtilisees: z.array(
    z.object({
      pieceId: z.string(),
      quantite: z.number().int().min(1),
    })
  ).optional(),
});

// Schéma pour les pièces
export const pieceSchema = z.object({
  reference: z.string().min(1, "La référence est requise"),
  nom: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  type: z.nativeEnum(TypePiece),
  fournisseur: z.string().optional(),
  prixUnitaire: z.number().min(0),
  quantiteStock: z.number().int().default(0),
  quantiteMinimale: z.number().int().default(1),
  emplacement: z.string().optional(),
});

// Schéma pour le Contrôle Journalier
export const controleJournalierSchema = z.object({
  date: z.date(),
  controleur: z.string().min(1, "Le nom du contrôleur est requis"),
  estConforme: z.boolean(),
  freinsAvant: z.boolean().default(true),
  freinsArriere: z.boolean().default(true),
  pneus: z.boolean().default(true),
  suspensions: z.boolean().default(true),
  transmission: z.boolean().default(true),
  niveauxFluides: z.boolean().default(true),
  eclairage: z.boolean().default(true),
  autres: z.string().optional(),
  commentaires: z.string().optional(),
  cycleId: z.string(),
});

// Schéma pour l'Utilisation
export const utilisationSchema = z.object({
  date: z.date(),
  responsable: z.string().min(1, "Le nom du responsable est requis"),
  nbTours: z.number().int().min(1),
  distanceTour: z.number().default(800),
  type: z.nativeEnum(TypeUtilisation).default(TypeUtilisation.SESSION_NORMALE),
  notes: z.string().optional(),
  cycleId: z.string(),
});

// Schéma pour le Planning de Maintenance
export const planningMaintenanceSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  type: z.nativeEnum(TypeEntretien),
  dateEstimee: z.date(),
  estMoteur: z.boolean(),
  entiteId: z.string(),
  kilometragePrevu: z.number(),
  criticite: z.nativeEnum(Criticite).default(Criticite.MOYENNE),
  technicienAssigne: z.string().optional(),
  estComplete: z.boolean().default(false),
});

// ==== SCHÉMAS ADDITIONNELS ====

// Schéma pour les alertes
export const alerteSchema = z.object({
  titre: z.string().min(1, "Le titre est requis"),
  message: z.string().min(1, "Le message est requis"),
  type: z.string().min(1, "Le type est requis"),
  criticite: z.nativeEnum(Criticite),
  estTraitee: z.boolean().default(false),
  traitePar: z.string().optional(),
  dateTraitement: z.date().optional(),
  cycleId: z.string().optional(),
  moteurId: z.string().optional(),
  pieceId: z.string().optional(),
});

// Schéma pour les entrées du journal
export const journalSchema = z.object({
  eventType: z.string(),
  severity: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']),
  userId: z.string().optional(),
  userName: z.string().optional(),
  message: z.string().min(1, "Le message est requis"),
  details: z.any().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Schéma pour les notifications
export const notificationSchema = z.object({
  eventType: z.string(),
  title: z.string().min(1, "Le titre est requis"),
  message: z.string().min(1, "Le message est requis"),
  channel: z.enum(['EMAIL', 'SMS', 'PUSH', 'WEBHOOK', 'IN_APP']),
  recipientId: z.string().optional(),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().optional(),
  status: z.enum(['PENDING', 'SENT', 'FAILED', 'CANCELLED']).default('PENDING'),
  payload: z.any().optional(),
  metadata: z.record(z.any()).optional(),
});

// Schéma pour les webhooks
export const webhookSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  url: z.string().url("L'URL doit être valide"),
  eventTypes: z.array(z.string()).min(1, "Au moins un type d'événement est requis"),
  isActive: z.boolean().default(true),
  secret: z.string().optional(),
  headers: z.record(z.string()).optional(),
  failureCount: z.number().int().default(0),
});

// ==== SCHÉMAS POUR LES REQUÊTES SPÉCIFIQUES ====

// Schéma pour la requête de montage de moteur
export const monterMoteurSchema = z.object({
  moteurId: z.string(),
  cycleId: z.string(),
  technicien: z.string().min(1, "Le nom du technicien est requis"),
  date: z.date().default(() => new Date()),
  notes: z.string().optional(),
});

// Schéma pour la requête de démontage de moteur
export const demonterMoteurSchema = z.object({
  cycleId: z.string(),
  technicien: z.string().min(1, "Le nom du technicien est requis"),
  date: z.date().default(() => new Date()),
  notes: z.string().optional(),
});

// Schéma pour le traitement d'une alerte
export const traiterAlerteSchema = z.object({
  id: z.string(),
  utilisateur: z.string().min(1, "Le nom de l'utilisateur est requis"),
});

// Schéma pour l'ajustement de stock
export const ajusterStockSchema = z.object({
  id: z.string(),
  quantite: z.number().int(),
  notes: z.string().optional(),
});

// Schéma pour la finalisation d'une maintenance
export const finaliserMaintenanceSchema = z.object({
  id: z.string(),
  notes: z.string().optional(),
});

// Schéma pour la complétion d'un planning de maintenance
export const completerPlanningMaintenanceSchema = z.object({
  id: z.string(),
  maintenanceId: z.string().optional(),
});

// Schéma pour la mise à jour du kilométrage d'une moto
export const updateMotoKilometrageSchema = z.object({
  id: z.string(),
  nouveauKilometrage: z.number().positive("Le kilométrage doit être positif"),
}).refine(data => data.nouveauKilometrage > 0, {
  message: "Le nouveau kilométrage doit être supérieur à zéro",
  path: ["nouveauKilometrage"],
});

// Schéma pour le changement d'état d'une entité
export const changeEtatSchema = z.object({
  id: z.string(),
  nouvelEtat: z.nativeEnum(EtatEntite),
  notes: z.string().optional(),
});

// ==== SCHÉMAS POUR LES FILTRES ET OPTIONS DE REQUÊTE ====

// Options de pagination de base
export const paginationOptionsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

// Filtre pour les motos
export const motoFilterSchema = paginationOptionsSchema.extend({
  etat: z.nativeEnum(EtatEntite).optional(),
  modele: z.string().optional(),
  search: z.string().optional(),
});

// Filtre pour les moteurs
export const moteurFilterSchema = paginationOptionsSchema.extend({
  etat: z.nativeEnum(EtatEntite).optional(),
  type: z.string().optional(),
  estMonte: z.boolean().optional(),
  search: z.string().optional(),
});

// Filtre pour les maintenances
export const maintenanceFilterSchema = paginationOptionsSchema.extend({
  type: z.nativeEnum(TypeEntretien).optional(),
  cycleId: z.string().optional(),
  moteurId: z.string().optional(),
  dateDebut: z.date().optional(),
  dateFin: z.date().optional(),
});

// Filtre pour les pièces
export const pieceFilterSchema = paginationOptionsSchema.extend({
  type: z.nativeEnum(TypePiece).optional(),
  stockBas: z.boolean().optional(),
  search: z.string().optional(),
});

// Filtre pour les contrôles
export const controleFilterSchema = paginationOptionsSchema.extend({
  cycleId: z.string().optional(),
  dateDebut: z.date().optional(),
  dateFin: z.date().optional(),
  estConforme: z.boolean().optional(),
});

// Filtre pour les utilisations
export const utilisationFilterSchema = paginationOptionsSchema.extend({
  cycleId: z.string().optional(),
  dateDebut: z.date().optional(),
  dateFin: z.date().optional(),
});

// Filtre pour les alertes
export const alerteFilterSchema = paginationOptionsSchema.extend({
  type: z.string().optional(),
  criticite: z.nativeEnum(Criticite).optional(),
  estTraitee: z.boolean().optional(),
  search: z.string().optional(),
});

// Filtre pour les plannings de maintenance
export const planningMaintenanceFilterSchema = paginationOptionsSchema.extend({
  type: z.nativeEnum(TypeEntretien).optional(),
  estComplete: z.boolean().optional(),
  dateMin: z.date().optional(),
  dateMax: z.date().optional(),
  criticite: z.nativeEnum(Criticite).optional(),
});

// ==== SCHÉMAS COMPOSÉS POUR DES CAS D'UTILISATION SPÉCIFIQUES ====

// Schéma pour l'enregistrement d'une session avec calcul du kilométrage
export const enregistrerSessionSchema = utilisationSchema.refine(
  data => data.nbTours > 0 && data.distanceTour > 0,
  {
    message: "Le nombre de tours et la distance du tour doivent être positifs",
    path: ["nbTours", "distanceTour"]
  }
);

// Schéma pour la création d'une maintenance avec gestion des pièces
export const createMaintenanceSchema = maintenanceSchema.extend({
  // Validation supplémentaire pour s'assurer qu'au moins un cycleId ou moteurId est fourni
}).refine(
  data => data.cycleId || data.moteurId,
  {
    message: "Une maintenance doit concerner au moins une partie cycle ou un moteur",
    path: ["cycleId", "moteurId"]
  }
);

// Schéma pour le contrôle journalier avec gestion automatique des alertes
export const createControleJournalierSchema = controleJournalierSchema.extend({
  // Ajout d'une validation spécifique pour les contrôles non conformes
}).refine(
  data => data.estConforme || data.commentaires,
  {
    message: "Des commentaires sont requis pour les contrôles non conformes",
    path: ["commentaires"]
  }
);

// Export des schémas partiels utiles pour les mises à jour partielles
export const partialPartieCycleSchema = partieCycleSchema.partial();
export const partialMoteurSchema = moteurSchema.partial();
export const partialPieceSchema = pieceSchema.partial();

// ==== HELPERS POUR LA VALIDATION ====

/**
 * Transforme un schéma existant pour le rendre entièrement optionnel
 * Utile pour les opérations PATCH
 */
export function createPatchSchema<T extends z.ZodObject<any>>(schema: T) {
  return schema.partial();
}

/**
 * Crée un schéma pour les opérations de filtrage et tri
 */
export function createFilterSortSchema<T extends z.ZodObject<any>>(filterSchema: T) {
  return filterSchema.extend({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  });
}

/**
 * Crée un schéma pour les paramètres d'ID
 */
export const idParamSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
});