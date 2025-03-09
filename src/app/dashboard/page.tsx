'use client'

import { useEffect } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { Bike, Wrench, Package, AlertCircle, ArrowRight } from "lucide-react"
import { PiEngineBold } from "react-icons/pi";
import { useMotoStore, useMoteurStore, usePlanningStore, usePieceStore, useStatsStore, useAlerteStore } from "@/store/store"
import { Skeleton } from "@/components/ui/skeleton"

// Couleurs pour les graphiques
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export default function DashboardPage() {
  const { motos } = useMotoStore()
  const { moteurs } = useMoteurStore()
  const { plannings, getPlanningsActifs } = usePlanningStore()
  const { pieces, getPiecesStockBas } = usePieceStore()
  const { utilisationHebdomadaire, fetchUtilisationHebdomadaire, dashboard, fetchDashboardData } = useStatsStore()
  const { alertes, nombreAlertesNonTraitees } = useAlerteStore()
  
  // Obtenir les plannings actifs pour les maintenances prévues
  const planningsActifs = getPlanningsActifs()

  // Pour gérer les maintenances prévues
  const maintenancesPrevues = {
    status: plannings.status,
    data: planningsActifs
  }

  // Charger les données nécessaires au tableau de bord
  useEffect(() => {
    fetchUtilisationHebdomadaire()
    fetchDashboardData()
  }, [fetchUtilisationHebdomadaire, fetchDashboardData])
  
  // Obtenir les pièces en stock bas
  const piecesStockBas = {
    status: pieces.status,
    data: getPiecesStockBas()
  }

  // Calculs des indicateurs
  const motosDisponibles = motos.data?.filter(m => m.etat === "DISPONIBLE") || []
  const motosEnMaintenance = motos.data?.filter(m => m.etat === "EN_MAINTENANCE") || []
  const motosHorsService = motos.data?.filter(m => m.etat === "HORS_SERVICE") || []
  const motosAVerifier = motos.data?.filter(m => m.etat === "A_VERIFIER") || []
  
  const moteursDisponibles = moteurs.data?.filter(m => m.etat === "DISPONIBLE" && !m.cycleActuel) || []
  const moteursMonte = moteurs.data?.filter(m => m.cycleActuel) || []

  // Données pour le graphique camembert
  const pieData = [
    { name: "Disponibles", value: motosDisponibles.length, color: "#16a34a" },
    { name: "En maintenance", value: motosEnMaintenance.length, color: "#f59e0b" },
    { name: "Hors service", value: motosHorsService.length, color: "#dc2626" },
    { name: "À vérifier", value: motosAVerifier.length, color: "#6366f1" },
  ].filter(item => item.value > 0)
  
  return (
    <div className="space-y-6">
      {/* Indicateurs clés */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Motos</CardTitle>
            <Bike className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {motos.status === "loading" ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {motosDisponibles.length} / {motos.data?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Motos disponibles
                </p>
              </>
            )}
          </CardContent>
          <CardFooter className="p-2">
            <Link href="/dashboard/motos" className="w-full">
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span>Voir motos</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Moteurs</CardTitle>
            <PiEngineBold className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {moteurs.status === "loading" ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {moteursDisponibles.length} / {moteurs.data?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {moteursMonte.length} moteurs montés
                </p>
              </>
            )}
          </CardContent>
          <CardFooter className="p-2">
            <Link href="/dashboard/moteurs" className="w-full">
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span>Voir moteurs</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Maintenances</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {maintenancesPrevues.status === "loading" ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {planningsActifs.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  maintenances prévues
                </p>
              </>
            )}
          </CardContent>
          <CardFooter className="p-2">
            <Link href="/dashboard/maintenance" className="w-full">
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span>Voir maintenances</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {piecesStockBas.status === "loading" ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {piecesStockBas.data?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  pièces en stock bas
                </p>
              </>
            )}
          </CardContent>
          <CardFooter className="p-2">
            <Link href="/dashboard/pieces" className="w-full">
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span>Voir stock</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Graphiques et statistiques */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Graphique État du parc */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>État du parc</CardTitle>
            <CardDescription>
              Répartition des motos par état
            </CardDescription>
          </CardHeader>
          <CardContent>
            {motos.status === "loading" ? (
              <div className="flex h-[300px] items-center justify-center">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : motos.data?.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-center text-muted-foreground">
                  Aucune donnée disponible
                </p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => 
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(value) => [`${value} motos`, "Quantité"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Graphique Utilisation hebdomadaire */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Utilisation hebdomadaire</CardTitle>
            <CardDescription>
              Kilométrage parcouru par jour (7 derniers jours)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {utilisationHebdomadaire.status === "loading" ? (
              <div className="flex h-[300px] items-center justify-center">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : !utilisationHebdomadaire.data || utilisationHebdomadaire.data.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center">
                <p className="text-center text-muted-foreground">
                  Aucune donnée d'utilisation disponible
                </p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilisationHebdomadaire.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' })} 
                    />
                    <YAxis unit=" km" />
                    <Tooltip 
                      formatter={(value) => [`${value} km`, "Distance parcourue"]}
                      labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    />
                    <Bar dataKey="distance" name="Distance" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Listes d'alertes et prochaines actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Maintenances à venir */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Prochaines maintenances</CardTitle>
              <Badge variant="outline" className="ml-2">{maintenancesPrevues.data?.length || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {maintenancesPrevues.status === "loading" ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !maintenancesPrevues.data || maintenancesPrevues.data.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aucune maintenance prévue
              </p>
            ) : (
              <div className="space-y-2">
                {maintenancesPrevues.data.slice(0, 5).map((maintenance) => {
                  // Extraction des valeurs avec sécurité
                  const title = maintenance.titre || "Maintenance programmée";
                  const entiteType = maintenance.estMoteur ? "Moteur" : "Moto";
                  const criticite = maintenance.criticite || "MOYENNE";
                  
                  return (
                    <div key={maintenance.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-1">
                        <p className="font-medium">{title}</p>
                        <p className="text-xs text-muted-foreground">
                          {entiteType}: {maintenance.entiteId}
                          {maintenance.kilometragePrevu && ` (${maintenance.kilometragePrevu} km)`}
                        </p>
                      </div>
                      <Badge variant={
                        criticite === "CRITIQUE" ? "destructive" : 
                        criticite === "ELEVEE" ? "destructive" : 
                        criticite === "MOYENNE" ? "default" : 
                        "outline"
                      }>
                        {new Date(maintenance.dateEstimee).toLocaleDateString()}
                      </Badge>
                    </div>
                  );
                })}
                {maintenancesPrevues.data.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/dashboard/maintenance">
                      Voir toutes les maintenances
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertes stock */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Alertes stock</CardTitle>
              <Badge variant="outline" className="ml-2">{piecesStockBas.data?.length || 0}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {piecesStockBas.status === "loading" ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : !piecesStockBas.data || piecesStockBas.data.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aucune alerte de stock
              </p>
            ) : (
              <div className="space-y-2">
                {piecesStockBas.data.slice(0, 5).map((piece) => (
                  <div key={piece.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-1">
                      <p className="font-medium">{piece.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        Réf: {piece.reference}
                      </p>
                    </div>
                    <Badge variant={piece.quantiteStock === 0 ? "destructive" : "default"}>
                      {piece.quantiteStock} / {piece.quantiteMinimale}
                    </Badge>
                  </div>
                ))}
                {piecesStockBas.data.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="/dashboard/pieces">
                      Voir tout le stock
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Actions rapides</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <Card className="hover:bg-muted/50">
            <Link href="/dashboard/motos/nouvelle" className="block h-full">
              <CardHeader>
                <CardTitle className="text-base">Ajouter une moto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Enregistrer une nouvelle moto dans le parc
                </p>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:bg-muted/50">
            <Link href="/dashboard/maintenance/nouvelle" className="block h-full">
              <CardHeader>
                <CardTitle className="text-base">Créer maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Planifier ou enregistrer une maintenance
                </p>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:bg-muted/50">
            <Link href="/dashboard/controles/nouveau" className="block h-full">
              <CardHeader>
                <CardTitle className="text-base">Contrôle journalier</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Effectuer un contrôle technique journalier
                </p>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:bg-muted/50">
            <Link href="/dashboard/utilisations/nouvelle" className="block h-full">
              <CardHeader>
                <CardTitle className="text-base">Session circuit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Enregistrer une utilisation sur circuit
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}