'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { moteurSchema, historiqueMontageSchema } from '@/lib/validations';
import { EtatEntite } from '@prisma/client';
import { z } from 'zod';

/**
 * Obtenir tous les moteurs avec pagination et filtres
 */
export async function getMoteurs({
  page = 1,
  limit = 10,
  etat,
  type,
  estMonte = undefined,
  search
}: {
  page?: number;
  limit?: number;
  etat?: EtatEntite;
  type?: string;
  estMonte?: boolean;
  search?: string;
}) {
  try {
    // Construire la condition where dynamiquement
    const where: any = {};
    
    if (etat) {
      where.etat = etat;
    }
    
    if (type) {
      where.type = type;
    }
    
    // Filtrer par statut de montage
    if (estMonte !== undefined) {
      // Un moteur est monté s'il y a une partie cycle qui l'a comme moteurCourant
      if (estMonte) {
        where.cycleActuel = { isNot: null };
      } else {
        where.cycleActuel = null;
      }
    }
    
    if (search) {
      where.OR = [
        { numSerie: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { notesEtat: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Récupérer les données avec pagination
    const skip = (page - 1) * limit;
    
    const [moteurs, total] = await Promise.all([
      prisma.moteur.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          cycleActuel: true,
          maintenances: {
            orderBy: { dateRealisation: 'desc' },
            take: 1
          }
        }
      }),
      prisma.moteur.count({ where })
    ]);
    
    return {
      data: moteurs,
      pagination: {
        total,
        pageCount: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des moteurs:', error);
    throw new Error('Impossible de récupérer les moteurs. Veuillez réessayer.');
  }
}

/**
 * Obtenir un moteur par son ID
 */
export async function getMoteurById(id: string) {
  try {
    const moteur = await prisma.moteur.findUnique({
      where: { id },
      include: {
        cycleActuel: true,
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
        historiquesMontage: {
          orderBy: { dateDebut: 'desc' },
          include: {
            cycle: true
          }
        }
      }
    });
    
    if (!moteur) {
      throw new Error('Moteur non trouvé');
    }
    
    return moteur;
  } catch (error) {
    console.error('Erreur lors de la récupération du moteur:', error);
    throw new Error('Impossible de récupérer le moteur. Veuillez réessayer.');
  }
}

// Type pour la création/mise à jour de moteur
const PartialMoteurInput = moteurSchema.partial({
  dateAcquisition: true,
  cylindree: true,
  etat: true,
  heuresMoteur: true
});

/**
 * Créer un nouveau moteur
 */
export async function createMoteur(
  data: z.infer<typeof PartialMoteurInput>
) {
  try {
    // Valider les données avec Zod
    const validatedData = PartialMoteurInput.parse(data);
    
    // Définir des valeurs par défaut si nécessaire
    const moteurToCreate = {
      ...validatedData,
      dateAcquisition: validatedData.dateAcquisition || new Date(),
      cylindree: validatedData.cylindree || 125,
      etat: validatedData.etat || EtatEntite.DISPONIBLE,
      kilometrage: 0,
      heuresMoteur: validatedData.heuresMoteur || 0
    };
    
    const newMoteur = await prisma.moteur.create({
      data: moteurToCreate
    });
    
    revalidatePath('/dashboard/moteurs');
    return { success: true, data: newMoteur };
  } catch (error) {
    console.error('Erreur lors de la création du moteur:', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Données invalides', 
        validationErrors: error.errors 
      };
    }
    
    return { 
      success: false, 
      error: 'Impossible de créer le moteur. Veuillez réessayer.' 
    };
  }
}

/**
 * Mettre à jour un moteur
 */
export async function updateMoteur(
  id: string,
  data: z.infer<typeof PartialMoteurInput>
) {
  try {
    // Valider les données avec Zod
    const validatedData = PartialMoteurInput.parse(data);
    
    const updatedMoteur = await prisma.moteur.update({
      where: { id },
      data: validatedData
    });
    
    revalidatePath(`/dashboard/moteurs/${id}`);
    revalidatePath('/dashboard/moteurs');
    
    return { success: true, data: updatedMoteur };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du moteur:', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Données invalides', 
        validationErrors: error.errors 
      };
    }
    
    return { 
      success: false, 
      error: 'Impossible de mettre à jour le moteur. Veuillez réessayer.' 
    };
  }
}

/**
 * Changer l'état d'un moteur
 */
export async function changeEtatMoteur(id: string, nouvelEtat: EtatEntite, notes?: string) {
  try {
    const updatedMoteur = await prisma.moteur.update({
      where: { id },
      data: { 
        etat: nouvelEtat,
        notesEtat: notes
      }
    });
    
    revalidatePath(`/dashboard/moteurs/${id}`);
    revalidatePath('/dashboard/moteurs');
    
    return { success: true, data: updatedMoteur };
  } catch (error) {
    console.error('Erreur lors du changement d\'état du moteur:', error);
    return { 
      success: false, 
      error: 'Impossible de changer l\'état du moteur. Veuillez réessayer.' 
    };
  }
}

/**
 * Monter un moteur sur une partie cycle (suite)
 */
export async function monterMoteur({
    moteurId,
    cycleId,
    technicien,
    date = new Date(),
    notes
  }: {
    moteurId: string;
    cycleId: string;
    technicien: string;
    date?: Date;
    notes?: string;
  }) {
    try {
      // Vérifier que le moteur est disponible
      const moteur = await prisma.moteur.findUnique({
        where: { id: moteurId },
        include: { cycleActuel: true }
      });
      
      if (!moteur) {
        return {
          success: false,
          error: 'Moteur non trouvé'
        };
      }
      
      if (moteur.cycleActuel) {
        return {
          success: false,
          error: 'Ce moteur est déjà monté sur une autre partie cycle'
        };
      }
      
      if (moteur.etat !== EtatEntite.DISPONIBLE) {
        return {
          success: false,
          error: `Le moteur n'est pas disponible (état actuel: ${moteur.etat})`
        };
      }
      
      // Vérifier que la partie cycle existe
      const cycle = await prisma.partieCycle.findUnique({
        where: { id: cycleId },
        include: { moteurCourant: true }
      });
      
      if (!cycle) {
        return {
          success: false,
          error: 'Partie cycle non trouvée'
        };
      }
      
      // Si la partie cycle a déjà un moteur, il faut le démonter d'abord
      if (cycle.moteurCourant) {
        return {
          success: false,
          error: 'Cette partie cycle a déjà un moteur monté. Veuillez le démonter d\'abord.'
        };
      }
      
      // Transaction pour garantir l'intégrité des données
      const result = await prisma.$transaction(async (tx) => {
        // 1. Créer un nouvel enregistrement dans l'historique de montage
        const historique = await tx.historiqueMontage.create({
          data: {
            dateDebut: date,
            kilometrageDebutCycle: cycle.kilometrage,
            kilometrageDebutMoteur: moteur.kilometrage,
            technicien,
            notes,
            cycleId,
            moteurId
          }
        });
        
        // 2. Mettre à jour la partie cycle pour indiquer le moteur monté
        const updatedCycle = await tx.partieCycle.update({
          where: { id: cycleId },
          data: { moteurCourantId: moteurId }
        });
        
        // 3. Mettre à jour l'état du moteur
        const updatedMoteur = await tx.moteur.update({
          where: { id: moteurId },
          data: { etat: EtatEntite.DISPONIBLE }
        });
        
        return { historique, updatedCycle, updatedMoteur };
      });
      
      revalidatePath(`/dashboard/moteurs/${moteurId}`);
      revalidatePath(`/dashboard/motos/${cycleId}`);
      revalidatePath('/dashboard/moteurs');
      revalidatePath('/dashboard/motos');
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Erreur lors du montage du moteur:', error);
      return { 
        success: false, 
        error: 'Impossible de monter le moteur. Veuillez réessayer.' 
      };
    }
  }
  
  /**
   * Démonter un moteur d'une partie cycle
   */
  export async function demonterMoteur({
    cycleId,
    technicien,
    date = new Date(),
    notes
  }: {
    cycleId: string;
    technicien: string;
    date?: Date;
    notes?: string;
  }) {
    try {
      // Vérifier que la partie cycle a un moteur monté
      const cycle = await prisma.partieCycle.findUnique({
        where: { id: cycleId },
        include: { moteurCourant: true }
      });
      
      if (!cycle) {
        return {
          success: false,
          error: 'Partie cycle non trouvée'
        };
      }
      
      if (!cycle.moteurCourant) {
        return {
          success: false,
          error: 'Cette partie cycle n\'a pas de moteur monté'
        };
      }
      
      const moteurId = cycle.moteurCourant.id;
      
      // Trouver le dernier historique de montage
      const dernierMontage = await prisma.historiqueMontage.findFirst({
        where: {
          cycleId,
          moteurId,
          dateFin: null
        },
        orderBy: {
          dateDebut: 'desc'
        }
      });
      
      if (!dernierMontage) {
        return {
          success: false,
          error: 'Historique de montage introuvable'
        };
      }
      
      // Transaction pour garantir l'intégrité des données
      const result = await prisma.$transaction(async (tx) => {
        // 1. Mettre à jour l'historique de montage
        const historiqueUpdated = await tx.historiqueMontage.update({
          where: { id: dernierMontage.id },
          data: {
            dateFin: date,
            kilometrageFinCycle: cycle.kilometrage,
            kilometrageFinMoteur: cycle.moteurCourant?.kilometrage || 0,
            notes: notes ? `${dernierMontage.notes || ''} ${notes}` : dernierMontage.notes
          }
        });
        
        // 2. Mettre à jour la partie cycle pour retirer le moteur
        const updatedCycle = await tx.partieCycle.update({
          where: { id: cycleId },
          data: { moteurCourantId: null }
        });
        
        // 3. Mettre à jour l'état du moteur
        const updatedMoteur = await tx.moteur.update({
          where: { id: moteurId },
          data: { etat: EtatEntite.DISPONIBLE }
        });
        
        return { historiqueUpdated, updatedCycle, updatedMoteur };
      });
      
      revalidatePath(`/dashboard/moteurs/${moteurId}`);
      revalidatePath(`/dashboard/motos/${cycleId}`);
      revalidatePath('/dashboard/moteurs');
      revalidatePath('/dashboard/motos');
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Erreur lors du démontage du moteur:', error);
      return { 
        success: false, 
        error: 'Impossible de démonter le moteur. Veuillez réessayer.' 
      };
    }
  }