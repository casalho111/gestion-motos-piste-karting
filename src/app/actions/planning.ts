'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { planningMaintenanceSchema } from '@/lib/validations';
import { Criticite, TypeEntretien } from '@prisma/client';
import { z } from 'zod';
import { calculerKilometrageRestant } from '@/lib/utils/maintenance-utils';
import { KILOMETRAGE_ENTRETIEN_CYCLE, KILOMETRAGE_ENTRETIEN_MOTEUR } from '@/lib/utils/maintenance-utils';

/**
 * Obtenir les plannings de maintenance avec pagination et filtres
 */
export async function getPlanningMaintenances({
  page = 1,
  limit = 10,
  type,
  estComplete = false,
  dateMin,
  dateMax,
  criticite
}: {
  page?: number;
  limit?: number;
  type?: TypeEntretien;
  estComplete?: boolean;
  dateMin?: Date;
  dateMax?: Date;
  criticite?: Criticite;
}) {
  try {
    // Construire la condition where dynamiquement
    const where: any = { estComplete };
    
    if (type) {
      where.type = type;
    }
    
    if (criticite) {
      where.criticite = criticite;
    }
    
    if (dateMin || dateMax) {
      where.dateEstimee = {};
      
      if (dateMin) {
        where.dateEstimee.gte = dateMin;
      }
      
      if (dateMax) {
        where.dateEstimee.lte = dateMax;
      }
    }
    
    // Récupérer les données avec pagination
    const skip = (page - 1) * limit;
    
    const [plannings, total] = await Promise.all([
      prisma.planningMaintenance.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { estComplete: 'asc' },
          { dateEstimee: 'asc' }
        ]
      }),
      prisma.planningMaintenance.count({ where })
    ]);
    
    return {
      data: plannings,
      pagination: {
        total,
        pageCount: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des plannings de maintenance:', error);
    throw new Error('Impossible de récupérer les plannings de maintenance. Veuillez réessayer.');
  }
}

/**
 * Obtenir un planning de maintenance par son ID
 */
export async function getPlanningMaintenanceById(id: string) {
  try {
    const planning = await prisma.planningMaintenance.findUnique({
      where: { id }
    });
    
    if (!planning) {
      throw new Error('Planning de maintenance non trouvé');
    }
    
    // Enrichir avec les informations de l'entité concernée (cycle ou moteur)
    let entite = null;
    
    if (planning.estMoteur) {
      entite = await prisma.moteur.findUnique({
        where: { id: planning.entiteId }
      });
    } else {
      entite = await prisma.partieCycle.findUnique({
        where: { id: planning.entiteId }
      });
    }
    
    return { planning, entite };
  } catch (error) {
    console.error('Erreur lors de la récupération du planning de maintenance:', error);
    throw new Error('Impossible de récupérer le planning de maintenance. Veuillez réessayer.');
  }
}

/**
 * Créer un nouveau planning de maintenance
 */
export async function createPlanningMaintenance(
  data: z.infer<typeof planningMaintenanceSchema>
) {
  try {
    // Valider les données avec Zod
    const validatedData = planningMaintenanceSchema.parse(data);
    
    const newPlanning = await prisma.planningMaintenance.create({
      data: validatedData
    });
    
    revalidatePath('/dashboard/planning');
    return { success: true, data: newPlanning };
  } catch (error) {
    console.error('Erreur lors de la création du planning de maintenance:', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Données invalides', 
        validationErrors: error.errors 
      };
    }
    
    return { 
      success: false, 
      error: 'Impossible de créer le planning de maintenance. Veuillez réessayer.' 
    };
  }
}

/**
 * Marquer un planning de maintenance comme complété
 */
export async function completerPlanningMaintenance(
  id: string,
  maintenanceId?: string
) {
  try {
    const planningComplete = await prisma.planningMaintenance.update({
      where: { id },
      data: {
        estComplete: true
      }
    });
    
    revalidatePath('/dashboard/planning');
    return { success: true, data: planningComplete };
  } catch (error) {
    console.error('Erreur lors de la complétion du planning de maintenance:', error);
    return { 
      success: false, 
      error: 'Impossible de compléter le planning de maintenance. Veuillez réessayer.' 
    };
  }
}

/**
 * Générer automatiquement des plannings de maintenance basés sur le kilométrage
 */
export async function genererPlanningAutomatique() {
  try {
    const planningsGeneres: any[] = [];
    
    // 1. Générer pour les parties cycles
    const cycles = await prisma.partieCycle.findMany({
      where: {
        etat: {
          not: 'HORS_SERVICE'
        }
      }
    });
    
    for (const cycle of cycles) {
      const kilometrageRestant = calculerKilometrageRestant(cycle.kilometrage, KILOMETRAGE_ENTRETIEN_CYCLE);
      
      // Si l'entretien est prévu dans les 800 km (environ 1000 tours de circuit)
      if (kilometrageRestant <= 800) {
        // Vérifier si un planning similaire existe déjà
        const planningExistant = await prisma.planningMaintenance.findFirst({
          where: {
            entiteId: cycle.id,
            estMoteur: false,
            estComplete: false
          }
        });
        
        if (!planningExistant) {
          // Estimer la date basée sur l'utilisation moyenne
          // (simplifié ici, pourrait être plus complexe avec l'historique d'utilisation)
          const utilisationMoyenne = await prisma.utilisation.aggregate({
            where: {
              cycleId: cycle.id,
              date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
              }
            },
            _avg: {
              distanceTotale: true
            },
            _count: {
              id: true
            }
          });
          
          let dateEstimee = new Date();
          
          if (utilisationMoyenne._avg.distanceTotale && utilisationMoyenne._count.id > 0) {
            // Utilisation quotidienne moyenne
            const utilisationQuotidienne = (utilisationMoyenne._avg.distanceTotale * utilisationMoyenne._count.id) / 30;
            // Nombre de jours avant entretien
            const joursAvantEntretien = Math.max(1, Math.round(kilometrageRestant / utilisationQuotidienne));
            
            dateEstimee.setDate(dateEstimee.getDate() + joursAvantEntretien);
          } else {
            // Par défaut, prévoir dans 2 semaines si pas de données d'utilisation
            dateEstimee.setDate(dateEstimee.getDate() + 14);
          }
          
          const planning = await prisma.planningMaintenance.create({
            data: {
              titre: `Entretien régulier pour ${cycle.numSerie}`,
              description: `Entretien des ${KILOMETRAGE_ENTRETIEN_CYCLE} km pour la partie cycle ${cycle.numSerie} (${cycle.modele})`,
              type: TypeEntretien.ENTRETIEN_REGULIER,
              dateEstimee,
              estMoteur: false,
              entiteId: cycle.id,
              kilometragePrevu: Math.ceil(cycle.kilometrage / KILOMETRAGE_ENTRETIEN_CYCLE) * KILOMETRAGE_ENTRETIEN_CYCLE,
              criticite: kilometrageRestant <= 0 ? Criticite.ELEVEE : Criticite.MOYENNE
            }
          });
          
          planningsGeneres.push(planning);
        }
      }
    }
    
    // 2. Générer pour les moteurs
    const moteurs = await prisma.moteur.findMany({
      where: {
        etat: {
          not: 'HORS_SERVICE'
        }
      }
    });
    
    for (const moteur of moteurs) {
      const kilometrageRestant = calculerKilometrageRestant(moteur.kilometrage, KILOMETRAGE_ENTRETIEN_MOTEUR);
      
      // Si l'entretien est prévu dans les 400 km
      if (kilometrageRestant <= 400) {
        // Vérifier si un planning similaire existe déjà
        const planningExistant = await prisma.planningMaintenance.findFirst({
          where: {
            entiteId: moteur.id,
            estMoteur: true,
            estComplete: false
          }
        });
        
        if (!planningExistant) {
          // Date par défaut dans 7 jours (simplification)
          const dateEstimee = new Date();
          dateEstimee.setDate(dateEstimee.getDate() + 7);
          
          const planning = await prisma.planningMaintenance.create({
            data: {
              titre: `Entretien moteur ${moteur.numSerie}`,
              description: `Entretien des ${KILOMETRAGE_ENTRETIEN_MOTEUR} km pour le moteur ${moteur.numSerie} (${moteur.type})`,
              type: TypeEntretien.REVISION_MOTEUR,
              dateEstimee,
              estMoteur: true,
              entiteId: moteur.id,
              kilometragePrevu: Math.ceil(moteur.kilometrage / KILOMETRAGE_ENTRETIEN_MOTEUR) * KILOMETRAGE_ENTRETIEN_MOTEUR,
              criticite: kilometrageRestant <= 0 ? Criticite.ELEVEE : Criticite.MOYENNE
            }
          });
          
          planningsGeneres.push(planning);
        }
      }
    }
    
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/planning');
    
    return { 
      success: true, 
      planningsGeneres,
      stats: {
        cycles: planningsGeneres.filter(p => !p.estMoteur).length,
        moteurs: planningsGeneres.filter(p => p.estMoteur).length,
        total: planningsGeneres.length
      }
    };
  } catch (error) {
    console.error('Erreur lors de la génération du planning automatique:', error);
    return { 
      success: false, 
      error: 'Impossible de générer le planning automatique. Veuillez réessayer.' 
    };
  }
}