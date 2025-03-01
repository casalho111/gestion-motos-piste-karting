import { EtatEntite, PartieCycle, Moteur } from '@prisma/client';

// Constantes pour les kilométrages d'entretien
export const KILOMETRAGE_ENTRETIEN_CYCLE = 6000; // Entretien tous les 6000 km pour les parties cycles
export const KILOMETRAGE_ENTRETIEN_MOTEUR = 3000; // Entretien tous les 3000 km pour les moteurs
export const SEUIL_ALERTE_ENTRETIEN = 200; // Seuil d'alerte en km avant entretien

/**
 * Calcule le kilométrage restant avant le prochain entretien
 * @param kilometrageActuel - Kilométrage actuel
 * @param kilometrageEntretien - Intervalle d'entretien en km
 * @returns Kilométrage restant avant le prochain entretien
 */
export function calculerKilometrageRestant(
  kilometrageActuel: number,
  kilometrageEntretien: number
): number {
  const prochaineEcheance = Math.ceil(kilometrageActuel / kilometrageEntretien) * kilometrageEntretien;
  return prochaineEcheance - kilometrageActuel;
}

/**
 * Détermine si un entretien est urgent en fonction du kilométrage restant
 * @param kilometrageRestant - Kilométrage restant avant entretien
 * @returns Niveau d'urgence (0: pas urgent, 1: à surveiller, 2: urgent)
 */
export function getNiveauUrgenceEntretien(kilometrageRestant: number): number {
  if (kilometrageRestant <= 0) {
    return 2; // Urgent (dépassé)
  } else if (kilometrageRestant <= SEUIL_ALERTE_ENTRETIEN) {
    return 1; // À surveiller
  }
  return 0; // Pas urgent
}

/**
 * Vérifie si une moto nécessite un entretien et retourne les informations associées
 * @param cycle - Objet PartieCycle
 * @returns Informations sur le besoin d'entretien
 */
export function verifierBesoinEntretienCycle(cycle: PartieCycle) {
  const kilometrageRestant = calculerKilometrageRestant(cycle.kilometrage, KILOMETRAGE_ENTRETIEN_CYCLE);
  const niveauUrgence = getNiveauUrgenceEntretien(kilometrageRestant);
  
  return {
    besoinEntretien: niveauUrgence > 0,
    kilometrageRestant,
    niveauUrgence,
    prochaineEcheance: cycle.kilometrage + kilometrageRestant
  };
}

/**
 * Vérifie si un moteur nécessite un entretien et retourne les informations associées
 * @param moteur - Objet Moteur
 * @returns Informations sur le besoin d'entretien
 */
export function verifierBesoinEntretienMoteur(moteur: Moteur) {
  const kilometrageRestant = calculerKilometrageRestant(moteur.kilometrage, KILOMETRAGE_ENTRETIEN_MOTEUR);
  const niveauUrgence = getNiveauUrgenceEntretien(kilometrageRestant);
  
  return {
    besoinEntretien: niveauUrgence > 0,
    kilometrageRestant,
    niveauUrgence,
    prochaineEcheance: moteur.kilometrage + kilometrageRestant
  };
}

/**
 * Détermine l'état de maintenance combiné d'une moto (cycle + moteur)
 * @param cycle - Objet PartieCycle avec moteurCourant (optionnel)
 * @returns État de maintenance global
 */
export function getEtatMaintenanceCombine(cycle: PartieCycle & { moteurCourant?: Moteur | null }) {
  const etatCycle = verifierBesoinEntretienCycle(cycle);
  let etatMoteur = null;
  
  if (cycle.moteurCourant) {
    etatMoteur = verifierBesoinEntretienMoteur(cycle.moteurCourant);
  }
  
  const niveauUrgenceGlobal = Math.max(
    etatCycle.niveauUrgence,
    etatMoteur?.niveauUrgence || 0
  );
  
  return {
    cycle: etatCycle,
    moteur: etatMoteur,
    niveauUrgenceGlobal,
    besoinEntretien: niveauUrgenceGlobal > 0,
  };
}

/**
 * Détermine si une moto est prête à l'emploi
 * @param cycle - Objet PartieCycle avec moteurCourant (optionnel)
 * @returns État de disponibilité
 */
export function estMotoPrete(cycle: PartieCycle & { moteurCourant?: Moteur | null }) {
  // Vérifier l'état de la partie cycle
  if (cycle.etat !== EtatEntite.DISPONIBLE) {
    return {
      estPrete: false,
      raison: `La partie cycle n'est pas disponible (${cycle.etat})`
    };
  }
  
  // Vérifier si un moteur est monté
  if (!cycle.moteurCourant) {
    return {
      estPrete: false,
      raison: 'Aucun moteur monté'
    };
  }
  
  // Vérifier l'état du moteur
  if (cycle.moteurCourant.etat !== EtatEntite.DISPONIBLE) {
    return {
      estPrete: false,
      raison: `Le moteur n'est pas disponible (${cycle.moteurCourant.etat})`
    };
  }
  
  // Vérifier l'entretien
  const etatMaintenance = getEtatMaintenanceCombine(cycle);
  if (etatMaintenance.niveauUrgenceGlobal >= 2) {
    return {
      estPrete: false,
      raison: 'Entretien urgent requis',
      detailsMaintenance: etatMaintenance
    };
  }
  
  return {
    estPrete: true,
    avertissement: etatMaintenance.niveauUrgenceGlobal === 1 ? 'Entretien à prévoir prochainement' : null,
    detailsMaintenance: etatMaintenance
  };
}