import { EtatEntite } from '@prisma/client';
import { z } from 'zod';
import { partieCycleSchema } from '@/lib/validations';
import { TypePiece } from '@prisma/client';
import { pieceSchema } from '@/lib/validations';
import { TypeEntretien } from '@prisma/client';
import { maintenanceSchema } from '@/lib/validations';
import { Criticite } from '@prisma/client';


export type Theme = 'light' | 'dark' | 'system';
export type ViewMode = 'card' | 'table';
export type DensityMode = 'compact' | 'comfortable';

// Type représentant une moto dans le frontend
export interface Moto {
  id: string;
  numSerie: string;
  modele: string;
  dateAcquisition: Date;
  kilometrage: number;
  etat: EtatEntite;
  notesEtat: string | null;
  couleur: string | null;
  moteurCourantId: string | null;
  createdAt: Date;
  updatedAt: Date;
  moteurCourant?: MotoMoteur | null;
  controles?: any[];
  maintenances?: any[];
  utilisations?: any[];
  historiquesMontage?: any[];
}

// Type pour les moteurs liés aux motos
export interface MotoMoteur {
  id: string;
  numSerie: string;
  type: string;
  cylindree: number;
  dateAcquisition: Date;
  kilometrage: number;
  heuresMoteur: number | null;
  etat: EtatEntite;
  notesEtat: string | null;
}

export interface MoteurFilterOptions extends FilterOptions {
  estMonte?: boolean;
}

// Type pour les réponses des Server Actions
export interface ServerActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: any[];
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
}

export interface FilterOptions {
  search?: string;
  etat?: EtatEntite;
  modele?: string;
}

export type Piece = z.infer<typeof pieceSchema> & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface PieceFilterOptions extends FilterOptions {
  type?: TypePiece;
  stockBas?: boolean;
}

export interface PartieCycle {
  id: string;
  nom: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Maintenance = z.infer<typeof maintenanceSchema> & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface MaintenanceFilterOptions extends FilterOptions {
  type?: TypeEntretien;
  cycleId?: string;
  moteurId?: string;
  dateDebut?: Date;
  dateFin?: Date;
}

export interface PieceUtilisee {
  pieceId: string;
  quantite: number;
  prixUnitaire?: number;
} 

export interface DashboardStats {
  cycles: {
    total: number;
    disponibles: number;
    enMaintenance: number;
    aVerifier: number;
    horsService: number;
  };
  moteurs: {
    total: number;
    disponibles: number;
    montes: number;
    enMaintenance: number;
    horsService: number;
  };
  maintenances: {
    recentes: any[]; // Simplifié pour cet exemple
    coutTotal: number;
  };
  alertes: {
    piecesStockBas: any[]; // Simplifié pour cet exemple
  };
  activite: {
    controles: any[]; // Simplifié pour cet exemple
    montages: any[]; // Simplifié pour cet exemple
  };
  utilisation: {
    hebdomadaire: any[]; // Simplifié pour cet exemple
  };
}

export interface MaintenanceStats {
  total: {
    count: number;
    cout: number;
  };
  coutParType: Record<string, number>;
  coutParModele: Record<string, number>;
  piecesLesPlusUtilisees: any[]; // Simplifié pour cet exemple
  maintenances: any[]; // Simplifié pour cet exemple
}

export interface UtilisationStats {
  cycle: {
    id: string;
    numSerie: string;
    modele: string;
  };
  totalDistance: number;
  totalTours: number;
  sessionCount: number;
  utilisations: any[]; // Simplifié pour cet exemple
}

export interface TimeRangeOption {
  label: string;
  value: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Types pour les alertes
export type AlertType = 'maintenance' | 'stock' | 'technical' | 'info';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  date: Date;
  criticite: Criticite;
  isRead: boolean;
  entity?: {
    id: string;
    type: 'moto' | 'moteur' | 'piece';
    name: string;
  };
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}
