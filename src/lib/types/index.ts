import { 
    EtatEntite, 
    TypeEntretien, 
    Criticite, 
    TypePiece, 
    TypeUtilisation,
    PartieCycle,
    Moteur,
    Maintenance,
    Piece,
    ControleJournalier,
    Utilisation,
    PlanningMaintenance,
    Alerte
  } from '@prisma/client';
  
  // Re-export des types générés par Prisma
  export {
    EtatEntite,
    TypeEntretien,
    Criticite,
    TypePiece,
    TypeUtilisation
  };
  
  // Types pour les filtres
  export type FiltrePartieCycle = {
    modele?: string;
    etat?: EtatEntite;
    moteurMonte?: boolean;
    recherche?: string;
  };
  
  export type FiltreMoteur = {
    type?: string;
    cylindree?: number;
    etat?: EtatEntite;
    estMonte?: boolean;
    recherche?: string;
  };
  
  export type FiltreMaintenance = {
    type?: TypeEntretien;
    dateDebut?: Date;
    dateFin?: Date;
    entite?: 'cycle' | 'moteur' | 'all';
    entiteId?: string;
    technicien?: string;
  };
  
  // Types pour la pagination
  export type PaginationParams = {
    page: number;
    pageSize: number;
    totalItems?: number;
    totalPages?: number;
  };
  
  export type ResultatPagine<T> = {
    donnees: T[];
    pagination: PaginationParams;
  };
  
  // Types pour les statistiques
  export type StatistiquesGlobales = {
    nbCyclesDisponibles: number;
    nbMoteursDisponibles: number;
    nbEntretiensAVenir: number;
    alertesStock: number;
    coutTotal: {
      mensuel: number;
      trimestriel: number;
      annuel: number;
    };
    distanceTotale: {
      mensuel: number;
      trimestriel: number;
      annuel: number;
    };
  };
  
  export type StatistiquesMoto = {
    cycleId: string;
    modele: string;
    kilometrage: number;
    couts: {
      mensuel: number;
      trimestriel: number;
      annuel: number;
    };
    utilisations: {
      mensuel: number;
      trimestriel: number;
      annuel: number;
    };
    tempsMoyen: number; // Temps moyen entre entretiens en jours
  };
  
  // Types pour les requêtes
  export type CreationPartieCycle = Omit<PartieCycle, 'id' | 'createdAt' | 'updatedAt' | 'kilometrage'> & {
    kilometrage?: number;
  };
  
  export type MiseAJourPartieCycle = Partial<Omit<PartieCycle, 'id' | 'createdAt' | 'updatedAt'>>;
  
  // Types similaires pour les autres entités...