// Types des entités liées
interface HistoriqueMontage {
    id: string;
    dateDebut: Date;
    dateFin?: Date | null;
    kilometrageDebutCycle: number;
    kilometrageDebutMoteur: number;
    kilometrageFinCycle?: number | null;
    kilometrageFinMoteur?: number | null;
    technicien: string;
    notes?: string | null;
    cycleId: string;
    moteurId: string;
    cycle?: {
      id: string;
      numSerie: string;
      modele: string;
    };
  }
  
  interface MaintenanceDetail {
    id: string;
    type: TypeEntretien; // Modifier ici
    dateRealisation: Date;
    kilometrageEffectue: number;
    coutTotal: number;
    technicien: string;
    description: string;
    notes?: string | null;
    cycleId?: string | null;
    moteurId?: string | null;
    piecesUtilisees: any[];
  }
  
  // Cette interface étend le type MotoMoteur pour l'affichage détaillé
  interface MoteurDetail extends MotoMoteur {
    cycleActuel?: {
      id: string;
      numSerie: string;
      modele: string;
      etat: EtatEntite;
    } | null;
    maintenances?: MaintenanceDetail[];
    historiquesMontage?: HistoriqueMontage[];
  }'use client';
  
  import { useState } from 'react';
  import { useMoteurDetails } from '@/store/hooks';
  import { EtatEntite, TypeEntretien } from '@prisma/client';
  import { format } from 'date-fns';
  import { fr } from 'date-fns/locale';
  import { MotoMoteur, ServerActionResponse } from '@/store/types';
  
  // UI Components
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
  import { Badge } from '@/components/ui/badge';
  import { Button } from '@/components/ui/button';
  import { Separator } from '@/components/ui/separator';
  import { 
    AlertCircle, 
    Cog, 
    RotateCcw, 
    Settings, 
    Link,
    History,
    Activity
  } from 'lucide-react';
  import { FaTools } from "react-icons/fa";
  import { LiaMotorcycleSolid } from "react-icons/lia";
  import KilometrageDisplay from '@/components/shared/KilometrageDisplay';
  import MaintenancesList from '@/components/maintenances/MaintenancesList';
  import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
  import LoadingSpinner from '@/components/ui/loading-spinner';
  import { useRouter } from 'next/navigation';
  import { toast } from "sonner";
  
  interface MoteurDetailViewProps {
    moteurId: string;
  }
  
  const MoteurDetailView = ({ moteurId }: MoteurDetailViewProps) => {
    const { moteur, isLoading, error, refetch, changeStatus } = useMoteurDetails(moteurId);
    const [activeTab, setActiveTab] = useState('details');
    const [statusChangeLoading, setStatusChangeLoading] = useState(false);
    const router = useRouter();
   
  
    if (isLoading) {
      return (
        <div className="flex h-48 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      );
    }
  
    if (error || !moteur) {
      return (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle size={20} />
              Erreur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || "Impossible de charger les détails du moteur"}</p>
            <Button onClick={() => refetch()} className="mt-4" variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      );
    }
  
    // Cast to the detailed type for accessing the properties
    const moteurDetail = moteur as unknown as MoteurDetail;
  
    // Préparer les données pour les graphiques
    const maintenancesData = moteurDetail.maintenances?.map(m => ({
      date: format(new Date(m.dateRealisation), 'dd/MM/yy'),
      cout: m.coutTotal,
      type: m.type
    })).reverse() || [];
  
  // Gestion du changement d'état
    const handleStatusChange = async (newStatus: EtatEntite) => {
      setStatusChangeLoading(true);
      try {
        const result = await changeStatus(newStatus);
        if (result.success) {
          toast.success("État modifié", {
            description: `L'état du moteur a été modifié avec succès.`,
          });
        } else {
          toast.error("Erreur", {
            description: result.error || "Une erreur est survenue",
          });
        }
      } finally {
        setStatusChangeLoading(false);
      }
    };
  
    // Fonction pour préparer les données d'évolution du kilométrage
    const prepareKilometrageData = (historiquesMontage: HistoriqueMontage[], kilometrageActuel: number) => {
      if (!historiquesMontage || historiquesMontage.length === 0) return [];
      
      const dataPoints = [];
      let kmCumul = 0;
      
      // Point de départ (acquisition)
      const startDate = new Date(historiquesMontage[historiquesMontage.length - 1].dateDebut);
      startDate.setDate(startDate.getDate() - 7); // Arbitrairement 7 jours avant le premier montage
      
      dataPoints.push({
        date: format(startDate, 'dd/MM/yy'),
        kilometrage: 0
      });
      
      // Pour chaque historique de montage
      for (const historique of [...historiquesMontage].reverse()) { // Inversé pour ordre chronologique
        const dateDebut = new Date(historique.dateDebut);
        
        // Kilométrage au début du montage
        dataPoints.push({
          date: format(dateDebut, 'dd/MM/yy'),
          kilometrage: kmCumul + historique.kilometrageDebutMoteur
        });
        
        // Si le montage est terminé
        if (historique.dateFin && historique.kilometrageFinMoteur) {
          const dateFin = new Date(historique.dateFin);
          const kmPendantMontage = historique.kilometrageFinMoteur - historique.kilometrageDebutMoteur;
          kmCumul += kmPendantMontage;
          
          dataPoints.push({
            date: format(dateFin, 'dd/MM/yy'),
            kilometrage: kmCumul
          });
        } 
        // Si c'est le montage actuel
        else if (!historique.dateFin) {
          const now = new Date();
          dataPoints.push({
            date: format(now, 'dd/MM/yy'),
            kilometrage: kilometrageActuel
          });
        }
      }
      
      return dataPoints;
    };
  
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{moteurDetail.numSerie}</h1>
            <p className="text-muted-foreground">{moteurDetail.type} - {moteurDetail.cylindree} cc</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={moteurDetail.etat} />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push(`/dashboard/moteurs/${moteurId}/edit`)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('entretien')}>
              <FaTools className="h-4 w-4 mr-2" />
              Entretien
            </Button>
          </div>
        </div>
  
        {/* Status note if present */}
        {moteurDetail.notesEtat && (
          <div className="bg-muted p-3 rounded-md border flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
            <p className="text-sm">{moteurDetail.notesEtat}</p>
          </div>
        )}
  
        {/* Tabs content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="entretien">Entretien</TabsTrigger>
            <TabsTrigger value="historique">Historique</TabsTrigger>
          </TabsList>
  
          {/* Détails tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Info Card */}
              <Card className="md:col-span-2 h-full">
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{moteurDetail.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Numéro de série</p>
                      <p className="font-medium">{moteurDetail.numSerie}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date d'acquisition</p>
                      <p className="font-medium">
                        {format(new Date(moteurDetail.dateAcquisition), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cylindrée</p>
                      <p className="font-medium">{moteurDetail.cylindree} cc</p>
                    </div>
                  </div>
  
                  <Separator />
  
                  <div className="space-y-2">
                    <h3 className="font-semibold">Kilométrage</h3>
                    <KilometrageDisplay 
                      kilometrage={moteurDetail.kilometrage} 
                      isCycle={false}
                      className="py-2"
                    />
                  </div>
  
                  {moteurDetail.heuresMoteur && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground">Heures moteur</p>
                        <p className="font-medium">{moteurDetail.heuresMoteur} h</p>
                      </div>
                    </>
                  )}
  
                  <Separator />
  
                  <div className="space-y-2">
                    <h3 className="font-semibold">Dernière maintenance</h3>
                    {moteurDetail.maintenances && moteurDetail.maintenances.length > 0 ? (
                      <div>
                        <p className="font-medium">
                          {format(new Date(moteurDetail.maintenances[0].dateRealisation), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {moteurDetail.maintenances[0].type} - {moteurDetail.maintenances[0].description}
                        </p>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto text-sm"
                          onClick={() => router.push(`/dashboard/maintenances/${moteurDetail.maintenances?.[0]?.id}`)}
                        >
                          Voir les détails
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucune maintenance enregistrée</p>
                    )}
                  </div>
                </CardContent>
              </Card>
  
              {/* Statut Card */}
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Statut</CardTitle>
                </CardHeader>
                <CardContent className="h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">État actuel</p>
                      <div className="mt-1">
                        <StatusBadge status={moteurDetail.etat} />
                      </div>
                    </div>
  
                    <div>
                      <p className="text-sm text-muted-foreground">Monté sur</p>
                      {moteurDetail.cycleActuel ? (
                        <div className="mt-1 space-y-1">
                          <p className="font-medium">{moteurDetail.cycleActuel.numSerie}</p>
                          <p className="text-sm">{moteurDetail.cycleActuel.modele}</p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto text-sm"
                            onClick={() => moteurDetail.cycleActuel && router.push(`/dashboard/motos/${moteurDetail.cycleActuel.id}`)}
                          >
                            Voir détails de la moto
                          </Button>
                        </div>
                      ) : (
                        <p className="font-medium mt-1">Non monté</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-2">
                    {!moteurDetail.cycleActuel ? (
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full"
                        onClick={() => router.push(`/dashboard/moteurs/montage?moteurId=${moteurId}`)}
                      >
                        Monter sur une moto
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => moteurDetail.cycleActuel && router.push(`/dashboard/moteurs/demontage?cycleId=${moteurDetail.cycleActuel.id}`)}
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Démonter
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
  
            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Maintenances"
                value={moteurDetail.maintenances?.length.toString() || "0"}
                iconColor="text-blue-500 bg-blue-100 dark:bg-blue-950"
                icon={<FaTools className="h-5 w-5" />}
                onClick={() => setActiveTab('entretien')}
              />
              <StatCard
                title="Montages"
                value={moteurDetail.historiquesMontage?.length.toString() || "0"}
                iconColor="text-green-500 bg-green-100 dark:bg-green-950"
                icon={<Link className="h-5 w-5" />}
                onClick={() => setActiveTab('historique')}
              />
              <StatCard
                title="Jours depuis acquisition"
                value={Math.floor((new Date().getTime() - new Date(moteurDetail.dateAcquisition).getTime()) / (1000 * 60 * 60 * 24)).toString()}
                iconColor="text-purple-500 bg-purple-100 dark:bg-purple-950"
                icon={<LiaMotorcycleSolid className="h-5 w-5" />}
              />
            </div>
          </TabsContent>
  
          {/* Entretien tab */}
          <TabsContent value="entretien" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance</CardTitle>
                  <CardDescription>Historique et planification des entretiens</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="default"
                    onClick={() => router.push(`/dashboard/maintenances/new?moteurId=${moteurId}`)}
                  >
                    <FaTools className="h-4 w-4 mr-2" />
                    Nouvel entretien
                  </Button>
  
                  <Separator />
  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Changer l'état du moteur</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant={moteurDetail.etat === 'DISPONIBLE' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleStatusChange(EtatEntite.DISPONIBLE)}
                        disabled={statusChangeLoading}
                      >
                        Disponible
                      </Button>
                      <Button 
                        variant={moteurDetail.etat === 'EN_MAINTENANCE' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleStatusChange(EtatEntite.EN_MAINTENANCE)}
                        disabled={statusChangeLoading}
                      >
                        En maintenance
                      </Button>
                      <Button 
                        variant={moteurDetail.etat === 'A_VERIFIER' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleStatusChange(EtatEntite.A_VERIFIER)}
                        disabled={statusChangeLoading}
                      >
                        À vérifier
                      </Button>
                      <Button 
                        variant={moteurDetail.etat === 'HORS_SERVICE' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleStatusChange(EtatEntite.HORS_SERVICE)}
                        disabled={statusChangeLoading}
                      >
                        Hors service
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
  
              <Card>
                <CardHeader>
                  <CardTitle>Coûts de maintenance</CardTitle>
                  <CardDescription>Aperçu des coûts d'entretien</CardDescription>
                </CardHeader>
                <CardContent className="h-64">
                  {maintenancesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={maintenancesData}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [`${value} €`, 'Coût']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Bar dataKey="cout" fill="#8884d8" name="Coût (€)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground text-center">
                        Aucune donnée de maintenance disponible
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
  
            <Card>
              <CardHeader>
                <CardTitle>Historique des maintenances</CardTitle>
              </CardHeader>
              <CardContent>
                <MaintenancesList 
                  maintenances={moteurDetail.maintenances || []} 
                  hideEntityName
                />
              </CardContent>
              <CardFooter className="border-t pt-4 pb-2">
                <Button 
                  variant="link" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => router.push('/dashboard/maintenances?moteurId=' + moteurId)}
                >
                  Voir tout l'historique
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
  
          {/* Historique tab */}
          <TabsContent value="historique" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historique de montage</CardTitle>
                <CardDescription>Motos sur lesquelles ce moteur a été monté</CardDescription>
              </CardHeader>
              <CardContent>
                {moteurDetail.historiquesMontage && moteurDetail.historiquesMontage.length > 0 ? (
                  <div className="space-y-3">
                    {moteurDetail.historiquesMontage.map((historique) => (
                      <div key={historique.id} className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{historique.cycle?.numSerie || "Moto inconnue"}</p>
                            <p className="text-sm text-muted-foreground">{historique.cycle?.modele}</p>
                          </div>
                          <Badge variant={!historique.dateFin ? "default" : "outline"}>
                            {!historique.dateFin ? "Actuel" : "Terminé"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-y-1 text-sm">
                          <div>
                            <span className="text-muted-foreground">Monté le: </span>
                            {format(new Date(historique.dateDebut), 'dd/MM/yyyy')}
                          </div>
                          {historique.dateFin && (
                            <div>
                              <span className="text-muted-foreground">Démonté le: </span>
                              {format(new Date(historique.dateFin), 'dd/MM/yyyy')}
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground">Technicien: </span>
                            {historique.technicien}
                          </div>
                          
                          {historique.kilometrageDebutCycle !== undefined && (
                            <div>
                              <span className="text-muted-foreground">Km début: </span>
                              {historique.kilometrageDebutCycle.toFixed(1)} km
                            </div>
                          )}
                          
                          {historique.kilometrageFinCycle !== null && historique.kilometrageFinCycle !== undefined && (
                            <div>
                              <span className="text-muted-foreground">Km fin: </span>
                              {historique.kilometrageFinCycle.toFixed(1)} km
                            </div>
                          )}
                          
                          {historique.notes && (
                            <div className="col-span-2 mt-1">
                              <span className="text-muted-foreground">Notes: </span>
                              {historique.notes}
                            </div>
                          )}
                        </div>
                        
                        {historique.cycle && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="mt-2 p-0 h-auto text-sm"
                            onClick={() => router.push(`/dashboard/motos/${historique.cycle?.id}`)}
                          >
                            Voir détails de la moto
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun historique de montage disponible</p>
                )}
              </CardContent>
            </Card>
  
            <Card>
              <CardHeader>
                <CardTitle>Évolution du kilométrage</CardTitle>
                <CardDescription>Basé sur l'historique d'utilisation</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                {moteurDetail.historiquesMontage && moteurDetail.historiquesMontage.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={prepareKilometrageData(moteurDetail.historiquesMontage, moteurDetail.kilometrage)}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value} km`, 'Kilométrage']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="kilometrage" 
                        stroke="#82ca9d" 
                        name="Kilométrage cumulé (km)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-center">
                      Aucune donnée d'utilisation disponible
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };
  
  // Fonction pour préparer les données d'évolution du kilométrage
  const prepareKilometrageData = (historiquesMontage: any[], kilometrageActuel: number) => {
    if (!historiquesMontage || historiquesMontage.length === 0) return [];
    
    const dataPoints = [];
    let kmCumul = 0;
    
    // Point de départ (acquisition)
    const startDate = new Date(historiquesMontage[historiquesMontage.length - 1].dateDebut);
    startDate.setDate(startDate.getDate() - 7); // Arbitrairement 7 jours avant le premier montage
    
    dataPoints.push({
      date: format(startDate, 'dd/MM/yy'),
      kilometrage: 0
    });
    
    // Pour chaque historique de montage
    for (const historique of [...historiquesMontage].reverse()) { // Inversé pour ordre chronologique
      const dateDebut = new Date(historique.dateDebut);
      
      // Kilométrage au début du montage
      dataPoints.push({
        date: format(dateDebut, 'dd/MM/yy'),
        kilometrage: kmCumul + historique.kilometrageDebutMoteur
      });
      
      // Si le montage est terminé
      if (historique.dateFin && historique.kilometrageFinMoteur) {
        const dateFin = new Date(historique.dateFin);
        const kmPendantMontage = historique.kilometrageFinMoteur - historique.kilometrageDebutMoteur;
        kmCumul += kmPendantMontage;
        
        dataPoints.push({
          date: format(dateFin, 'dd/MM/yy'),
          kilometrage: kmCumul
        });
      } 
      // Si c'est le montage actuel
      else if (!historique.dateFin) {
        const now = new Date();
        dataPoints.push({
          date: format(now, 'dd/MM/yy'),
          kilometrage: kilometrageActuel
        });
      }
    }
    
    return dataPoints;
  };
  
  // Composant Badge d'état
  const StatusBadge = ({ status }: { status: EtatEntite }) => {
    let variant: "default" | "outline" | "destructive" | "secondary" = "outline";
    let label = status;
    
    switch (status) {
      case 'DISPONIBLE':
        variant = "default";
        break;
      case 'EN_MAINTENANCE':
        variant = "secondary";
        break;
      case 'A_VERIFIER':
        variant = "secondary";
        break;
      case 'HORS_SERVICE':
        variant = "destructive";
        break;
      case 'INDISPONIBLE':
        variant = "outline";
        break;
    }
    
    return <Badge variant={variant}>{label}</Badge>;
  };
  
  // Composant Statistique
  const StatCard = ({ 
    title, 
    value, 
    icon, 
    iconColor = "text-blue-500 bg-blue-100 dark:bg-blue-950", 
    onClick 
  }: { 
    title: string; 
    value: string; 
    icon: React.ReactNode; 
    iconColor?: string;
    onClick?: () => void;
  }) => {
    return (
      <Card className={onClick ? "cursor-pointer transition-all hover:shadow-md" : ""} onClick={onClick}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
            <div className={`rounded-md p-2 ${iconColor}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  export default MoteurDetailView;