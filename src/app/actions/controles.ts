'use server'

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { controleJournalierSchema } from '@/lib/validations';
import { EtatEntite } from '@prisma/client';
import { z } from 'zod';

/**
 * Obtenir les contrôles journaliers avec pagination et filtres
 */
export async function getControles({
  page = 1,
  limit = 10,
  cycleId,
  dateDebut,
  dateFin,
  estConforme
}: {
  page?: number;
  limit?: number;
  cycleId?: string;
  dateDebut?: Date;
  dateFin?: Date;
  estConforme?: boolean;
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
    
    if (estConforme !== undefined) {
      where.estConforme = estConforme;
    }
    
    // Récupérer les données avec pagination
    const skip = (page - 1) * limit;
    
    const [controles, total] = await Promise.all([
      prisma.controleJournalier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          cycle: true
        }
      }),
      prisma.controleJournalier.count({ where })
    ]);
    
    return {
      data: controles,
      pagination: {
        total,
        pageCount: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des contrôles:', error);
    throw new Error('Impossible de récupérer les contrôles. Veuillez réessayer.');
  }
}

/**
 * Créer un nouveau contrôle journalier
 */
export async function createControle(
  data: z.infer<typeof controleJournalierSchema>
) {
  try {
    // Valider les données avec Zod
    const validatedData = controleJournalierSchema.parse(data);
    
    // Transaction pour garantir l'intégrité des données
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer le contrôle journalier
      const newControle = await tx.controleJournalier.create({
        data: validatedData
      });
      
      // 2. Si le contrôle n'est pas conforme, mettre à jour l'état de la moto
      if (!validatedData.estConforme) {
        await tx.partieCycle.update({
          where: { id: validatedData.cycleId },
          data: { 
            etat: EtatEntite.A_VERIFIER,
            notesEtat: `Contrôle journalier non conforme du ${validatedData.date.toLocaleDateString()}. ${validatedData.commentaires || ''}`
          }
        });
      }
      
      return newControle;
    });
    
    revalidatePath('/dashboard/controles');
    revalidatePath(`/dashboard/motos/${validatedData.cycleId}`);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Erreur lors de la création du contrôle:', error);
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Données invalides', 
        validationErrors: error.errors 
      };
    }
    
    return { 
      success: false, 
      error: 'Impossible de créer le contrôle. Veuillez réessayer.' 
    };
  }
}

/**
 * Obtenir le dernier contrôle journalier d'une moto
 */
export async function getDernierControle(cycleId: string) {
  try {
    const dernierControle = await prisma.controleJournalier.findFirst({
      where: { cycleId },
      orderBy: { date: 'desc' },
      include: {
        cycle: true
      }
    });
    
    return dernierControle;
  } catch (error) {
    console.error('Erreur lors de la récupération du dernier contrôle:', error);
    throw new Error('Impossible de récupérer le dernier contrôle. Veuillez réessayer.');
  }
}

/**
 * Vérifier si une moto a besoin d'un contrôle journalier
 * (Si le dernier contrôle date de plus de 24h ou n'existe pas)
 */
export async function verifierBesoinControle(cycleId: string) {
  try {
    const dernierControle = await prisma.controleJournalier.findFirst({
      where: { cycleId },
      orderBy: { date: 'desc' }
    });
    
    if (!dernierControle) {
      return { besoinControle: true, dernierControle: null };
    }
    
    const maintenant = new Date();
    const hier = new Date(maintenant);
    hier.setDate(hier.getDate() - 1);
    
    const besoinControle = dernierControle.date < hier;
    
    return { besoinControle, dernierControle };
  } catch (error) {
    console.error('Erreur lors de la vérification du besoin de contrôle:', error);
    throw new Error('Impossible de vérifier le besoin de contrôle. Veuillez réessayer.');
  }
}