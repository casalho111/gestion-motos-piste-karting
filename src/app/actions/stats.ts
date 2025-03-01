'use server'

import { prisma } from '@/lib/db';
import { EtatEntite, TypeEntretien, TypePiece } from '@prisma/client';

/**
 * Obtenir les statistiques pour le dashboard
 */
export async function getDashboardStats() {
  try {
    // Statistiques des parties cycles
    const countCycles = await prisma.partieCycle.count();
    const countCyclesDisponibles = await prisma.partieCycle.count({
      where: { etat: EtatEntite.DISPONIBLE }
    });
    const countCyclesEnMaintenance = await prisma.partieCycle.count({
      where: { etat: EtatEntite.EN_MAINTENANCE }
    });
    const countCyclesAVerifier = await prisma.partieCycle.count({
      where: { etat: EtatEntite.A_VERIFIER }
    });
    const countCyclesHorsService = await prisma.partieCycle.count({
      where: { etat: EtatEntite.HORS_SERVICE }
    });
    
    // Statistiques des moteurs
    const countMoteurs = await prisma.moteur.count();
    const countMoteursDisponibles = await prisma.moteur.count({
      where: { etat: EtatEntite.DISPONIBLE, cycleActuel: null }
    });
    const countMoteursMontés = await prisma.moteur.count({
      where: { cycleActuel: { isNot: null } }
    });
    const countMoteursEnMaintenance = await prisma.moteur.count({
      where: { etat: EtatEntite.EN_MAINTENANCE }
    });
    const countMoteursHorsService = await prisma.moteur.count({
      where: { etat: EtatEntite.HORS_SERVICE }
    });
    
    // Statistiques de maintenance
    const maintenancesRecentes = await prisma.maintenance.findMany({
      take: 5,
      orderBy: { dateRealisation: 'desc' },
      include: {
        cycle: true,
        moteur: true
      }
    });
    
    // Alertes de stock
    const piecesStockBas = await prisma.piece.findMany({
      where: {
        quantiteStock: {
          lte: prisma.piece.fields.quantiteMinimale
        }
      },
      orderBy: {
        quantiteStock: 'asc'
      },
      take: 10
    });
    
    // Calculer les alertes pour les maintenances à venir
    // (Dans une application réelle, cela serait fait avec une logique plus complexe)
    // Ici, on simule des alertes basées sur le temps passé depuis la dernière maintenance
    
    // Activité récente (montages, contrôles, etc.)
    const derniersControles = await prisma.controleJournalier.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        cycle: true
      }
    });
    
    const derniersMontages = await prisma.historiqueMontage.findMany({
      where: {
        dateFin: null // Montages actifs
      },
      take: 5,
      orderBy: { dateDebut: 'desc' },
      include: {
        cycle: true,
        moteur: true
      }
    });
    
    // Coûts de maintenance
    const coutsTotalMaintenance = await prisma.maintenance.aggregate({
      _sum: {
        coutTotal: true
      }
    });
    
    // Utilisation hebdomadaire
    const dateDebutSemaine = new Date();
    dateDebutSemaine.setDate(dateDebutSemaine.getDate() - 7);
    
    const utilisationHebdomadaire = await prisma.utilisation.groupBy({
      by: ['cycleId'],
      where: {
        date: {
          gte: dateDebutSemaine
        }
      },
      _sum: {
        distanceTotale: true,
        nbTours: true
      }
    });
    
    // Enrichir avec les informations des motos
    const cyclesIds = utilisationHebdomadaire.map(u => u.cycleId);
    const cycles = await prisma.partieCycle.findMany({
      where: {
        id: {
          in: cyclesIds
        }
      },
      select: {
        id: true,
        numSerie: true,
        modele: true
      }
    });
    
    const utilisationHebdomadaireEnrichie = utilisationHebdomadaire.map(u => {
      const cycle = cycles.find(c => c.id === u.cycleId);
      return {
        ...u,
        cycle
      };
    });
    
    return {
      cycles: {
        total: countCycles,
        disponibles: countCyclesDisponibles,
        enMaintenance: countCyclesEnMaintenance,
        aVerifier: countCyclesAVerifier,
        horsService: countCyclesHorsService
      },
      moteurs: {
        total: countMoteurs,
        disponibles: countMoteursDisponibles,
        montes: countMoteursMontés,
        enMaintenance: countMoteursEnMaintenance,
        horsService: countMoteursHorsService
      },
      maintenances: {
        recentes: maintenancesRecentes,
        coutTotal: coutsTotalMaintenance._sum.coutTotal || 0
      },
      alertes: {
        piecesStockBas
      },
      activite: {
        controles: derniersControles,
        montages: derniersMontages
      },
      utilisation: {
        hebdomadaire: utilisationHebdomadaireEnrichie
      }
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw new Error('Impossible de récupérer les statistiques. Veuillez réessayer.');
  }
}

/**
 * Obtenir les statistiques détaillées de maintenance
 */
export async function getMaintenanceStats(
  dateDebut?: Date,
  dateFin?: Date
) {
  try {
    const now = new Date();
    const dateFinDefault = new Date(now);
    const dateDebutDefault = new Date(now);
    dateDebutDefault.setMonth(dateDebutDefault.getMonth() - 3); // 3 derniers mois par défaut
    
    const start = dateDebut || dateDebutDefault;
    const end = dateFin || dateFinDefault;
    
    // Requête pour obtenir les maintenances dans la période
    const maintenances = await prisma.maintenance.findMany({
      where: {
        dateRealisation: {
          gte: start,
          lte: end
        }
      },
      include: {
        cycle: true,
        moteur: true,
        piecesUtilisees: {
          include: {
            piece: true
          }
        }
      },
      orderBy: {
        dateRealisation: 'desc'
      }
    });
    
    // Calculer les coûts par type d'entretien
    const coutParType: Record<TypeEntretien, number> = {} as Record<TypeEntretien, number>;
    Object.values(TypeEntretien).forEach(type => {
      coutParType[type] = 0;
    });
    
    maintenances.forEach(m => {
      coutParType[m.type] = (coutParType[m.type] || 0) + m.coutTotal;
    });
    
    // Calculer les coûts par modèle de moto
    const coutParModele: Record<string, number> = {};
    
    maintenances.forEach(m => {
      if (m.cycle) {
        const modele = m.cycle.modele;
        coutParModele[modele] = (coutParModele[modele] || 0) + m.coutTotal;
      }
    });
    
    // Calculer les pièces les plus utilisées
    const piecesUtilisees: Record<string, { count: number, cout: number, piece: any }> = {};
    
    maintenances.forEach(m => {
      m.piecesUtilisees.forEach(pu => {
        const pieceId = pu.piece.id;
        if (!piecesUtilisees[pieceId]) {
          piecesUtilisees[pieceId] = {
            count: 0,
            cout: 0,
            piece: pu.piece
          };
        }
        
        piecesUtilisees[pieceId].count += pu.quantite;
        piecesUtilisees[pieceId].cout += pu.quantite * pu.prixUnitaire;
      });
    });
    
    const piecesLesPlusUtilisees = Object.values(piecesUtilisees)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      total: {
        count: maintenances.length,
        cout: maintenances.reduce((sum, m) => sum + m.coutTotal, 0)
      },
      coutParType,
      coutParModele,
      piecesLesPlusUtilisees,
      maintenances
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de maintenance:', error);
    throw new Error('Impossible de récupérer les statistiques de maintenance. Veuillez réessayer.');
  }
}