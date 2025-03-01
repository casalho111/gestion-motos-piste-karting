'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { maintenanceSchema } from '@/lib/validations';
import { EtatEntite, TypeEntretien } from '@prisma/client';
import { z } from 'zod';

/**
 * Obtenir les maintenances avec pagination et filtres
 */
export async function getMaintenances({
  page = 1,
  limit = 10,
  type,
  cycleId,
  moteurId,
  dateDebut,
  dateFin
}: {
  page?: number;
  limit?: number;
  type?: TypeEntretien;
  cycleId?: string;
  moteurId?: string;
  dateDebut?: Date;
  dateFin?: Date;
}) {
  try {
    // Construire la condition where dynamiquement
    const where: any = {};
    
    if (type) {
      where.type = type;
    }
    
    if (cycleId) {
      where.cycleId = cycleId;
    }
    
    if (moteurId) {
      where.moteurId = moteurId;
    }
    
    if (dateDebut || dateFin) {
      where.dateRealisation = {};
      
      if (dateDebut) {
        where.dateRealisation.gte = dateDebut;
      }
      
      if (dateFin) {
        where.dateRealisation.lte = dateFin;
      }
    }
    
    // Récupérer les données avec pagination
    const skip = (page - 1) * limit;
    
    const [maintenances, total] = await Promise.all([
      prisma.maintenance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dateRealisation: 'desc' },
        include: {
          cycle: true,
          moteur: true,
          piecesUtilisees: {
            include: {
              piece: true
            }
          }
        }
      }),
      prisma.maintenance.count({ where })
    ]);
    
    return {
      data: maintenances,
      pagination: {
        total,
        pageCount: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des maintenances:', error);
    throw new Error('Impossible de récupérer les maintenances. Veuillez réessayer.');
  }
}

/**
 * Obtenir une maintenance par ID
 */
export async function getMaintenanceById(id: string) {
  try {
    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
      include: {
        cycle: true,
        moteur: true,
        piecesUtilisees: {
          include: {
            piece: true
          }
        }
      }
    });
    
    if (!maintenance) {
      throw new Error('Maintenance non trouvée');
    }
    
    return maintenance;
  } catch (error) {
    console.error('Erreur lors de la récupération de la maintenance:', error);
    throw new Error('Impossible de récupérer la maintenance. Veuillez réessayer.');
  }
}

// Type spécifique pour la création de maintenance avec pièces
type PieceUtiliseeInput = {
  pieceId: string;
  quantite: number;
  prixUnitaire?: number; // Optionnel, sinon on prend le prix actuel de la pièce
};

type MaintenanceInput = z.infer<typeof maintenanceSchema> & {
  piecesUtilisees?: PieceUtiliseeInput[];
};

/**
 * Créer une nouvelle maintenance
 */
export async function createMaintenance(data: MaintenanceInput) {
  try {
    // Valider les données de base avec Zod
    const validatedBaseData = maintenanceSchema.parse(data);
    
    // Vérifier qu'au moins un cycleId ou moteurId est fourni
    if (!validatedBaseData.cycleId && !validatedBaseData.moteurId) {
      return {
        success: false,
        error: 'Une maintenance doit concerner au moins une partie cycle ou un moteur'
      };
    }
    
    // Transaction pour garantir l'intégrité des données
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour l'état des entités concernées
      if (validatedBaseData.cycleId) {
        await tx.partieCycle.update({
          where: { id: validatedBaseData.cycleId },
          data: { etat: EtatEntite.EN_MAINTENANCE }
        });
      }
      
      if (validatedBaseData.moteurId) {
        await tx.moteur.update({
          where: { id: validatedBaseData.moteurId },
          data: { etat: EtatEntite.EN_MAINTENANCE }
        });
      }
      
      // 2. Calculer le coût total des pièces
      let coutPieces = 0;
      const piecesUtiliseesData = [];
      
      if (data.piecesUtilisees && data.piecesUtilisees.length > 0) {
        for (const pieceInput of data.piecesUtilisees) {
          // Récupérer les informations de la pièce
          const piece = await tx.piece.findUnique({
            where: { id: pieceInput.pieceId }
          });
          
          if (!piece) {
            throw new Error(`Pièce non trouvée: ${pieceInput.pieceId}`);
          }
          
          // Vérifier le stock
          if (piece.quantiteStock < pieceInput.quantite) {
            throw new Error(`Stock insuffisant pour la pièce ${piece.nom} (${piece.quantiteStock} disponibles, ${pieceInput.quantite} demandées)`);
          }
          
          // Utiliser le prix spécifié ou le prix actuel de la pièce
          const prixUnitaire = pieceInput.prixUnitaire || piece.prixUnitaire;
          
          // Mettre à jour le stock
          await tx.piece.update({
            where: { id: pieceInput.pieceId },
            data: {
              quantiteStock: {
                decrement: pieceInput.quantite
              }
            }
          });
          
          // Calculer le coût de cette pièce
          const coutPiece = prixUnitaire * pieceInput.quantite;
          coutPieces += coutPiece;
          
          // Ajouter aux données de pièces utilisées
          piecesUtiliseesData.push({
            pieceId: pieceInput.pieceId,
            quantite: pieceInput.quantite,
            prixUnitaire
          });
        }
      }
      
      // 3. Créer l'enregistrement de maintenance
      const maintenanceData = {
        ...validatedBaseData,
        coutTotal: validatedBaseData.coutTotal + coutPieces
      };
      
      const newMaintenance = await tx.maintenance.create({
        data: {
          ...maintenanceData,
          piecesUtilisees: {
            create: piecesUtiliseesData
          }
        }
      });
      
      return { maintenance: newMaintenance, coutPieces };
    });
    
    // Revalider les chemins concernés
    if (validatedBaseData.cycleId) {
      revalidatePath(`/dashboard/motos/${validatedBaseData.cycleId}`);
    }
    
    if (validatedBaseData.moteurId) {
      revalidatePath(`/dashboard/moteurs/${validatedBaseData.moteurId}`);
    }
    
    revalidatePath('/dashboard/maintenances');
    
    return { 
      success: true, 
      data: result.maintenance,
      coutPieces: result.coutPieces
    };
  } catch (error) {
    console.error('Erreur lors de la création de la maintenance:', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Données invalides', 
        validationErrors: error.errors 
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Impossible de créer la maintenance' 
    };
  }
}

/**
 * Finaliser une maintenance (changement d'état)
 */
export async function finaliserMaintenance(
  id: string,
  notes?: string
) {
  try {
    // Obtenir les détails de la maintenance
    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
      include: {
        cycle: true,
        moteur: true
      }
    });
    
    if (!maintenance) {
      return {
        success: false,
        error: 'Maintenance non trouvée'
      };
    }
    
    // Transaction pour garantir l'intégrité des données
    await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour les notes de la maintenance si nécessaire
      if (notes) {
        await tx.maintenance.update({
          where: { id },
          data: {
            notes: notes
          }
        });
      }
      
      // 2. Mettre à jour l'état des entités concernées
      if (maintenance.cycleId) {
        await tx.partieCycle.update({
          where: { id: maintenance.cycleId },
          data: { etat: EtatEntite.DISPONIBLE }
        });
      }
      
      if (maintenance.moteurId) {
        await tx.moteur.update({
          where: { id: maintenance.moteurId },
          data: { etat: EtatEntite.DISPONIBLE }
        });
      }
    });
    
    // Revalider les chemins concernés
    if (maintenance.cycleId) {
      revalidatePath(`/dashboard/motos/${maintenance.cycleId}`);
    }
    
    if (maintenance.moteurId) {
      revalidatePath(`/dashboard/moteurs/${maintenance.moteurId}`);
    }
    
    revalidatePath(`/dashboard/maintenances/${id}`);
    revalidatePath('/dashboard/maintenances');
    
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la finalisation de la maintenance:', error);
    return { 
      success: false, 
      error: 'Impossible de finaliser la maintenance. Veuillez réessayer.' 
    };
  }
}