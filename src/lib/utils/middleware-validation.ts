import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Types d'utilisateurs du système
export enum UserRole {
  EDUCATEUR = 'EDUCATEUR',
  TECHNICIEN = 'TECHNICIEN',
  ADMINISTRATEUR = 'ADMINISTRATEUR'
}

// Interface pour le contexte de la demande
export interface RequestContext {
  user?: {
    id: string;
    name: string;
    role: UserRole;
  };
  timestamp: number;
}

// Options pour les middlewares
export interface MiddlewareOptions {
  validation?: z.ZodType<any>;
  requiredRoles?: UserRole[];
  revalidatePaths?: string[];
}

/**
 * Middleware qui combine validation Zod et vérification des permissions
 */
export function withMiddleware<T, R>(
  handler: (data: T, context: RequestContext) => Promise<R>,
  options: MiddlewareOptions = {}
) {
  return async (data: unknown, requestContext: Partial<RequestContext> = {}): Promise<{
    success: boolean;
    data?: R;
    error?: string;
    validationErrors?: z.ZodError['errors'];
  }> => {
    try {
      // Compléter le contexte de la demande
      const context: RequestContext = {
        timestamp: Date.now(),
        ...requestContext
      };

      // 1. Validation des données si un schéma est fourni
      let validatedData: T;
      if (options.validation) {
        try {
          validatedData = options.validation.parse(data) as T;
        } catch (error) {
          if (error instanceof z.ZodError) {
            return {
              success: false,
              error: 'Données invalides',
              validationErrors: error.errors
            };
          }
          throw error;
        }
      } else {
        validatedData = data as T;
      }

      // 2. Vérification des permissions si des rôles sont requis
      if (options.requiredRoles && options.requiredRoles.length > 0) {
        const userRole = context.user?.role;
        
        if (!userRole) {
          return {
            success: false,
            error: 'Authentification requise'
          };
        }

        if (!options.requiredRoles.includes(userRole)) {
          return {
            success: false,
            error: 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action'
          };
        }
      }

      // 3. Exécution du handler
      const result = await handler(validatedData, context);

      // 4. Revalidation des chemins si spécifiés
      if (options.revalidatePaths && options.revalidatePaths.length > 0) {
        for (const path of options.revalidatePaths) {
          revalidatePath(path);
        }
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Erreur middleware:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur inattendue est survenue'
      };
    }
  };
}

/**
 * Crée un middleware pour les routes API (Route Handlers)
 */
export function createApiMiddleware<T, R>(
  handler: (data: T, context: RequestContext) => Promise<R>,
  options: MiddlewareOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Extraire le corps de la requête
      const requestData = await request.json().catch(() => ({}));
      
      // Extraire les informations d'utilisateur
      // Dans un système réel, ceci viendrait de l'authentification (ex: NextAuth.js)
      const user = {
        id: request.headers.get('x-user-id') || 'unknown',
        name: request.headers.get('x-user-name') || 'Unknown User',
        role: (request.headers.get('x-user-role') as UserRole) || UserRole.EDUCATEUR
      };

      // Créer le contexte
      const context: RequestContext = {
        user,
        timestamp: Date.now()
      };

      // Utiliser le middleware standard
      const result = await withMiddleware(handler, options)(requestData, context);

      if (result.success) {
        return NextResponse.json(result, { status: 200 });
      } else {
        // 400 pour les erreurs de validation, 403 pour les erreurs de permission, 500 pour le reste
        const status = 
          result.validationErrors ? 400 : 
          result.error === 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action' ? 403 : 
          500;
        
        return NextResponse.json(result, { status });
      }
    } catch (error) {
      console.error('Erreur API:', error);
      
      return NextResponse.json(
        { success: false, error: 'Erreur serveur' },
        { status: 500 }
      );
    }
  };
}

/**
 * Récupère le contexte utilisateur actuel
 * (Dans un système réel, ceci utiliserait NextAuth ou une autre solution d'authentification)
 */
export async function getCurrentUserContext(): Promise<RequestContext> {
  // Simulation - Dans une application réelle, ceci viendrait de votre système d'authentification
  return {
    user: {
      id: 'user-001',
      name: 'Sophie Durand',
      role: UserRole.TECHNICIEN
    },
    timestamp: Date.now()
  };
}