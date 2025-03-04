'use client';

import React, { useState } from 'react';
import { useMoteur } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import { EtatEntite } from '@prisma/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import { ArrowLeftIcon, AlertCircle, Settings, Tool, HistoryIcon, CheckCircle2 } from 'lucide-react';

// Formulaire pour changer l'état d'un moteur
const ChangeEtatForm = ({ 
  moteurId, 
  currentEtat, 
  onSuccess, 
  onCancel 
}: { 
  moteurId: string; 
  currentEtat: EtatEntite;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const { changeEtat } = useMoteur(moteurId);
  const [nouvelEtat, setNouvelEtat] = useState<EtatEntite>(currentEtat);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const success = await changeEtat(moteurId, nouvelEtat, notes);
      
      if (success) {
        toast.success('État du moteur mis à jour');
        onSuccess();
      } else {
        toast.error('Erreur lors de la mise à jour de l\'état');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="etat">Nouvel état</Label>
        <select
          id="etat"
          className="w-full p-2 border rounded-md"
          value={nouvelEtat}
          onChange={(e) => setNouvelEtat(e.target.value as EtatEntite)}
        >
          <option value="DISPONIBLE">Disponible</option>
          <option value="EN_MAINTENANCE">En maintenance</option>
          <option value="HORS_SERVICE">Hors service</option>
          <option value="A_VERIFIER">À vérifier</option>
          <option value="INDISPONIBLE">Indisponible</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          placeholder="Détails sur le changement d'état..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || nouvelEtat === currentEtat}
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const MoteurDetails = ({ moteurId }: { moteurId: string }) => {
  const router = useRouter();
  const { moteur, isLoading, error } = useMoteur(moteurId);
  const [changeEtatOpen, setChangeEtatOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>
          Impossible de charger les détails du moteur. {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!moteur) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Moteur non trouvé</AlertTitle>
        <AlertDescription>
          Le moteur demandé n'existe pas ou a été supprimé.
        </AlertDescription>
      </Alert>
    );
  }

  // Formatter et traduire l'état
  const getEtatBadgeColor = (etat: EtatEntite) => {
    switch (etat) {
      case 'DISPONIBLE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'EN_MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'HORS_SERVICE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'A_VERIFIER':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'INDISPONIBLE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const getEtatLabel = (etat: EtatEntite) => {
    switch (etat) {
      case 'DISPONIBLE': return 'Disponible';
      case 'EN_MAINTENANCE': return 'En maintenance';
      case 'HORS_SERVICE': return 'Hors service';
      case 'A_VERIFIER': return 'À vérifier';
      case 'INDISPONIBLE': return 'Indisponible';
      default: return etat;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton de retour et titre */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour
        </Button>
        <h2 className="text-2xl font-bold">{moteur.numSerie}</h2>
      </div>

      {/* Carte principale avec les informations du moteur */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{moteur.numSerie} - {moteur.type}</CardTitle>
              <CardDescription>Moteur {moteur.cylindree}cc</CardDescription>
            </div>
            <Badge className={getEtatBadgeColor(moteur.etat)}>
              {getEtatLabel(moteur.etat)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Kilométrage:</span>
                <span>{moteur.kilometrage.toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Heures moteur:</span>
                <span>{moteur.heuresMoteur || 0} h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Acquisition:</span>
                <span>{format(new Date(moteur.dateAcquisition), 'dd/MM/yyyy', { locale: fr })}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">État actuel:</span>
                <span>{getEtatLabel(moteur.etat)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Monté sur:</span>
                <span>{moteur.cycleActuel 
                  ? `${moteur.cycleActuel.numSerie} (${moteur.cycleActuel.modele})` 
                  : 'Non monté'}</span>
              </div>
            </div>
          </div>

          {moteur.notesEtat && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Notes:</p>
              <p className="text-sm">{moteur.notesEtat}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2 justify-end">
          <Dialog open={changeEtatOpen} onOpenChange={setChangeEtatOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Changer d'état
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Changer l'état du moteur</DialogTitle>
                <DialogDescription>
                  Modifiez l'état du moteur {moteur.numSerie}.
                </DialogDescription>
              </DialogHeader>
              <ChangeEtatForm 
                moteurId={moteur.id} 
                currentEtat={moteur.etat} 
                onSuccess={() => setChangeEtatOpen(false)}
                onCancel={() => setChangeEtatOpen(false)}
              />
            </DialogContent>
          </Dialog>

          {!moteur.cycleActuel && (
            <Button variant="default" className="gap-2">
              <Tool className="h-4 w-4" />
              Monter sur une moto
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Onglets pour les détails supplémentaires */}
      <Tabs defaultValue="historique" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="historique" className="gap-2">
            <HistoryIcon className="h-4 w-4" />
            Historique de montage
          </TabsTrigger>
          <TabsTrigger value="maintenances" className="gap-2">
            <Tool className="h-4 w-4" />
            Maintenances
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="historique" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique de montage</CardTitle>
              <CardDescription>
                Historique des montages/démontages du moteur
              </CardDescription>
            </CardHeader>
            <CardContent>
              {moteur.historiquesMontage && moteur.historiquesMontage.length > 0 ? (
                <div className="space-y-4">
                  {moteur.historiquesMontage.map((historique, index) => (
                    <div key={historique.id} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between">
                        <div>
                          <span className="font-medium">
                            {historique.cycle?.numSerie} ({historique.cycle?.modele})
                          </span>
                          <div className="text-sm text-muted-foreground">
                            Du {format(new Date(historique.dateDebut), 'dd/MM/yyyy', { locale: fr })}
                            {historique.dateFin ? ` au ${format(new Date(historique.dateFin), 'dd/MM/yyyy', { locale: fr })}` : ' à aujourd\'hui'}
                          </div>
                          <div className="text-sm mt-1">
                            <span className="font-medium">Technicien:</span> {historique.technicien}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            <span className="font-medium">Kilométrage:</span> 
                            <span className="ml-1">{historique.kilometrageDebutMoteur.toFixed(1)} km</span>
                            {historique.kilometrageFinMoteur && 
                              <span> → {historique.kilometrageFinMoteur.toFixed(1)} km</span>
                            }
                          </div>
                          {historique.notes && (
                            <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                              {historique.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Aucun historique de montage disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenances" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenances</CardTitle>
              <CardDescription>
                Historique des maintenances effectuées sur ce moteur
              </CardDescription>
            </CardHeader>
            <CardContent>
              {moteur.maintenances && moteur.maintenances.length > 0 ? (
                <div className="space-y-4">
                  {moteur.maintenances.map((maintenance) => (
                    <div key={maintenance.id} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium">
                            {maintenance.type}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Le {format(new Date(maintenance.dateRealisation), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                          <div className="text-sm mt-1">
                            <span className="font-medium">Technicien:</span> {maintenance.technicien}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            <span className="font-medium">Coût:</span> 
                            <span className="ml-1">{maintenance.coutTotal.toFixed(2)} €</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Kilométrage:</span> 
                            <span className="ml-1">{maintenance.kilometrageEffectue.toFixed(1)} km</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm mt-2">
                        {maintenance.description}
                      </div>
                      
                      {maintenance.notes && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {maintenance.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Aucune maintenance enregistrée pour ce moteur
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MoteurDetails;