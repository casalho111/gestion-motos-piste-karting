'use server'

import { prisma } from '@/lib/db';
import { EtatEntite } from '@prisma/client';
import { getDashboardStats } from './stats';
import { genererAlertesEntretien } from './alertes';
import { genererPlanningAutomatique } from './planning';
import { calculerKilometrageRestant, verifierBesoinEntretienCycle, verifierBesoinEntretienMoteur } from '@/lib/utils/maintenance-utils';

/**
 * Fonction principale pour obtenir toutes les données du dashboard
 * Combine les différentes fonctions d'obtention de données et génère les alertes nécessaires
 */
export async function getDashboardData() {
  try {
    // 1. Récupérer les statistiques générales
    const stats = await getDashboardStats();
    
    // 2. Générer les alertes d'entretien (si ce n'est pas déjà fait récemment)
    // En production, cette opération serait effectuée par une tâche cron
    // mais pour les besoins de démonstration, nous la déclenchons ici
    const alertes = await genererAlertesEntretien();
    
    // 3. Générer le planning automatique de maintenance
    // Même remarque que pour les alertes
    const planning = await genererPlanningAutomatique();
    
    // 4. Récupérer les prochaines maintenances planifiées
    const prochainesMaintenances = await prisma.planningMaintenance.findMany({
      where: {
        estComplete: false,
        dateEstimee: {
          gte: new Date()
        }
      },
      orderBy: {
        dateEstimee: 'asc'
      },
      take: 5
    });
    
    // 5. Enrichir les données des motos avec l'état de maintenance
    const motosAvecEtat = await Promise.all(
      stats.cycles.disponibles > 0 
        ? await prisma.partieCycle.findMany({
            where: { etat: EtatEntite.DISPONIBLE },
            include: { moteurCourant: true },
            take: 5
          }).then(motos => motos.map(moto => {
            const etatCycle = verifierBesoinEntretienCycle(moto);
            let etatMoteur = null;
            
            if (moto.moteurCourant) {
              etatMoteur = verifierBesoinEntretienMoteur(moto.moteurCourant);
            }
            
            return {
              ...moto,
              etatMaintenance: {
                cycle: etatCycle,
                moteur: etatMoteur,
                niveauUrgenceGlobal: Math.max(
                  etatCycle.niveauUrgence,
                  etatMoteur?.niveauUrgence || 0
                )
              }
            };
          }))
        : []
    );
    
    // 6. Vérifier les contrôles journaliers manquants
    const aujourdhui = new Date();
    const hier = new Date(aujourdhui);
    hier.setDate(hier.getDate() - 1);
    
    const motosDisponibles = await prisma.partieCycle.findMany({
      where: { etat: EtatEntite.DISPONIBLE },
      select: { id: true }
    });
    
    const controleManquants = [];
    
    for (const moto of motosDisponibles) {
      const dernierControle = await prisma.controleJournalier.findFirst({
        where: { cycleId: moto.id },
        orderBy: { date: 'desc' }
      });
      
      if (!dernierControle || dernierControle.date < hier) {
        const cycle = await prisma.partieCycle.findUnique({
          where: { id: moto.id }
        });
        
        if (cycle) {
          controleManquants.push(cycle);
        }
      }
    }
    
    return {
      ...stats,
      motosAvecEtat,
      controleManquants,
      prochainesMaintenances,
      alertesCreees: alertes.success ? alertes.alertesGenerees : [],
      alertesStats: alertes.success ? alertes.stats : null,
      planningsGeneres: planning.success ? planning.planningsGeneres : [],
      planningStats: planning.success ? planning.stats : null
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données du dashboard:', error);
    throw new Error('Impossible de récupérer les données du dashboard. Veuillez réessayer.');
  }
}

/**
 * Obtenir un résumé de l'état des motos
 * Utile pour l'affichage d'un état rapide sur une vue mobile ou un widget
 */
export async function getEtatMotosSummary() {
  try {
    // Compter les motos par état
    const etatStats = await prisma.partieCycle.groupBy({
      by: ['etat'],
      _count: {
        id: true
      }
    });
    
    // Organiser les comptages dans un objet
    const summary = {
      total: 0,
      disponibles: 0,
      enMaintenance: 0,
      aVerifier: 0,
      horsService: 0,
      indisponibles: 0
    };
    
    etatStats.forEach(stat => {
      const count = stat._count.id;
      summary.total += count;
      
      switch (stat.etat) {
        case EtatEntite.DISPONIBLE:
          summary.disponibles = count;
          break;
        case EtatEntite.EN_MAINTENANCE:
          summary.enMaintenance = count;
          break;
        case EtatEntite.A_VERIFIER:
          summary.aVerifier = count;
          break;
        case EtatEntite.HORS_SERVICE:
          summary.horsService = count;
          break;
        case EtatEntite.INDISPONIBLE:
          summary.indisponibles = count;
          break;
      }
    });
    
    // Calculer le taux de disponibilité
    const tauxDisponibilite = summary.total > 0 
      ? (summary.disponibles / summary.total) * 100 
      : 0;
    
    return {
      ...summary,
      tauxDisponibilite
    };
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé des motos:', error);
    throw new Error('Impossible de récupérer le résumé des motos. Veuillez réessayer.');
  }
}

/**
 * Obtenir les statistiques d'utilisation hebdomadaire
 * Utile pour les graphiques du dashboard
 */
export async function getUtilisationHebdomadaire() {
  try {
    // Définir la plage de dates pour la semaine dernière
    const aujourdhui = new Date();
    const debutSemaine = new Date(aujourdhui);
    debutSemaine.setDate(debutSemaine.getDate() - 7);
    
    // Récupérer les utilisations de la semaine
    const utilisations = await prisma.utilisation.findMany({
      where: {
        date: {
          gte: debutSemaine,
          lte: aujourdhui
        }
      },
      include: {
        cycle: true
      },
      orderBy: {
        date: 'asc'
      }
    });
    
    // Organiser les données par jour et par moto
    const joursSemaine = [];
    for (let i = 0; i < 7; i++) {
      const jour = new Date(debutSemaine);
      jour.setDate(jour.getDate() + i);
      joursSemaine.push(jour);
    }
    
    // Créer la structure de données pour le graphique
    const dataSeries = joursSemaine.map(jour => {
      const jourStr = jour.toISOString().split('T')[0];
      
      // Filtrer les utilisations pour ce jour
      const utilisationsJour = utilisations.filter(u => {
        const dateUtilisation = new Date(u.date);
        return dateUtilisation.toISOString().split('T')[0] === jourStr;
      });
      
      // Calculer la distance totale parcourue pour ce jour
      const distanceTotale = utilisationsJour.reduce((total, u) => total + u.distanceTotale, 0);
      
      // Compter le nombre de sessions
      const nombreSessions = utilisationsJour.length;
      
      return {
        date: jourStr,
        jour: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(jour),
        distanceTotale: Math.round(distanceTotale * 10) / 10,
        nombreSessions,
        motos: utilisationsJour.map(u => ({
          id: u.cycle.id,
          numSerie: u.cycle.numSerie,
          distanceTotale: u.distanceTotale
        }))
      };
    });
    
    return dataSeries;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisation hebdomadaire:', error);
    throw new Error('Impossible de récupérer l\'utilisation hebdomadaire. Veuillez réessayer.');
  }
}