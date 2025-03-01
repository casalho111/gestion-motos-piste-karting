import { z } from 'zod';
import { EtatEntite, TypeEntretien, TypePiece, TypeUtilisation, Criticite } from '@prisma/client';

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