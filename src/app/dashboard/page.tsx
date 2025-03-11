'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDashboardData } from '@/app/actions/dashboard';
import { genererAlertesEntretien } from '@/app/actions/alertes';
import { genererPlanningAutomatique } from '@/app/actions/planning';

// Composants
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Composants du dashboard
import { StatCard } from '@/components/dashboard/stat-card';
import { AlertsList } from '@/components/dashboard/alerts-list';
import { ActivitiesList } from '@/components/dashboard/activities-list';
import { AvailabilityGrid } from '@/components/dashboard/availability-grid';
import { CostChart } from '@/components/dashboard/charts/cost-chart';
import { UsageChart } from '@/components/dashboard/charts/usage-chart';
import { MaintenanceSchedule } from '@/components/dashboard/maintenance-schedule';

// Icons
import { Bike, Cog, Calendar, TrendingUp, Clock, Wrench, RefreshCw, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { PiEngineBold } from "react-icons/pi";
import { LiaMotorcycleSolid } from "react-icons/lia";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('apercu');
  const router = useRouter();

  // Charger les données du dashboard
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setIsLoading(true);
        const data = await getDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Erreur lors du chargement des données du dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Fonction pour actualiser les données et générer les alertes
  async function refreshDashboard() {
    setIsRefreshing(true);
    try {
      // Générer de nouvelles alertes basées sur l'état actuel
      await genererAlertesEntretien();
      
      // Générer des plannings de maintenance
      await genererPlanningAutomatique();
      
      // Recharger les données du dashboard
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Erreur lors de l\'actualisation du dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  }

  // Préparer les données pour les graphiques
  const usageData = dashboardData?.utilisation?.hebdomadaire?.map((item: {
    date: string;
    distanceTotale: number;
    utilisations?: Array<{
      cycle?: { modele: string };
      distanceTotale: number;
    }>;
  }) => ({
    date: item.date,
    distanceTotale: item.distanceTotale,
    models: {
      "YZF-R 125": item.utilisations?.filter(u => u.cycle?.modele === "YZF-R 125")?.reduce((sum, u) => sum + u.distanceTotale, 0) || 0,
      "MT 125": item.utilisations?.filter(u => u.cycle?.modele === "MT 125")?.reduce((sum, u) => sum + u.distanceTotale, 0) || 0,
    }
  })) || [];

  // Données simulées pour le graphique de coûts (à remplacer par des données réelles plus tard)
  const costData = [
    { date: "2024-10", maintenance: 120, pieces: 80, total: 200, budget: 250 },
    { date: "2024-11", maintenance: 150, pieces: 100, total: 250, budget: 250 },
    { date: "2024-12", maintenance: 180, pieces: 150, total: 330, budget: 250 },
    { date: "2025-01", maintenance: 200, pieces: 120, total: 320, budget: 300 },
    { date: "2025-02", maintenance: 160, pieces: 140, total: 300, budget: 300 },
    { date: "2025-03", maintenance: 190, pieces: 110, total: 300, budget: 300 },
  ];

  // Définition du type pour les motos
  type MotoAvecEtat = {
    id: string;
    numSerie: string;
    modele: string;
    kilometrage: number;
    etat: string;
    etatMaintenance?: {
      cycle?: {
        prochainEntretienKm: number;
        prochainEntretienDate: string;
      }
    }
  };

  // Données pour la grille de disponibilité des motos
  const motoBays = dashboardData?.motosAvecEtat?.map((moto: MotoAvecEtat, index: number) => ({
    id: moto.id,
    name: `Emplacement ${index + 1}`,
    moto: {
      id: moto.id,
      numSerie: moto.numSerie,
      modele: moto.modele,
      kilometrage: moto.kilometrage,
      etat: moto.etat,
      maintenance: {
        nextDueKm: moto.etatMaintenance?.cycle?.prochainEntretienKm,
        nextDueDate: moto.etatMaintenance?.cycle?.prochainEntretienDate,
      }
    }
  })) || [];

  // Ajouter des emplacements vides si nécessaire pour compléter la grille
  const totalBays = 6; // Nombre total d'emplacements
  for (let i = motoBays.length; i < totalBays; i++) {
    motoBays.push({
      id: `empty-${i}`,
      name: `Emplacement ${i + 1}`,
      moto: null
    });
  }

  // Définir le type pour les alertes
  type Alerte = {
    id: string;
    type: string;
    titre: string;
    message: string;
    dateCreation: string;
    criticite: string;
    estTraitee: boolean;
    cycleId?: string;
    moteurId?: string;
    pieceId?: string;
  };

  // Définir le type pour les alertes transformées
  type AlertItem = {
    id: string;
    type: 'maintenance' | 'stock' | 'info';
    title: string;
    message: string;
    date: Date;
    criticite: string;
    isRead: boolean;
    entity?: {
      id: string;
      type: 'moto' | 'moteur' | 'piece';
      name?: string;
    };
  };

  // Transformer les alertes pour le composant AlertsList
  const alertsList = dashboardData?.alertesCreees?.map((alerte: Alerte) => ({
    id: alerte.id,
    type: alerte.type === 'MAINTENANCE' ? 'maintenance' : 
          alerte.type === 'STOCK' ? 'stock' : 'info',
    title: alerte.titre,
    message: alerte.message,
    date: new Date(alerte.dateCreation),
    criticite: alerte.criticite,
    isRead: alerte.estTraitee,
    entity: alerte.cycleId ? {
      id: alerte.cycleId,
      type: 'moto',
      name: alerte.titre.split(' ').pop()
    } : alerte.moteurId ? {
      id: alerte.moteurId,
      type: 'moteur',
      name: alerte.titre.split(' ').pop()
    } : alerte.pieceId ? {
      id: alerte.pieceId,
      type: 'piece',
      name: alerte.titre.split(' ').pop()
    } : undefined
  } as AlertItem)) || [] as AlertItem[];

  // Définition du type pour les contrôles
  type Controle = {
    id: string;
    date: string;
    estConforme: boolean;
    controleur: string;
    cycle: {
      id: string;
      numSerie: string;
    };
  };

  // Définition du type pour les montages
  type Montage = {
    id: string;
    dateDebut: string;
    technicien: string;
    cycle: {
      id: string;
      numSerie: string;
    };
    moteur: {
      id: string;
      numSerie: string;
    };
  };

  // Transformer les activités récentes
  const recentActivities = [
    ...(dashboardData?.activite?.controles || []).map((controle: Controle) => ({
      id: controle.id,
      type: 'control' as const,
      title: `Contrôle journalier ${controle.cycle.numSerie}`,
      date: new Date(controle.date),
      user: {
        id: '1',
        name: controle.controleur
      },
      entity: {
        id: controle.cycle.id,
        type: 'moto' as const,
        name: controle.cycle.numSerie
      }
    })),
    // Correction du mapping des montages (première partie)
    ...(dashboardData?.activite?.montages || []).map((montage: Montage) => ({
      id: montage.id,
      type: 'mounting' as const,
      title: `Montage moteur sur ${montage.cycle.numSerie}`,
      description: `Moteur ${montage.moteur.numSerie} monté`,
      date: new Date(montage.dateDebut),
      user: {
        id: '2',
        name: montage.technicien
      },
      entity: {
        id: montage.cycle.id,
        type: 'moto' as const,
        name: montage.cycle.numSerie
      }
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Transformer les plannings de maintenance
  const maintenanceItems = dashboardData?.prochainesMaintenances?.map((planning: {
    id: string;
    titre: string;
    description: string;
    dateEstimee: string;
    type: string;
    criticite: string;
    technicienAssigne: string;
    entiteId: string;
    estMoteur: boolean;
    estComplete: boolean;
  }) => ({
    id: planning.id,
    title: planning.titre,
    description: planning.description,
    date: new Date(planning.dateEstimee),
    type: planning.type,
    criticite: planning.criticite,
    technicien: planning.technicienAssigne,
    entity: {
      id: planning.entiteId,
      type: planning.estMoteur ? 'moteur' : 'moto',
      name: planning.titre.split(' ').pop(),
      etat: 'DISPONIBLE' // À remplacer par la valeur réelle
    },
    isComplete: planning.estComplete
  })) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <Button disabled variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Chargement...</CardTitle>
                  <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-28 bg-muted animate-pulse rounded-md" />
                <div className="mt-2 h-4 w-full bg-muted animate-pulse rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshDashboard} 
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>

      {/* Alertes générées */}
      {dashboardData?.alertesStats && dashboardData.alertesStats.total > 0 && (
        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle>Nouvelles alertes générées</AlertTitle>
          <AlertDescription>
            {dashboardData.alertesStats.total} nouvelle(s) alerte(s) générée(s) : 
            {dashboardData.alertesStats.cycles > 0 && ` ${dashboardData.alertesStats.cycles} pour les motos,`}
            {dashboardData.alertesStats.moteurs > 0 && ` ${dashboardData.alertesStats.moteurs} pour les moteurs,`}
            {dashboardData.alertesStats.stock > 0 && ` ${dashboardData.alertesStats.stock} pour le stock.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Plannings générés */}
      {dashboardData?.planningStats && dashboardData.planningStats.total > 0 && (
        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle>Nouveaux plannings de maintenance</AlertTitle>
          <AlertDescription>
            {dashboardData.planningStats.total} nouveau(x) planning(s) de maintenance créé(s) : 
            {dashboardData.planningStats.cycles > 0 && ` ${dashboardData.planningStats.cycles} pour les motos,`}
            {dashboardData.planningStats.moteurs > 0 && ` ${dashboardData.planningStats.moteurs} pour les moteurs.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Contrôles manquants */}
      {dashboardData?.controleManquants && dashboardData.controleManquants.length > 0 && (
        <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle>Contrôles journaliers manquants</AlertTitle>
          <AlertDescription>
            {dashboardData.controleManquants.length} moto(s) n'ont pas eu de contrôle journalier depuis plus de 24h :
            {dashboardData.controleManquants.map((moto: { numSerie: string }) => ` ${moto.numSerie}`).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs pour la navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="apercu">Aperçu</TabsTrigger>
          <TabsTrigger value="motos">Motos</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="activite">Activité</TabsTrigger>
        </TabsList>

        {/* Tab: Aperçu */}
        <TabsContent value="apercu" className="space-y-6">
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Motos disponibles"
              value={`${dashboardData?.cycles?.disponibles || 0}/${dashboardData?.cycles?.total || 0}`}
              icon={Bike}
              iconColor="text-blue-500 bg-blue-100 dark:bg-blue-950"
              variant="positive"
              variation={dashboardData?.cycles?.disponibles > dashboardData?.cycles?.total / 2 ? 10 : -5}
              variationText="vs mois dernier"
            />
            
            <StatCard
              title="Moteurs montés"
              value={`${dashboardData?.moteurs?.montes || 0}/${dashboardData?.moteurs?.total || 0}`}
              icon={PiEngineBold as any}
              iconColor="text-green-500 bg-green-100 dark:bg-green-950"
            />
            
            <StatCard
              title="Maintenances prévues"
              value={maintenanceItems.length.toString()}
              icon={Wrench}
              iconColor="text-amber-500 bg-amber-100 dark:bg-amber-950"
            />
            
            <StatCard
              title="Coût maintenance"
              value={`${dashboardData?.maintenances?.coutTotal || 0}€`}
              icon={TrendingUp}
              iconColor="text-purple-500 bg-purple-100 dark:bg-purple-950"
              variant="negative"
              variation={-8}
              variationText="vs budget"
            />
          </div>

          {/* Alertes importantes et Activités récentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AlertsList
              alerts={alertsList.slice(0, 3)}
              title="Alertes importantes"
              description="Notifications nécessitant votre attention"
              onViewAll={() => router.push('/dashboard/alertes')}
              maxItems={3}
            />
            
            <MaintenanceSchedule
              items={maintenanceItems.slice(0, 3)}
              title="Prochaines maintenances"
              onViewAll={() => router.push('/dashboard/maintenance')}
              maxItems={3}
            />
          </div>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto flex flex-col gap-2 p-4" asChild>
                  <Link href="/dashboard/controles/nouveau">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div className="text-center">
                      <p className="font-medium">Contrôle journalier</p>
                      <p className="text-xs text-muted-foreground">Effectuer une vérification</p>
                    </div>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto flex flex-col gap-2 p-4" asChild>
                  <Link href="/dashboard/utilisations/nouvelle">
                    <Clock className="h-6 w-6 text-blue-500" />
                    <div className="text-center">
                      <p className="font-medium">Session circuit</p>
                      <p className="text-xs text-muted-foreground">Enregistrer utilisation</p>
                    </div>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto flex flex-col gap-2 p-4" asChild>
                  <Link href="/dashboard/maintenance/nouvelle">
                    <Wrench className="h-6 w-6 text-amber-500" />
                    <div className="text-center">
                      <p className="font-medium">Maintenance</p>
                      <p className="text-xs text-muted-foreground">Planifier entretien</p>
                    </div>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto flex flex-col gap-2 p-4" asChild>
                  <Link href="/dashboard/moteurs/montage">
                    <Cog className="h-6 w-6 text-purple-500" />
                    <div className="text-center">
                      <p className="font-medium">Montage moteur</p>
                      <p className="text-xs text-muted-foreground">Installer un moteur</p>
                    </div>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Motos */}
        <TabsContent value="motos" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>État du parc</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/motos">
                    Voir toutes les motos
                  </Link>
                </Button>
              </div>
              <CardDescription>
                Aperçu de la disponibilité des motos par emplacement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AvailabilityGrid
                bays={motoBays}
                onClick={(bay) => bay.moto && router.push(`/dashboard/motos/${bay.moto.id}`)}
              />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Utilisation hebdomadaire</CardTitle>
                <CardDescription>
                  Distance parcourue par modèle (km)
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <UsageChart
                  data={usageData}
                  showLegend={true}
                  height={350}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Détail des motos</CardTitle>
                <CardDescription>
                  État des motos par modèle et statut
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* YZF-R 125 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">YZF-R 125</h3>
                      <Badge variant="outline">
                        {motoBays.filter((b: { moto?: { modele: string } }) => b.moto?.modele === 'YZF-R 125').length} motos
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {motoBays
                        .filter((b: { moto?: { modele: string } }) => b.moto?.modele === 'YZF-R 125')
                        .map((bay: { 
                          id: string;
                          moto?: {
                            id: string;
                            numSerie: string;
                            modele: string;
                            kilometrage: number;
                            etat: string;
                          };
                        }) => (
                          <div 
                            key={bay.id}
                            className="border rounded-md p-3 cursor-pointer hover:border-primary"
                            onClick={() => bay.moto && router.push(`/dashboard/motos/${bay.moto.id}`)}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{bay.moto?.numSerie}</p>
                              <Badge 
                                variant={
                                  bay.moto?.etat === 'DISPONIBLE' ? 'disponible' :
                                  bay.moto?.etat === 'EN_MAINTENANCE' ? 'maintenance' :
                                  bay.moto?.etat === 'A_VERIFIER' ? 'aVerifier' :
                                  bay.moto?.etat === 'HORS_SERVICE' ? 'horsService' : 'indisponible'
                                }
                                size="sm"
                              >
                                {bay.moto?.etat}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {bay.moto?.kilometrage.toLocaleString()} km
                            </p>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  
                  {/* MT 125 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">MT 125</h3>
                      <Badge variant="outline">
                        {motoBays.filter((b: { moto?: { modele: string } }) => b.moto?.modele === 'MT 125').length} motos
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {motoBays
                        .filter((b: { moto?: { modele: string } }) => b.moto?.modele === 'MT 125')
                        .map((bay: { 
                          id: string;
                          moto?: {
                            id: string;
                            numSerie: string;
                            modele: string;
                            kilometrage: number;
                            etat: string;
                          };
                        }) => (
                          <div 
                            key={bay.id}
                            className="border rounded-md p-3 cursor-pointer hover:border-primary"
                            onClick={() => bay.moto && router.push(`/dashboard/motos/${bay.moto.id}`)}
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{bay.moto?.numSerie}</p>
                              <Badge 
                                variant={
                                  bay.moto?.etat === 'DISPONIBLE' ? 'disponible' :
                                  bay.moto?.etat === 'EN_MAINTENANCE' ? 'maintenance' :
                                  bay.moto?.etat === 'A_VERIFIER' ? 'aVerifier' :
                                  bay.moto?.etat === 'HORS_SERVICE' ? 'horsService' : 'indisponible'
                                }
                                size="sm"
                              >
                                {bay.moto?.etat}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {bay.moto?.kilometrage.toLocaleString()} km
                            </p>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/motos/nouvelle">
                      Ajouter une moto
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Maintenance */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Coûts de maintenance</CardTitle>
                <CardDescription>
                  Évolution des coûts sur 6 mois
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <CostChart
                  data={costData}
                  showBudgetLine={true}
                  height={350}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Planning de maintenance</CardTitle>
                <CardDescription>
                  Interventions programmées à venir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MaintenanceSchedule
                  items={maintenanceItems}
                  onViewItem={(item) => {
                    if (item.entity) {
                      if (item.entity.type === 'moto') {
                        router.push(`/dashboard/motos/${item.entity.id}`);
                      } else if (item.entity.type === 'moteur') {
                        router.push(`/dashboard/moteurs/${item.entity.id}`);
                      }
                    }
                  }}
                  maxItems={5}
                  maxHeight={300}
                />
              </CardContent>
              <CardFooter>
                <div className="w-full flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/maintenance/nouvelle">
                      Nouvelle maintenance
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Alertes de maintenance</CardTitle>
              <CardDescription>
                Problèmes détectés nécessitant une intervention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertsList
                alerts={alertsList.filter((alert: AlertItem) =>
                  alert.type === 'maintenance' || 
                  alert.type === 'stock'
                )}
                maxItems={5}
                maxHeight={300}
              />
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/alertes">
                    Voir toutes les alertes
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab: Activité */}
        <TabsContent value="activite" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dernières activités</CardTitle>
              <CardDescription>
                Historique récent des actions et événements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivitiesList
                activities={recentActivities}
                maxItems={10}
                maxHeight={500}
              />
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/historique">
                    Voir tout l'historique
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
