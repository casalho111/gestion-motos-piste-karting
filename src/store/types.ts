// Types communs pour les stores

export type Status = 'idle' | 'loading' | 'success' | 'error';

// Type générique pour les états de requête
export interface QueryState<T> {
  data: T | null;
  status: Status;
  error: string | null;
  timestamp: number | null;
}

// Interface générique pour la pagination
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Type pour le résultat d'une requête paginée
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    pageCount: number;
    currentPage: number;
    perPage: number;
  };
}

// Type générique pour un formulaire
export interface FormState<T> {
  data: Partial<T>;
  errors: Record<string, string>;
  status: Status;
}

// Type pour les filtres génériques
export interface FilterState {
  search: string;
  sortBy: string | null;
  sortDirection: 'asc' | 'desc';
  [key: string]: any;
}

// Types pour les préférences utilisateur
export interface ThemePreference {
  theme: 'light' | 'dark' | 'system';
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface UIPreference {
  sidebarCollapsed: boolean;
  tableCompactMode: boolean;
  cardsPerRow: number;
  showNotifications: boolean;
  dashboardLayout: string[];
}

// Interface pour le cache
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}