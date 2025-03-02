'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { alerteSchema } from '@/lib/validations';
import { Criticite } from '@prisma/client';
import { z } from 'zod';
import { calculerKilometrageRestant } from '@/lib/utils/maintenance-utils';
import { KILOMETRAGE_ENTRETIEN_CYCLE, KILOMETRAGE_ENTRETIEN_MOTEUR, SEUIL_ALERTE_ENTRETIEN } from '@/lib/utils/maintenance-utils';

/**
 * Obtenir les alertes avec pagination et filtres
 */
export async function getAlertes({
  page = 1,
  limit = 10,
  type,
  criticite,
  estTraitee = false,
  search
}: {
  page?: number;
  limit?: number;
  type?: string;
  criticite?: Criticite;
  estTraitee?: boolean;
  search?: string;
}) {
  try {
    // Construire la condition where dynamiquement
    const where: any = { estTraitee };
    
    if (type) {
      where.type = type;
    }
    
    if (criticite) {
      where.criticite = criticite;
    }
    
    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { message: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    // Récupérer les données avec pagination
    const skip = (page - 1) * limit;
    
    const [alertes, total] = await Promise.all([
      prisma.alerte.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { criticite: 'desc' },
          { dateCreation: 'desc' }
        ]
      }),
      prisma.alerte.count({ where })
    ]);
    
    return {
      data: alertes,
      pagination: {
        total,
        pageCount: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    throw new Error('Impossible de récupérer les alertes. Veuillez réessayer.');
  }
}

/**
 * Créer une nouvelle alerte
 */
export async function createAlerte(
  data: z.infer<typeof alerteSchema>
) {
  try {
    // Valider les données avec Zod
    const validatedData = alerteSchema.parse(data);
    
    const newAlerte = await prisma.alerte.create({
      data: validatedData
    });
    
    revalidatePath('/dashboard/alertes');
    return { success: true, data: newAlerte };
  } catch (error) {
    console.error('Erreur lors de la création de l\'alerte:', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Données invalides', 
        validationErrors: error.errors 
      };
    }
    
    return { 
      success: false, 
      error: 'Impossible de créer l\'alerte. Veuillez réessayer.' 
    };
  }
}

/**
 * Marquer une alerte comme traitée
 */
export async function traiterAlerte(
  id: string,
  utilisateur: string
) {
  try {
    const alerteTraitee = await prisma.alerte.update({
      where: { id },
      data: {
        estTraitee: true,
        traitePar: utilisateur,
        dateTraitement: new Date()
      }
    });
    
    revalidatePath('/dashboard/alertes');
    return { success: true, data: alerteTraitee };
  } catch (error) {
    console.error('Erreur lors du traitement de l\'alerte:', error);
    return { 
      success: false, 
      error: 'Impossible de traiter l\'alerte. Veuillez réessayer.' 
    };
  }
}

/**
 * Générer les alertes de maintenance pour les motos et moteurs
 * (à exécuter périodiquement, par exemple via une tâche cron)
 */
export async function genererAlertesEntretien() {
  try {
    const alertesGenerees: any[] = [];
    
    // 1. Vérifier les parties cycles
    const cycles = await prisma.partieCycle.findMany({
      where: {
        etat: {
          not: 'HORS_SERVICE'
        }
      }
    });
    
    for (const cycle of cycles) {
      const kilometrageRestant = calculerKilometrageRestant(cycle.kilometrage, KILOMETRAGE_ENTRETIEN_CYCLE);
      
      if (kilometrageRestant <= SEUIL_ALERTE_ENTRETIEN) {
        // Vérifier si une alerte similaire existe déjà et n'est pas traitée
        const alerteExistante = await prisma.alerte.findFirst({
          where: {
            cycleId: cycle.id,
            type: 'MAINTENANCE',
            estTraitee: false
          }
        });
        
        if (!alerteExistante) {
          const criticite = kilometrageRestant <= 0 ? 'ELEVEE' : 'MOYENNE';
          const msgKm = kilometrageRestant <= 0 
            ? 'Entretien dépassé'
            : `Entretien dans ${Math.round(kilometrageRestant)} km`;
          
          const alerte = await prisma.alerte.create({
            data: {
              titre: `Entretien requis pour ${cycle.numSerie}`,
              message: `${msgKm} pour la partie cycle ${cycle.numSerie} (modèle: ${cycle.modele})`,
              type: 'MAINTENANCE',
              criticite,
              cycleId: cycle.id
            }
          });
          
          alertesGenerees.push(alerte);
        }
      }
    }
    
    // 2. Vérifier les moteurs
    const moteurs = await prisma.moteur.findMany({
      where: {
        etat: {
          not: 'HORS_SERVICE'
        }
      }
    });
    
    for (const moteur of moteurs) {
      const kilometrageRestant = calculerKilometrageRestant(moteur.kilometrage, KILOMETRAGE_ENTRETIEN_MOTEUR);
      
      if (kilometrageRestant <= SEUIL_ALERTE_ENTRETIEN) {
        // Vérifier si une alerte similaire existe déjà et n'est pas traitée
        const alerteExistante = await prisma.alerte.findFirst({
          where: {
            moteurId: moteur.id,
            type: 'MAINTENANCE',
            estTraitee: false
          }
        });
        
        if (!alerteExistante) {
          const criticite = kilometrageRestant <= 0 ? 'ELEVEE' : 'MOYENNE';
          const msgKm = kilometrageRestant <= 0 
            ? 'Entretien dépassé'
            : `Entretien dans ${Math.round(kilometrageRestant)} km`;
          
          const alerte = await prisma.alerte.create({
            data: {
              titre: `Entretien requis pour moteur ${moteur.numSerie}`,
              message: `${msgKm} pour le moteur ${moteur.numSerie} (type: ${moteur.type})`,
              type: 'MAINTENANCE',
              criticite,
              moteurId: moteur.id
            }
          });
          
          alertesGenerees.push(alerte);
        }
      }
    }
    
    // 3. Vérifier le stock de pièces
    const piecesBas = await prisma.piece.findMany({
      where: {
        quantiteStock: {
          lte: prisma.piece.fields.quantiteMinimale
        }
      }
    });
    
    for (const piece of piecesBas) {
      // Vérifier si une alerte similaire existe déjà et n'est pas traitée
      const alerteExistante = await prisma.alerte.findFirst({
        where: {
          pieceId: piece.id,
          type: 'STOCK',
          estTraitee: false
        }
      });
      
      if (!alerteExistante) {
        const criticite = piece.quantiteStock === 0 ? 'CRITIQUE' : 'ELEVEE';
        
        const alerte = await prisma.alerte.create({
          data: {
            titre: `Stock bas: ${piece.nom}`,
            message: `Le stock de ${piece.nom} est bas (${piece.quantiteStock}/${piece.quantiteMinimale})`,
            type: 'STOCK',
            criticite,
            pieceId: piece.id
          }
        });
        
        alertesGenerees.push(alerte);
      }
    }
    
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/alertes');
    
    return { 
      success: true, 
      alertesGenerees,
      stats: {
        cycles: alertesGenerees.filter(a => a.cycleId).length,
        moteurs: alertesGenerees.filter(a => a.moteurId).length,
        stock: alertesGenerees.filter(a => a.pieceId).length,
        total: alertesGenerees.length
      }
    };
  } catch (error) {
    console.error('Erreur lors de la génération des alertes d\'entretien:', error);
    return { 
      success: false, 
      error: 'Impossible de générer les alertes. Veuillez réessayer.' 
    };
  }
}