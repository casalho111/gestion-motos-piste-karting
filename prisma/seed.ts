// prisma/seed.ts
import { PrismaClient, EtatEntite, TypeEntretien, TypePiece, TypeUtilisation, Criticite } from '@prisma/client';
import { addDays, subDays, subMonths } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    try {
      console.log('Début du seeding...');
      
      // Nettoyage préalable de la base de données
      console.log('Nettoyage de la base de données...');
      await prisma.pieceUtilisee.deleteMany({});
      await prisma.maintenance.deleteMany({});
      await prisma.controleJournalier.deleteMany({});
      await prisma.utilisation.deleteMany({});
      await prisma.historiqueMontage.deleteMany({});
      await prisma.piece.deleteMany({});
      await prisma.planningMaintenance.deleteMany({});
      await prisma.alerte.deleteMany({});
      await prisma.moteur.deleteMany({});
      await prisma.partieCycle.deleteMany({});
      
      console.log('Création des parties cycles...');
      // Création des parties cycles - YZF-R 125
      const yzfCycles = [];
      for (let i = 0; i < 4; i++) {
        const cycle = await prisma.partieCycle.create({
          data: {
            numSerie: `YZF-${100 + i}`,
            modele: 'YZF-R 125',
            dateAcquisition: subMonths(new Date(), 6 + i),
            kilometrage: Math.floor(Math.random() * 5000) + 1000,
            etat: EtatEntite.DISPONIBLE,
            couleur: ['Bleu', 'Rouge', 'Noir', 'Blanc'][i % 4],
            // Ne pas définir moteurCourantId ici
          },
        });
        yzfCycles.push(cycle);
      }
      
      // Création des parties cycles - MT 125
      const mtCycles = [];
      for (let i = 0; i < 2; i++) {
        const cycle = await prisma.partieCycle.create({
          data: {
            numSerie: `MT-${200 + i}`,
            modele: 'MT 125',
            dateAcquisition: subMonths(new Date(), 4 + i),
            kilometrage: Math.floor(Math.random() * 4000) + 500,
            etat: i === 0 ? EtatEntite.DISPONIBLE : EtatEntite.EN_MAINTENANCE,
            couleur: ['Gris', 'Noir'][i % 2],
            // Ne pas définir moteurCourantId ici
          },
        });
        mtCycles.push(cycle);
      }
      
      const cycles = [...yzfCycles, ...mtCycles];
      console.log(`${cycles.length} parties cycles créées.`);
      
      console.log('Création des moteurs...');
      // Création des moteurs
      const moteurs = [];
      for (let i = 0; i < 8; i++) {
        const moteur = await prisma.moteur.create({
          data: {
            numSerie: `M${100 + i}`,
            type: i < 5 ? 'YZF-R' : 'MT',
            cylindree: 125,
            dateAcquisition: subMonths(new Date(), 3 + i),
            kilometrage: Math.floor(Math.random() * 3000) + 500,
            heuresMoteur: Math.floor(Math.random() * 50) + 10,
            etat: i < 6 ? EtatEntite.DISPONIBLE : i === 6 ? EtatEntite.EN_MAINTENANCE : EtatEntite.HORS_SERVICE,
          },
        });
        moteurs.push(moteur);
      }
      console.log(`${moteurs.length} moteurs créés.`);
      
      console.log('Association des moteurs aux parties cycles...');
      // Association des moteurs aux parties cycles (5 moteurs montés)
      for (let i = 0; i < 5; i++) {
        const cycle = cycles[i];
        const moteur = moteurs[i];
        
        // Mise à jour de la partie cycle avec le moteur courant
        await prisma.partieCycle.update({
          where: { id: cycle.id },
          data: { moteurCourantId: moteur.id }
        });
        
        // Création de l'historique de montage
        await prisma.historiqueMontage.create({
          data: {
            dateDebut: subDays(new Date(), 30 + i * 5),
            kilometrageDebutCycle: cycle.kilometrage - Math.floor(Math.random() * 500),
            kilometrageDebutMoteur: moteur.kilometrage - Math.floor(Math.random() * 500),
            technicien: ['Jean Dupont', 'Sophie Martin', 'Marc Lambert'][i % 3],
            cycleId: cycle.id,
            moteurId: moteur.id,
          }
        });
      }
      console.log('Moteurs associés aux parties cycles.');
    // Association des moteurs aux parties cycles (5 moteurs montés)
    for (let i = 0; i < 5; i++) {
      const cycle = cycles[i];
      const moteur = moteurs[i];
      
      // Mise à jour de la partie cycle avec le moteur courant
      await prisma.partieCycle.update({
        where: { id: cycle.id },
        data: { moteurCourantId: moteur.id }
      });
      
      // Création de l'historique de montage
      await prisma.historiqueMontage.create({
        data: {
          dateDebut: subDays(new Date(), 30 + i * 5),
          kilometrageDebutCycle: cycle.kilometrage - Math.floor(Math.random() * 500),
          kilometrageDebutMoteur: moteur.kilometrage - Math.floor(Math.random() * 500),
          technicien: ['Jean Dupont', 'Sophie Martin', 'Marc Lambert'][i % 3],
          cycleId: cycle.id,
          moteurId: moteur.id,
        }
      });
    }
    console.log('Moteurs associés aux parties cycles.');
    
    console.log('Création des pièces...');
    // Création des pièces
    const piecesData = [
      { nom: 'Plaquettes de frein avant', type: TypePiece.FREINAGE, prix: 29.99, stock: 4 },
      { nom: 'Plaquettes de frein arrière', type: TypePiece.FREINAGE, prix: 24.99, stock: 3 },
      { nom: 'Pneu avant 110/70-17', type: TypePiece.PNEU, prix: 79.90, stock: 2 },
      { nom: 'Pneu arrière 140/70-17', type: TypePiece.PNEU, prix: 89.90, stock: 2 },
      { nom: 'Huile moteur 1L', type: TypePiece.FLUIDE, prix: 18.50, stock: 10 },
      { nom: 'Filtre à huile', type: TypePiece.MOTEUR, prix: 12.90, stock: 8 },
      { nom: 'Chaîne de transmission', type: TypePiece.TRANSMISSION, prix: 49.90, stock: 3 },
      { nom: 'Kit joints moteur', type: TypePiece.MOTEUR, prix: 75.00, stock: 2 },
      { nom: 'Ampoule phare', type: TypePiece.ELECTRIQUE, prix: 15.90, stock: 6 },
      { nom: 'Batterie 12V', type: TypePiece.ELECTRIQUE, prix: 65.00, stock: 1 }
    ];
    
    const pieces = [];
    for (let i = 0; i < piecesData.length; i++) {
      const p = piecesData[i];
      const piece = await prisma.piece.create({
        data: {
          reference: `REF-${1000 + i}`,
          nom: p.nom,
          description: `Description pour ${p.nom}`,
          type: p.type,
          fournisseur: ['MotoTech', 'PiècePro', 'GaragePlus'][i % 3],
          prixUnitaire: p.prix,
          quantiteStock: p.stock,
          quantiteMinimale: p.type === TypePiece.FLUIDE ? 3 : 1,
          emplacement: `Étagère ${String.fromCharCode(65 + i % 5)}-${Math.floor(i / 5) + 1}`,
        }
      });
      pieces.push(piece);
    }
    console.log(`${pieces.length} pièces créées.`);
    
    console.log('Création des contrôles journaliers...');
    // Création de contrôles journaliers
    for (let i = 0; i < 20; i++) {
      const cycleIndex = i % cycles.length;
      await prisma.controleJournalier.create({
        data: {
          date: subDays(new Date(), i % 10),
          controleur: ['Jean', 'Sophie', 'Marc'][i % 3],
          estConforme: i % 7 !== 0, // Quelques contrôles non conformes
          freinsAvant: i % 7 !== 0,
          freinsArriere: true,
          pneus: true,
          suspensions: true,
          transmission: i % 11 !== 0,
          niveauxFluides: true,
          eclairage: true,
          commentaires: i % 7 === 0 ? "Usure des plaquettes à surveiller" : null,
          cycleId: cycles[cycleIndex].id,
        }
      });
    }
    console.log('Contrôles journaliers créés.');
    
    console.log('Création des utilisations...');
    // Création d'utilisations
    for (let i = 0; i < 50; i++) {
      const cycleIndex = i % cycles.length;
      const nbTours = Math.floor(Math.random() * 30) + 5;
      await prisma.utilisation.create({
        data: {
          date: subDays(new Date(), Math.floor(i / 2)),
          responsable: ['Jean', 'Sophie', 'Marc', 'Lucie', 'Thomas'][i % 5],
          nbTours: nbTours,
          distanceTour: 800,
          distanceTotale: nbTours * 800 / 1000, // en km
          type: i % 10 === 0 ? TypeUtilisation.COURSE : TypeUtilisation.SESSION_NORMALE,
          notes: i % 15 === 0 ? "Légère vibration à haute vitesse" : null,
          cycleId: cycles[cycleIndex].id,
        }
      });
    }
    console.log('Utilisations créées.');
    
    console.log('Création des maintenances...');
    // Création de maintenances
    for (let i = 0; i < 15; i++) {
      // Alternance entre maintenance de cycle et de moteur
      const isCycle = i % 2 === 0;
      const entityId = isCycle 
        ? cycles[i % cycles.length].id 
        : moteurs[i % moteurs.length].id;
      
      const maintenance = await prisma.maintenance.create({
        data: {
          type: [TypeEntretien.ENTRETIEN_REGULIER, TypeEntretien.VIDANGE, TypeEntretien.FREINS][i % 3],
          dateRealisation: subDays(new Date(), 7 * (i % 8) + 1),
          kilometrageEffectue: 1000 * (i % 6) + 500,
          coutTotal: Math.floor(Math.random() * 200) + 50,
          technicien: ['Sophie Martin', 'Marc Lambert'][i % 2],
          description: `Maintenance ${isCycle ? 'cycle' : 'moteur'} #${i + 1}`,
          notes: i % 5 === 0 ? "RAS, fonctionnement optimal après intervention" : null,
          cycleId: isCycle ? entityId : null,
          moteurId: !isCycle ? entityId : null,
        }
      });
      
      // Ajout des pièces utilisées pour cette maintenance
      if (i % 3 !== 2) { // Pas de pièces pour chaque maintenance
        const nbPieces = Math.floor(Math.random() * 2) + 1;
        for (let j = 0; j < nbPieces; j++) {
          const piece = pieces[(i + j) % pieces.length];
          await prisma.pieceUtilisee.create({
            data: {
              quantite: Math.floor(Math.random() * 2) + 1,
              prixUnitaire: piece.prixUnitaire,
              pieceId: piece.id,
              maintenanceId: maintenance.id,
            }
          });
        }
      }
    }
    console.log('Maintenances créées.');
    
    console.log('Création des plannings de maintenance...');
    // Création de plannings de maintenance
    for (let i = 0; i < 5; i++) {
      await prisma.planningMaintenance.create({
        data: {
          titre: `Entretien planifié #${i + 1}`,
          description: `Description de l'entretien planifié #${i + 1}`,
          type: [TypeEntretien.ENTRETIEN_REGULIER, TypeEntretien.VIDANGE, TypeEntretien.REVISION_MOTEUR][i % 3],
          dateEstimee: addDays(new Date(), 7 * (i + 1)),
          estMoteur: i % 2 === 1,
          entiteId: i % 2 === 0 ? cycles[i % cycles.length].id : moteurs[i % moteurs.length].id,
          kilometragePrevu: Math.floor(Math.random() * 2000) + 4000,
          criticite: [Criticite.FAIBLE, Criticite.MOYENNE, Criticite.ELEVEE][i % 3],
          technicienAssigne: i % 4 === 0 ? null : ['Sophie Martin', 'Marc Lambert'][i % 2],
          estComplete: false,
        }
      });
    }
    console.log('Plannings de maintenance créés.');
    
    console.log('Création des alertes...');
    // Création d'alertes
    const alerteTypes = ["MAINTENANCE", "STOCK", "INCIDENT"];
    const alerteTitres = [
      "Entretien urgent requis",
      "Stock faible de pièces critiques",
      "Incident signalé sur moto"
    ];
    const alerteMessages = [
      "La moto YZF-100 nécessite un entretien urgent (dépassement de 200 km).",
      "Stock de plaquettes de frein avant en dessous du seuil minimal (2 restantes).",
      "Vibrations anormales signalées sur la moto MT-200 lors de la dernière session."
    ];
    
    for (let i = 0; i < 3; i++) {
      await prisma.alerte.create({
        data: {
          titre: alerteTitres[i],
          message: alerteMessages[i],
          type: alerteTypes[i],
          criticite: i === 0 ? Criticite.ELEVEE : i === 1 ? Criticite.MOYENNE : Criticite.FAIBLE,
          estTraitee: i === 2,
          traitePar: i === 2 ? 'Sophie Martin' : null,
          dateTraitement: i === 2 ? subDays(new Date(), 1) : null,
          cycleId: i === 0 || i === 2 ? (i === 0 ? cycles[0].id : cycles[5].id) : null,
          pieceId: i === 1 ? pieces[0].id : null,
        }
      });
    }
    console.log('Alertes créées.');
    
    console.log('Base de données initialisée avec succès avec des données de test !');
  } catch (error) {
    console.error('Erreur lors du seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Erreur lors de l\'exécution du seed:', e);
    process.exit(1);
  });