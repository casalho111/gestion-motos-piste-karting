'use client';

import { useState } from 'react';
import { useMaintenanceDetails } from '@/store/hooks';
import { TypeEntretien, EtatEntite } from '@prisma/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Maintenance, ServerActionResponse } from '@/store/types';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, 
  Check, 
  Clock, 
  FileText, 
  RotateCcw, 
  Wrench,
  ArrowRight,
  Receipt,
  PenLine,
  AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

// Types des entités liées
interface PieceDetail {
  id: string;
  reference: string;
  nom: string;
  type: string;
  quantiteStock: number;
  quantiteMinimale: number;
}

interface PieceUtiliseeDetail {
  id: string;
  pieceId: string;
  quantite: number;
  prixUnitaire: number;
  piece: PieceDetail;
}

// Cette interface étend le type Maintenance de store/types
// et ajoute les propriétés spécifiques nécessaires pour l'affichage détaillé
interface MaintenanceDetail extends Maintenance {
  cycle?: {
    id: string;
    numSerie: string;
    modele: string;
    etat: EtatEntite;
  } | null;
  moteur?: {
    id: string;
    numSerie: string;
    type: string;
    etat: EtatEntite;
  } | null;
  piecesUtilisees: PieceUtiliseeDetail[];
}

interface MaintenanceDetailViewProps {
  maintenanceId: string;
}

const MaintenanceDetailView = ({ maintenanceId }: MaintenanceDetailViewProps) => {
  const { maintenance, isLoading, isFinalizing, error, finaliser, refetch } = useMaintenanceDetails(maintenanceId);
  const [finalizationNotes, setFinalizationNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  // Déterminer si la maintenance est finalisée (entités plus en état de maintenance)
  const isFinalized = () => {
    if (!maintenance) return false;
    
    // Cast maintenance to MaintenanceDetail to access cycle and moteur properties with type checks
    const maintenanceDetail = maintenance as unknown as MaintenanceDetail;
    
    const cycleFinalized = !maintenanceDetail.cycle || maintenanceDetail.cycle.etat !== 'EN_MAINTENANCE';
    const moteurFinalized = !maintenanceDetail.moteur || maintenanceDetail.moteur.etat !== 'EN_MAINTENANCE';
    
    return cycleFinalized && moteurFinalized;
  };

  // Gestion de la finalisation de maintenance
  const handleFinaliserMaintenance = async () => {
    try {
      const result = await finaliser(finalizationNotes || undefined);
      
      if (result.success) {
        toast.success("Maintenance finalisée", {
          description: "La maintenance a été correctement finalisée",
        });
        setDialogOpen(false);
        refetch();
      } else {
        toast.error("Erreur", {
          description: result.error || "Une erreur est survenue lors de la finalisation",
        });
      }
    } catch (error) {
      toast.error("Erreur", {
        description: "Une erreur inattendue est survenue",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !maintenance) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle size={20} />
            Erreur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error || "Impossible de charger les détails de la maintenance"}</p>
          <Button onClick={() => refetch()} className="mt-4" variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Vérifier si la maintenance est finalisée
  const maintenanceFinalized = isFinalized();

  // Cast to the detailed type for accessing the properties
  const maintenanceDetail = maintenance as unknown as MaintenanceDetail;

  // Préparer les données pour le graphique de coûts
  const piecesCout = maintenanceDetail.piecesUtilisees?.reduce((sum, pu) => 
    sum + (pu.quantite * pu.prixUnitaire), 0) || 0;
  const mainDoeuvre = maintenanceDetail.coutTotal - piecesCout;
  
  const coutData = [
    { name: 'Pièces', value: piecesCout },
    { name: 'Main d\'œuvre', value: mainDoeuvre },
  ].filter(item => item.value > 0);

  const COLORS = ['#0088FE', '#00C49F'];

  // Fonction pour formatter le type d'entretien
  const formatEntretienType = (type: TypeEntretien) => {
    switch(type) {
      case 'ENTRETIEN_REGULIER': return 'Entretien régulier';
      case 'REPARATION': return 'Réparation';
      case 'REVISION_MOTEUR': return 'Révision moteur';
      case 'VIDANGE': return 'Vidange';
      case 'FREINS': return 'Freins';
      case 'PNEUS': return 'Pneus';
      case 'TRANSMISSION': return 'Transmission';
      case 'AUTRES': return 'Autres';
      default: return type;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Maintenance #{maintenanceDetail.id.slice(-5)}</h1>
          <p className="text-muted-foreground">{formatEntretienType(maintenanceDetail.type)} du {format(new Date(maintenanceDetail.dateRealisation), 'dd MMMM yyyy', { locale: fr })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {maintenanceFinalized ? (
            <Badge variant="default" className="bg-green-600">
              <Check className="h-4 w-4 mr-1" /> Finalisée
            </Badge>
          ) : (
            <Badge variant="outline">En cours</Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={() => window.print()}
          >
            <FileText className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="md:col-span-2 space-y-6">
          {/* Entities Card */}
          <Card>
            <CardHeader>
              <CardTitle>Entités concernées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {maintenanceDetail.cycle && (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Partie cycle</h3>
                    <p>{maintenanceDetail.cycle.numSerie} - {maintenanceDetail.cycle.modele}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/dashboard/motos/${maintenanceDetail.cycle?.id}`)}
                  >
                    Voir détails
                  </Button>
                </div>
              )}
              
              {maintenanceDetail.cycle && maintenanceDetail.moteur && <Separator />}
              
              {maintenanceDetail.moteur && (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Moteur</h3>
                    <p>{maintenanceDetail.moteur.numSerie} - {maintenanceDetail.moteur.type}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/dashboard/moteurs/${maintenanceDetail.moteur?.id}`)}
                  >
                    Voir détails
                  </Button>
                </div>
              )}
              
              {!maintenanceDetail.cycle && !maintenanceDetail.moteur && (
                <p className="text-muted-foreground">Aucune entité associée</p>
              )}
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{maintenanceDetail.description}</p>
              
              {maintenanceDetail.notes && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h3 className="font-medium mb-2">Notes additionnelles</h3>
                    <p className="text-muted-foreground whitespace-pre-line">{maintenanceDetail.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pièces utilisées Card */}
          <Card>
            <CardHeader>
              <CardTitle>Pièces utilisées</CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceDetail.piecesUtilisees && maintenanceDetail.piecesUtilisees.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left">Référence</th>
                        <th className="px-4 py-2 text-left">Nom</th>
                        <th className="px-4 py-2 text-right">Prix unitaire</th>
                        <th className="px-4 py-2 text-right">Quantité</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenanceDetail.piecesUtilisees.map((pieceUtilisee) => (
                        <tr key={pieceUtilisee.id} className="border-b">
                          <td className="px-4 py-2 text-left">{pieceUtilisee.piece.reference}</td>
                          <td className="px-4 py-2 text-left">{pieceUtilisee.piece.nom}</td>
                          <td className="px-4 py-2 text-right">{pieceUtilisee.prixUnitaire.toFixed(2)} €</td>
                          <td className="px-4 py-2 text-right">{pieceUtilisee.quantite}</td>
                          <td className="px-4 py-2 text-right font-medium">
                            {(pieceUtilisee.prixUnitaire * pieceUtilisee.quantite).toFixed(2)} €
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/50">
                        <td colSpan={4} className="px-4 py-2 text-right font-bold">Total pièces</td>
                        <td className="px-4 py-2 text-right font-bold">{piecesCout.toFixed(2)} €</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">Aucune pièce utilisée</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Date de réalisation</p>
                <p className="font-medium">
                  {format(new Date(maintenanceDetail.dateRealisation), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Type d'entretien</p>
                <p className="font-medium">{formatEntretienType(maintenanceDetail.type)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Technicien</p>
                <p className="font-medium">{maintenanceDetail.technicien}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Kilométrage effectué à</p>
                <p className="font-medium">{maintenanceDetail.kilometrageEffectue.toFixed(1)} km</p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm text-muted-foreground">Coût total</p>
                <p className="text-xl font-bold">{maintenanceDetail.coutTotal.toFixed(2)} €</p>
              </div>
            </CardContent>
          </Card>

          {/* Coût breakdown Card */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition des coûts</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {coutData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={coutData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {coutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => typeof value === 'number' ? `${value.toFixed(2)} €` : `${value} €`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-center">
                    Données insuffisantes pour afficher le graphique
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t">
              <div className="w-full space-y-1 pt-2">
                <div className="flex justify-between items-center">
                  <p>Pièces</p>
                  <p className="font-medium">{piecesCout.toFixed(2)} €</p>
                </div>
                <div className="flex justify-between items-center">
                  <p>Main d'œuvre</p>
                  <p className="font-medium">{mainDoeuvre.toFixed(2)} €</p>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <p className="font-bold">Total</p>
                  <p className="font-bold">{maintenanceDetail.coutTotal.toFixed(2)} €</p>
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!maintenanceFinalized ? (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="default" 
                      className="w-full"
                      disabled={isFinalizing}
                    >
                      {isFinalizing ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Finaliser la maintenance
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Finaliser la maintenance</DialogTitle>
                      <DialogDescription>
                        La finalisation de la maintenance rendra à nouveau les entités concernées disponibles.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes additionnelles (optionnelles)</Label>
                        <Textarea
                          id="notes"
                          value={finalizationNotes}
                          onChange={(e) => setFinalizationNotes(e.target.value)}
                          placeholder="Ajoutez des notes additionnelles ici..."
                          rows={4}
                        />
                      </div>
                      
                      <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200 dark:border-amber-900">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-amber-900 dark:text-amber-200">Attention</p>
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                              Cette action ne peut pas être annulée. Les entités liées à cette maintenance (moto et/ou moteur) passeront à l'état "Disponible".
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        disabled={isFinalizing}
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={handleFinaliserMaintenance}
                        disabled={isFinalizing}
                      >
                        {isFinalizing ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : null}
                        Confirmer la finalisation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="flex items-center justify-center p-2 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <p className="text-green-800 dark:text-green-300">Maintenance finalisée</p>
                  </div>
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push('/dashboard/maintenances')}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Retour à la liste
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDetailView;