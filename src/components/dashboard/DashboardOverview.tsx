'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStatsStore } from '@/store/store'
import { useSystemStatus } from '@/store/initStore'
import { MotoOverviewCard } from '@/components/dashboard/MotoOverviewCard'
import { MoteurOverviewCard } from '@/components/dashboard/MoteurOverviewCard'
import { AlertesOverview } from '@/components/dashboard/AlertesOverview'
import { MaintenanceList } from '@/components/dashboard/MaintenanceList'
import { UtilisationChart } from '@/components/dashboard/UtilisationChart'
import { StockStatusCard } from '@/components/dashboard/StockStatusCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

/**
 * Composant principal du tableau de bord qui affiche une vue d'ensemble du système
 * Utilise Zustand pour récupérer les données du dashboard
 */
export function DashboardOverview() {
  // Récupérer les données statistiques depuis le store
  const {
    dashboard,
    utilisationHebdomadaire,
    fetchDashboardData,
    fetchUtilisationHebdomadaire,
    getTauxDisponibilite
  } = useStatsStore()

  // Récupérer les informations de statut du système
  const {
    isLoading,
    isReady,
    tauxDisponibilite,
    nombreAlertesNonTraitees,
    nombreMotosDisponibles,
    systemHealth,
    lastUpdated
  } = useSystemStatus()

  // Charger les données au montage du composant
  useEffect(() => {
    // Utiliser Promise.all pour charger les données en parallèle
    const loadData = async () => {
      await Promise.all([
        fetchDashboardData(),
        fetchUtilisationHebdomadaire()
      ])
    }

    loadData()

    // Configurer un intervalle pour rafraîchir les données toutes les 5 minutes
    const refreshInterval = setInterval(() => {
      loadData()
    }, 5 * 60 * 1000)

    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(refreshInterval)
  }, [fetchDashboardData, fetchUtilisationHebdomadaire])

  // Afficher un squelette de chargement si les données ne sont pas encore disponibles
  if (isLoading || !dashboard.data) {
    return <DashboardSkeleton />
  }

  // Déterminer la couleur de l'indicateur de santé du système
  const getSystemHealthColor = () => {
    switch (systemHealth) {
      case 'healthy':
        return 'text-green-500'
      case 'warning':
        return 'text-amber-500'
      case 'critical':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  // Obtenir l'icône correspondant à l'état de santé du système
  const getSystemHealthIcon = () => {
    switch (systemHealth) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* En-tête du dashboard avec le statut global */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
          <p className="text-muted-foreground">
            Vue d'ensemble du parc de motos et des statistiques du système
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className={getSystemHealthColor()}>
            {getSystemHealthIcon()}
          </span>
          <span>
            Santé du système: <span className="font-semibold">{
              systemHealth === 'healthy' ? 'Bon' 
              : systemHealth === 'warning' ? 'Attention' 
              : 'Critique'
            }</span>
          </span>
          {lastUpdated && (
            <span className="text-muted-foreground">
              · Mis à jour {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Afficher une alerte si le taux de disponibilité est faible */}
      {tauxDisponibilite < 50 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Disponibilité critique</AlertTitle>
          <AlertDescription>
            Moins de 50% des motos sont actuellement disponibles. Vérifiez les maintenances en cours.
          </AlertDescription>
        </Alert>
      )}

      {/* Vue d'ensemble des motos et moteurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MotoOverviewCard 
          totalMotos={dashboard.data.cycles.total}
          disponibles={dashboard.data.cycles.disponibles}
          enMaintenance={dashboard.data.cycles.enMaintenance}
          horsService={dashboard.data.cycles.horsService}
        />
        
        <MoteurOverviewCard 
          totalMoteurs={dashboard.data.moteurs.total}
          disponibles={dashboard.data.moteurs.disponibles}
          montes={dashboard.data.moteurs.montes}
          horsService={dashboard.data.moteurs.horsService}
        />
        
        <StockStatusCard 
          totalPieces={dashboard.data.alertes.piecesStockBas.length}
          piecesStockBas={dashboard.data.alertes.piecesStockBas}
        />
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Coût maintenance</CardTitle>
            <CardDescription>Dernier trimestre</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(dashboard.data.maintenances.coutTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboard.data.maintenances.recentes.length} opérations récentes
            </p>
            <div className="mt-4 h-1 w-full bg-gradient-to-r from-green-500 to-red-500 rounded-full"></div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets pour les différentes sections du dashboard */}
      <Tabs defaultValue="utilisation" className="mt-6">
        <TabsList className="grid w-full md:w-auto grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="utilisation">Utilisation</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="alertes">Alertes</TabsTrigger>
          <TabsTrigger value="activite">Activité récente</TabsTrigger>
        </TabsList>
        
        <TabsContent value="utilisation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Utilisation hebdomadaire</CardTitle>
              <CardDescription>
                Kilométrage parcouru ces 7 derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <UtilisationChart 
                  data={utilisationHebdomadaire.data || []} 
                  isLoading={utilisationHebdomadaire.status === 'loading'} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenances récentes</CardTitle>
              <CardDescription>
                Dernières opérations de maintenance effectuées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MaintenanceList 
                maintenances={dashboard.data.maintenances.recentes} 
                isLoading={dashboard.status === 'loading'}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alertes" className="mt-4">
          <AlertesOverview 
            alertes={dashboard.data.alertes.piecesStockBas}
            nombreAlertesNonTraitees={nombreAlertesNonTraitees}
            isLoading={dashboard.status === 'loading'}
          />
        </TabsContent>
        
        <TabsContent value="activite" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>
                Dernières actions effectuées sur le système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Contrôles journaliers récents */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Contrôles journaliers</h3>
                  <div className="space-y-4">
                    {dashboard.data.activite.controles.slice(0, 3).map((controle) => (
                      <div key={controle.id} className="flex items-start space-x-4">
                        <div className={`w-2 h-2 mt-2 rounded-full ${controle.estConforme ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="font-medium">{controle.cycle.numSerie} ({controle.cycle.modele})</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(controle.date).toLocaleDateString('fr-FR')} par {controle.controleur}
                            {!controle.estConforme && (
                              <span className="text-red-500"> - Non conforme</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                {/* Montages de moteurs récents */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Montages de moteurs</h3>
                  <div className="space-y-4">
                    {dashboard.data.activite.montages.slice(0, 3).map((montage) => (
                      <div key={montage.id} className="flex items-start space-x-4">
                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                        <div>
                          <p className="font-medium">
                            Moteur {montage.moteur.numSerie} sur {montage.cycle.numSerie}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(montage.dateDebut).toLocaleDateString('fr-FR')} par {montage.technicien}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Squelette de chargement pour le tableau de bord
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        <p className="text-muted-foreground">Chargement des données...</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/3 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    </div>
  )
}