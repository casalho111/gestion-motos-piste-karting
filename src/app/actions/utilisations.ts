'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { utilisationSchema } from '@/lib/validations';
import { z } from 'zod';

/**
 * Obtenir les utilisations avec pagination et filtres
 */
export async function getUtilisations({
  page = 1,
  limit = 10,
  cycleId,
  dateDebut,
  dateFin
}: {
  page?: number;
  limit?: number;
  cycleId?: string;
  dateDebut?: Date;
  dateFin?: Date;
}) {
  try {
    // Construire la condition where dynamiquement
    const where: any = {};
    
    if (cycleId) {
      where.cycleId = cycleId;
    }
    
    if (dateDebut || dateFin) {
      where.date = {};
      
      if (dateDebut) {
        where.date.gte = dateDebut;
      }
      
      if (dateFin) {
        where.date.lte = dateFin;
      }
    }
    
    // Récupérer les données avec pagination
    const skip = (page - 1) * limit;
    
    const [utilisations, total] = await Promise.all([
      prisma.utilisation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          cycle: true
        }
      }),
      prisma.utilisation.count({ where })
    ]);
    
    return {
      data: utilisations,
      pagination: {
        total,
        pageCount: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisations:', error);
    throw new Error('Impossible de récupérer les utilisations. Veuillez réessayer.');
  }
}

/**
 * Obtenir une utilisation par ID
 */
export async function getUtilisationById(id: string) {
  try {
    const utilisation = await prisma.utilisation.findUnique({
      where: { id },
      include: {
        cycle: true
      }
    });
    
    if (!utilisation) {
      throw new Error('Utilisation non trouvée');
    }
    
    return utilisation;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisation:', error);
    throw new Error('Impossible de récupérer l\'utilisation. Veuillez réessayer.');
  }
}

/**
 * Créer une nouvelle utilisation (session de circuit) et mettre à jour les kilométrages
 */
export async function createUtilisation(
  data: z.infer<typeof utilisationSchema>
) {
  try {
    // Valider les données avec Zod
    const validatedData = utilisationSchema.parse(data);
    
    // Calculer la distance totale parcourue
    const distanceTotale = (validatedData.nbTours * validatedData.distanceTour) / 1000; // Convertir en km
    
    // Transaction pour garantir la cohérence des données
    const result = await prisma.$transaction(async (tx) => {
      // 1. Récupérer la partie cycle et son kilométrage actuel
      const cycle = await tx.partieCycle.findUnique({
        where: { id: validatedData.cycleId },
        select: { kilometrage: true, moteurCourantId: true }
      });
      
      if (!cycle) {
        throw new Error('Partie cycle non trouvée');
      }
      
      // 2. Calculer le nouveau kilométrage
      const nouveauKilometrage = cycle.kilometrage + distanceTotale;
      
      // 3. Créer l'enregistrement d'utilisation
      const newUtilisation = await tx.utilisation.create({
        data: {
          ...validatedData,
          distanceTotale: distanceTotale
        }
      });
      
      // 4. Mettre à jour le kilométrage de la partie cycle
      await tx.partieCycle.update({
        where: { id: validatedData.cycleId },
        data: { kilometrage: nouveauKilometrage }
      });
      
      // 5. Si un moteur est monté, mettre à jour son kilométrage aussi
      if (cycle.moteurCourantId) {
        await tx.moteur.update({
          where: { id: cycle.moteurCourantId },
          data: {
            kilometrage: {
              increment: distanceTotale
            }
          }
        });
      }
      
      return { utilisation: newUtilisation, nouveauKilometrage };
    });
    
    revalidatePath('/dashboard/utilisations');
    revalidatePath(`/dashboard/motos/${validatedData.cycleId}`);
    
    return { 
      success: true, 
      data: result.utilisation,
      nouveauKilometrage: result.nouveauKilometrage 
    };
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisation:', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Données invalides', 
        validationErrors: error.errors 
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Impossible de créer l\'utilisation' 
    };
  }
}

/**
 * Supprimer une utilisation
 * Attention: Cela ne décrémente pas le kilométrage pour préserver l'intégrité des données.
 */
export async function deleteUtilisation(id: string) {
  try {
    await prisma.utilisation.delete({
      where: { id }
    });
    
    revalidatePath('/dashboard/utilisations');
    
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisation:', error);
    return { 
      success: false, 
      error: 'Impossible de supprimer l\'utilisation. Veuillez réessayer.' 
    };
  }
}

/**
 * Obtenir les statistiques d'utilisation par moto sur une période
 */
export async function getUtilisationStats(
  dateDebut?: Date,
  dateFin?: Date
) {
  try {
    const where: any = {};
    
    if (dateDebut || dateFin) {
      where.date = {};
      
      if (dateDebut) {
        where.date.gte = dateDebut;
      }
      
      if (dateFin) {
        where.date.lte = dateFin;
      }
    }
    
    // Récupérer toutes les motos
    const cycles = await prisma.partieCycle.findMany({
      select: {
        id: true,
        numSerie: true,
        modele: true
      }
    });
    
    // Pour chaque moto, récupérer ses statistiques d'utilisation
    const stats = await Promise.all(
      cycles.map(async (cycle) => {
        const utilisations = await prisma.utilisation.findMany({
          where: {
            ...where,
            cycleId: cycle.id
          },
          select: {
            distanceTotale: true,
            nbTours: true,
            date: true
          }
        });
        
        const totalDistance = utilisations.reduce((sum, u) => sum + u.distanceTotale, 0);
        const totalTours = utilisations.reduce((sum, u) => sum + u.nbTours, 0);
        const sessionCount = utilisations.length;
        
        return {
          cycle,
          totalDistance,
          totalTours,
          sessionCount,
          utilisations
        };
      })
    );
    
    return stats;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques d\'utilisation:', error);
    throw new Error('Impossible de récupérer les statistiques. Veuillez réessayer.');
  }
}