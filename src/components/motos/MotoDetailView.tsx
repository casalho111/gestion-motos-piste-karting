'use client';

import { useState } from 'react';
import { useMotoDetails } from '@/store/hooks';
import { Moto } from '@/store/types';
import { EtatEntite } from '@prisma/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, 
  Check, 
  Clock, 
  FileCog, 
  RotateCcw, 
  Settings,  
  Truck, 
  AlertTriangle
} from 'lucide-react';
import { FaTools } from "react-icons/fa";
import KilometrageDisplay from '@/components/shared/KilometrageDisplay';
import MoteurBadge from '@/components/moteurs/MoteurBadge';
import SessionsList from '@/components/utilisations/SessionsList';
import MaintenancesList from '@/components/maintenances/MaintenancesList';
import ControlesList from '@/components/controles/ControlesList';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

interface MotoDetailViewProps {
  motoId: string;
}

const MotoDetailView = ({ motoId }: MotoDetailViewProps) => {
  const { moto, isLoading, error, refetch, changeStatus } = useMotoDetails(motoId);
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

  if (error || !moto) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle size={20} />
            Erreur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error || "Impossible de charger les détails de la moto"}</p>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Préparer les données pour les graphiques
  const utilisationsData = moto.utilisations?.slice(0, 20).map(u => ({
    date: format(new Date(u.date), 'dd/MM/yy'),
    tours: u.nbTours,
    distance: parseFloat(u.distanceTotale.toFixed(1))
  })).reverse() || [];

  const maintenancesData = moto.maintenances?.map(m => ({
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
          description: `L'état de la moto a été modifié avec succès.`,
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

  // Récupérer le dernier contrôle journalier
  const dernierControle = moto.controles && moto.controles.length > 0 
    ? moto.controles[0] 
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{moto.numSerie}</h1>
          <p className="text-muted-foreground">{moto.modele}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={moto.etat} />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push(`/dashboard/motos/${motoId}/edit`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('entretien')}>
            < FaTools className="h-4 w-4 mr-2" />
            Entretien
          </Button>
        </div>
      </div>

      {/* Status note if present */}
      {moto.notesEtat && (
        <div className="bg-muted p-3 rounded-md border flex items-start gap-2">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
          <p className="text-sm">{moto.notesEtat}</p>
        </div>
      )}

      {/* Tabs content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="entretien">Entretien</TabsTrigger>
          <TabsTrigger value="utilisation">Utilisation</TabsTrigger>
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
                    <p className="text-sm text-muted-foreground">Modèle</p>
                    <p className="font-medium">{moto.modele}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Numéro de série</p>
                    <p className="font-medium">{moto.numSerie}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date d'acquisition</p>
                    <p className="font-medium">
                      {format(new Date(moto.dateAcquisition), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Couleur</p>
                    <p className="font-medium">{moto.couleur || "Non spécifiée"}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-semibold">Kilométrage</h3>
                  <KilometrageDisplay 
                    kilometrage={moto.kilometrage} 
                    isCycle={true}
                    className="py-2"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-semibold">Dernier contrôle journalier</h3>
                  {dernierControle ? (
                    <div className="flex items-start gap-2">
                      {dernierControle.estConforme ? (
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p>
                          {dernierControle.estConforme 
                            ? "Contrôle conforme" 
                            : "Contrôle non conforme"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Le {format(new Date(dernierControle.date), 'dd/MM/yyyy')} par {dernierControle.controleur}
                        </p>
                        {dernierControle.commentaires && (
                          <p className="text-sm mt-1">{dernierControle.commentaires}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun contrôle journalier enregistré</p>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => router.push(`/dashboard/controles/new?motoId=${motoId}`)}
                  >
                    <FileCog className="h-4 w-4 mr-2" />
                    Nouveau contrôle
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Moteur Card */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Moteur monté</CardTitle>
              </CardHeader>
              <CardContent className="h-full flex flex-col justify-between">
                {moto.moteurCourant ? (
                  <div className="space-y-4">
                    <MoteurBadge moteur={moto.moteurCourant} />
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Kilométrage moteur</p>
                      <KilometrageDisplay 
                        kilometrage={moto.moteurCourant.kilometrage} 
                        isCycle={false}
                        className="py-2"
                      />
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Monté depuis</p>
                      <p className="font-medium">
                        {moto.historiquesMontage && moto.historiquesMontage.length > 0 ? (
                          format(new Date(moto.historiquesMontage[0].dateDebut), 'dd MMMM yyyy', { locale: fr })
                        ) : (
                          "Date inconnue"
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <Truck className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Aucun moteur monté</p>
                  </div>
                )}
                
                <div className="mt-6 space-y-2">
                  {moto.moteurCourant ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => router.push(`/dashboard/moteurs/${moto.moteurCourant!.id}`)}
                      >
                        Voir détails
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => router.push(`/dashboard/moteurs/demontage?cycleId=${motoId}`)}
                      >
                        Démonter le moteur
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full"
                      onClick={() => router.push(`/dashboard/moteurs/montage?cycleId=${motoId}`)}
                    >
                      Monter un moteur
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
              value={moto.maintenances?.length.toString() || "0"}
              iconColor="text-blue-500 bg-blue-100 dark:bg-blue-950"
              icon={<FaTools className="h-5 w-5" />}
              onClick={() => setActiveTab('entretien')}
            />
            <StatCard
              title="Sessions d'utilisation"
              value={moto.utilisations?.length.toString() || "0"}
              iconColor="text-green-500 bg-green-100 dark:bg-green-950"
              icon={<Clock className="h-5 w-5" />}
              onClick={() => setActiveTab('utilisation')}
            />
            <StatCard
              title="Jours depuis acquisition"
              value={Math.floor((new Date().getTime() - new Date(moto.dateAcquisition).getTime()) / (1000 * 60 * 60 * 24)).toString()}
              iconColor="text-purple-500 bg-purple-100 dark:bg-purple-950"
              icon={<Truck className="h-5 w-5" />}
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
                  onClick={() => router.push(`/dashboard/maintenances/new?cycleId=${motoId}`)}
                >
                  < FaTools className="h-4 w-4 mr-2" />
                  Nouvel entretien
                </Button>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Changer l'état de la moto</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={moto.etat === 'DISPONIBLE' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleStatusChange(EtatEntite.DISPONIBLE)}
                      disabled={statusChangeLoading}
                    >
                      Disponible
                    </Button>
                    <Button 
                      variant={moto.etat === 'EN_MAINTENANCE' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleStatusChange(EtatEntite.EN_MAINTENANCE)}
                      disabled={statusChangeLoading}
                    >
                      En maintenance
                    </Button>
                    <Button 
                      variant={moto.etat === 'A_VERIFIER' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleStatusChange(EtatEntite.A_VERIFIER)}
                      disabled={statusChangeLoading}
                    >
                      À vérifier
                    </Button>
                    <Button 
                      variant={moto.etat === 'HORS_SERVICE' ? 'default' : 'outline'} 
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
                maintenances={moto.maintenances || []} 
                hideEntityName
              />
            </CardContent>
            <CardFooter className="border-t pt-4 pb-2">
              <Button 
                variant="link" 
                size="sm" 
                className="ml-auto"
                onClick={() => router.push('/dashboard/maintenances?cycleId=' + motoId)}
              >
                Voir tout l'historique
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Utilisation tab */}
        <TabsContent value="utilisation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sessions d'utilisation</CardTitle>
                <CardDescription>Enregistrer et suivre les utilisations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="default"
                  onClick={() => router.push(`/dashboard/utilisations/new?cycleId=${motoId}`)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Nouvelle session
                </Button>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Statistiques d'utilisation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-xs text-muted-foreground">Total des sessions</p>
                      <p className="text-xl font-bold">{moto.utilisations?.length || 0}</p>
                    </div>
                    <div className="bg-muted rounded-md p-3">
                      <p className="text-xs text-muted-foreground">Kilométrage total</p>
                      <p className="text-xl font-bold">{moto.kilometrage.toFixed(1)} km</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilisation récente</CardTitle>
                <CardDescription>Évolution de l'utilisation</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                {utilisationsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={utilisationsData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="tours" 
                        stroke="#8884d8" 
                        name="Tours"
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="distance" 
                        stroke="#82ca9d" 
                        name="Distance (km)" 
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
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sessions récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionsList 
                sessions={moto.utilisations || []} 
                hideEntityName
              />
            </CardContent>
            <CardFooter className="border-t pt-4 pb-2">
              <Button 
                variant="link" 
                size="sm" 
                className="ml-auto"
                onClick={() => router.push('/dashboard/utilisations?cycleId=' + motoId)}
              >
                Voir toutes les sessions
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Historique tab */}
        <TabsContent value="historique" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Contrôles journaliers</CardTitle>
              </CardHeader>
              <CardContent>
                <ControlesList 
                  controles={moto.controles || []} 
                  hideEntityName
                />
              </CardContent>
              <CardFooter className="border-t pt-4 pb-2">
                <Button 
                  variant="link" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => router.push('/dashboard/controles?cycleId=' + motoId)}
                >
                  Voir tous les contrôles
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historique de montage moteur</CardTitle>
              </CardHeader>
              <CardContent>
                {moto.historiquesMontage && moto.historiquesMontage.length > 0 ? (
                  <div className="space-y-3">
                    {moto.historiquesMontage.map((historique) => (
                      <div key={historique.id} className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{historique.moteur.numSerie}</p>
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
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Aucun historique de montage disponible</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
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

export default MotoDetailView;