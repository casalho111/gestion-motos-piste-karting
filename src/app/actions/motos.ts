'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { partieCycleSchema } from '@/lib/validations';
import { EtatEntite } from '@prisma/client';
import { z } from 'zod';

/**
 * Obtenir toutes les parties cycles avec pagination et filtres optionnels
 * 
 * @param page - Page courante (commence à 1)
 * @param limit - Nombre d'éléments par page
 * @param etat - Filtre par état (optionnel)
 * @param modele - Filtre par modèle (optionnel)
 * @param search - Recherche par numéro de série ou notes (optionnel)
 */
export async function getMotos({
  page = 1,
  limit = 10,
  etat,
  modele,
  search
}: {
  page?: number;
  limit?: number;
  etat?: EtatEntite;
  modele?: string;
  search?: string;
}) {
  try {
    // Construire la condition where dynamiquement
    const where: any = {};
    
    if (etat) {
      where.etat = etat;
    }
    
    if (modele) {
      where.modele = modele;
    }
    
    if (search) {
      where.OR = [
        { numSerie: { contains: search, mode: 'insensitive' } },
        { notesEtat: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Récupérer les données avec pagination
    const skip = (page - 1) * limit;
    
    const [motos, total] = await Promise.all([
      prisma.partieCycle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          moteurCourant: true,
          controles: {
            orderBy: { date: 'desc' },
            take: 1
          }
        }
      }),
      prisma.partieCycle.count({ where })
    ]);
    
    return {
      data: motos,
      pagination: {
        total,
        pageCount: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des motos:', error);
    throw new Error('Impossible de récupérer les motos. Veuillez réessayer.');
  }
}

/**
 * Obtenir une partie cycle par son ID avec ses relations
 */
export async function getMotoById(id: string) {
  try {
    const moto = await prisma.partieCycle.findUnique({
      where: { id },
      include: {
        moteurCourant: true,
        controles: {
          orderBy: { date: 'desc' },
          take: 5
        },
        maintenances: {
          orderBy: { dateRealisation: 'desc' },
          take: 5,
          include: {
            piecesUtilisees: {
              include: {
                piece: true
              }
            }
          }
        },
        utilisations: {
          orderBy: { date: 'desc' },
          take: 10
        },
        historiquesMontage: {
          orderBy: { dateDebut: 'desc' },
          include: {
            moteur: true
          }
        }
      }
    });
    
    if (!moto) {
      throw new Error('Moto non trouvée');
    }
    
    return moto;
  } catch (error) {
    console.error('Erreur lors de la récupération de la moto:', error);
    throw new Error('Impossible de récupérer la moto. Veuillez réessayer.');
  }
}

// Type pour la création/mise à jour de moto
const PartialPartieCycleInput = partieCycleSchema.partial({
  moteurCourantId: true,
  dateAcquisition: true,
  etat: true,
});

/**
 * Créer une nouvelle partie cycle
 */
export async function createMoto(
  data: z.infer<typeof PartialPartieCycleInput>
) {
  try {
    // Valider les données avec Zod
    const validatedData = PartialPartieCycleInput.parse(data);
    
    // Définir des valeurs par défaut si nécessaire
    const motoToCreate = {
      ...validatedData,
      dateAcquisition: validatedData.dateAcquisition || new Date(),
      etat: validatedData.etat || EtatEntite.DISPONIBLE,
      kilometrage: 0,
    };
    
    const newMoto = await prisma.partieCycle.create({
      data: motoToCreate
    });
    
    revalidatePath('/dashboard/motos');
    return { success: true, data: newMoto };
  } catch (error) {
    console.error('Erreur lors de la création de la moto:', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Données invalides', 
        validationErrors: error.errors 
      };
    }
    
    return { 
      success: false, 
      error: 'Impossible de créer la moto. Veuillez réessayer.' 
    };
  }
}

/**
 * Mettre à jour une partie cycle
 */
export async function updateMoto(
  id: string,
  data: z.infer<typeof PartialPartieCycleInput>
) {
  try {
    // Valider les données avec Zod
    const validatedData = PartialPartieCycleInput.parse(data);
    
    const updatedMoto = await prisma.partieCycle.update({
      where: { id },
      data: validatedData
    });
    
    revalidatePath(`/dashboard/motos/${id}`);
    revalidatePath('/dashboard/motos');
    
    return { success: true, data: updatedMoto };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la moto:', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Données invalides', 
        validationErrors: error.errors 
      };
    }
    
    return { 
      success: false, 
      error: 'Impossible de mettre à jour la moto. Veuillez réessayer.' 
    };
  }
}

/**
 * Supprimer une partie cycle
 */
export async function deleteMoto(id: string) {
  try {
    // Vérifier si la moto existe et si elle a un moteur monté
    const moto = await prisma.partieCycle.findUnique({
      where: { id },
      select: { moteurCourantId: true }
    });
    
    if (!moto) {
      return {
        success: false,
        error: 'Moto non trouvée'
      };
    }
    
    // Si un moteur est monté, le détacher d'abord
    if (moto.moteurCourantId) {
      // Trouver le dernier historique de montage pour le démontage
      const dernierMontage = await prisma.historiqueMontage.findFirst({
        where: {
          cycleId: id,
          moteurId: moto.moteurCourantId,
          dateFin: null
        }
      });
      
      if (dernierMontage) {
        // Mettre à jour l'historique de montage
        await prisma.historiqueMontage.update({
          where: { id: dernierMontage.id },
          data: {
            dateFin: new Date(),
            kilometrageFinCycle: 0, // À remplacer par le kilométrage actuel
            kilometrageFinMoteur: 0 // À remplacer par le kilométrage actuel
          }
        });
      }
      
      // Mettre à jour le statut du moteur
      await prisma.moteur.update({
        where: { id: moto.moteurCourantId },
        data: { etat: EtatEntite.DISPONIBLE }
      });
    }
    
    // Supprimer en cascade (attention, vérifier que c'est configuré dans Prisma)
    await prisma.partieCycle.delete({
      where: { id }
    });
    
    revalidatePath('/dashboard/motos');
    
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la suppression de la moto:', error);
    return { 
      success: false, 
      error: 'Impossible de supprimer la moto. Veuillez réessayer.' 
    };
  }
}

/**
 * Mettre à jour le kilométrage d'une partie cycle
 */
export async function updateMotoKilometrage(id: string, nouveauKilometrage: number) {
  try {
    if (nouveauKilometrage < 0) {
      return {
        success: false,
        error: 'Le kilométrage ne peut pas être négatif'
      };
    }
    
    const moto = await prisma.partieCycle.findUnique({
      where: { id },
      select: { kilometrage: true, moteurCourantId: true }
    });
    
    if (!moto) {
      return {
        success: false,
        error: 'Moto non trouvée'
      };
    }
    
    // Vérifier que le nouveau kilométrage est supérieur à l'ancien
    if (nouveauKilometrage < moto.kilometrage) {
      return {
        success: false,
        error: 'Le nouveau kilométrage doit être supérieur à l\'ancien'
      };
    }
    
    // Calculer la différence de kilométrage
    const difference = nouveauKilometrage - moto.kilometrage;
    
    // Mettre à jour le kilométrage de la partie cycle
    const updatedMoto = await prisma.partieCycle.update({
      where: { id },
      data: { kilometrage: nouveauKilometrage }
    });
    
    // Si un moteur est monté, mettre à jour son kilométrage aussi
    if (moto.moteurCourantId) {
      await prisma.moteur.update({
        where: { id: moto.moteurCourantId },
        data: {
          // Incrémentation du kilométrage du moteur
          kilometrage: {
            increment: difference
          }
        }
      });
    }
    
    revalidatePath(`/dashboard/motos/${id}`);
    revalidatePath('/dashboard/motos');
    
    return { success: true, data: updatedMoto };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du kilométrage:', error);
    return { 
      success: false, 
      error: 'Impossible de mettre à jour le kilométrage. Veuillez réessayer.' 
    };
  }
}

/**
 * Changer l'état d'une partie cycle
 */
export async function changeEtatMoto(id: string, nouvelEtat: EtatEntite, notes?: string) {
  try {
    const updatedMoto = await prisma.partieCycle.update({
      where: { id },
      data: { 
        etat: nouvelEtat,
        notesEtat: notes
      }
    });
    
    revalidatePath(`/dashboard/motos/${id}`);
    revalidatePath('/dashboard/motos');
    
    return { success: true, data: updatedMoto };
  } catch (error) {
    console.error('Erreur lors du changement d\'état de la moto:', error);
    return { 
      success: false, 
      error: 'Impossible de changer l\'état de la moto. Veuillez réessayer.' 
    };
  }
}