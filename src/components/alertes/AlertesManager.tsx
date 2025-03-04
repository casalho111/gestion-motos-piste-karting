'use client';

import React, { useState } from 'react';
import { useAlertes } from '@/store/hooks';
import { Criticite } from '@prisma/client';
import { format, formatDistance } from 'date-fns';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  RefreshCw,
  Search, 
  Bell, 
  ShieldAlert, 
  ShieldCheck,
  Info
} from 'lucide-react';

// Formulaire pour traiter une alerte
const TraiterAlerteForm = ({ 
  alerteId, 
  onSuccess, 
  onCancel 
}: { 
  alerteId: string; 
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const { traiterAlerte } = useAlertes();
  const [utilisateur, setUtilisateur] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!utilisateur.trim()) {
      toast.error('Veuillez indiquer votre nom');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const success = await traiterAlerte(alerteId, utilisateur);
      
      if (success) {
        toast.success('Alerte marquée comme traitée');
        onSuccess();
      } else {
        toast.error('Erreur lors du traitement de l\'alerte');
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
        <Label htmlFor="utilisateur">Votre nom</Label>
        <Input
          id="utilisateur"
          placeholder="Entrez votre nom"
          value={utilisateur}
          onChange={(e) => setUtilisateur(e.target.value)}
          required
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
          disabled={isSubmitting || !utilisateur.trim()}
        >
          {isSubmitting ? 'Traitement...' : 'Marquer comme traitée'}
        </Button>
      </DialogFooter>
    </form>
  );
};

// Récupérer la classe CSS de couleur en fonction de la criticité
const getCriticiteClass = (criticite: Criticite) => {
  switch (criticite) {
    case 'CRITIQUE':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'ELEVEE':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case 'MOYENNE':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'FAIBLE':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

// Récupérer l'icône en fonction du type d'alerte
const getAlerteIcon = (type: string) => {
  switch (type) {
    case 'MAINTENANCE':
      return <Clock className="h-4 w-4" />;
    case 'STOCK':
      return <ShieldAlert className="h-4 w-4" />;
    case 'INCIDENT':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

// Traduction des types d'alerte
const getTypeLabel = (type: string) => {
  switch (type) {
    case 'MAINTENANCE':
      return 'Maintenance';
    case 'STOCK':
      return 'Stock';
    case 'INCIDENT':
      return 'Incident';
    default:
      return type;
  }
};

// Traduction des criticités
const getCriticiteLabel = (criticite: Criticite) => {
  switch (criticite) {
    case 'CRITIQUE':
      return 'Critique';
    case 'ELEVEE':
      return 'Élevée';
    case 'MOYENNE':
      return 'Moyenne';
    case 'FAIBLE':
      return 'Faible';
    default:
      return criticite;
  }
};

const AlertesManager = () => {
  const {
    alertes,
    isLoading,
    error,
    pagination,
    filters,
    nombreAlertesNonTraitees,
    fetchAlertes,
    setFilters,
    resetFilters,
    genererAlertes
  } = useAlertes();
  
  const [selectedAlerteId, setSelectedAlerteId] = useState<string | null>(null);
  const [traiterDialogOpen, setTraiterDialogOpen] = useState(false);
  const [genererLoading, setGenererLoading] = useState(false);
  
  // Gérer la recherche
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };
  
  // Gérer le filtre par type
  const handleTypeChange = (value: string) => {
    setFilters({ type: value || undefined });
  };
  
  // Gérer le filtre par criticité
  const handleCriticiteChange = (value: string) => {
    setFilters({ criticite: value ? value as Criticite : undefined });
  };
  
  // Gérer le statut des alertes (traitées/non traitées)
  const handleStatusChange = (estTraitee: boolean) => {
    setFilters({ estTraitee });
  };
  
  // Générer des alertes automatiquement
  const handleGenererAlertes = async () => {
    setGenererLoading(true);
    
    try {
      const result = await genererAlertes();
      
      if (result.success) {
        toast.success(`${result.count || 0} alerte(s) générée(s)`);
        fetchAlertes(); // Rafraîchir les alertes
      } else {
        toast.error('Erreur lors de la génération des alertes');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setGenererLoading(false);
    }
  };
  
  // Composant pour chaque alerte
  const AlerteCard = ({ alerte }: { alerte: any }) => (
    <Card className={alerte.criticite === 'CRITIQUE' || alerte.criticite === 'ELEVEE' ? 'border-red-300 dark:border-red-800' : ''}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            {getAlerteIcon(alerte.type)}
            {alerte.titre}
          </CardTitle>
          <Badge className={getCriticiteClass(alerte.criticite)}>
            {getCriticiteLabel(alerte.criticite)}
          </Badge>
        </div>
        <CardDescription className="flex justify-between items-center">
          <span>{getTypeLabel(alerte.type)}</span>
          <span className="text-xs">
            {formatDistance(new Date(alerte.dateCreation), new Date(), { 
              addSuffix: true,
              locale: fr 
            })}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{alerte.message}</p>
        
        {alerte.estTraitee && (
          <div className="mt-2 text-sm flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Traitée par {alerte.traitePar} le {format(new Date(alerte.dateTraitement), 'dd/MM/yyyy HH:mm', { locale: fr })}
            </span>
          </div>
        )}
      </CardContent>
      {!alerte.estTraitee && (
        <CardFooter>
          <Dialog open={alerte.id === selectedAlerteId && traiterDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setSelectedAlerteId(null);
              setTraiterDialogOpen(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button 
                variant="default" 
                className="w-full gap-2"
                onClick={() => {
                  setSelectedAlerteId(alerte.id);
                  setTraiterDialogOpen(true);
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Marquer comme traitée
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Traiter cette alerte</DialogTitle>
                <DialogDescription>
                  Confirmez que vous avez traité cette alerte: "{alerte.titre}"
                </DialogDescription>
              </DialogHeader>
              
              {alerte.id === selectedAlerteId && (
                <TraiterAlerteForm 
                  alerteId={alerte.id}
                  onSuccess={() => {
                    setSelectedAlerteId(null);
                    setTraiterDialogOpen(false);
                    // Pas besoin de rafraîchir explicitement, le store s'en occupe
                  }}
                  onCancel={() => {
                    setSelectedAlerteId(null);
                    setTraiterDialogOpen(false);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </CardFooter>
      )}
    </Card>
  );
  
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Alertes</h2>
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={handleGenererAlertes}
          disabled={genererLoading}
        >
          {genererLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Bell className="h-4 w-4" />
              Générer les alertes
            </>
          )}
        </Button>
      </div>
      
      {/* Résumé des alertes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Résumé des alertes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 p-3 rounded-full">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-semibold">{nombreAlertesNonTraitees}</div>
                <div className="text-sm text-muted-foreground">Alertes non traitées</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 p-3 rounded-full">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {alertes.filter(a => a.estTraitee).length}
                </div>
                <div className="text-sm text-muted-foreground">Alertes traitées</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => fetchAlertes()}
              >
                <RefreshCw className="h-4 w-4" />
                Rafraîchir les alertes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Onglets et filtres */}
      <Tabs defaultValue="non-traitees" className="w-full" onValueChange={(value) => {
        handleStatusChange(value === 'traitees');
      }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="non-traitees" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Non traitées
            </TabsTrigger>
            <TabsTrigger value="traitees" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Traitées
            </TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-8 w-full md:w-[200px]"
                value={filters.search || ''}
                onChange={handleSearchChange}
              />
            </div>
            
            <select
              className="h-9 rounded-md border border-input px-3 py-1 bg-background"
              value={filters.type || ''}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              <option value="">Tous les types</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="STOCK">Stock</option>
              <option value="INCIDENT">Incident</option>
            </select>
            
            <select
              className="h-9 rounded-md border border-input px-3 py-1 bg-background"
              value={filters.criticite || ''}
              onChange={(e) => handleCriticiteChange(e.target.value)}
            >
              <option value="">Toutes les criticités</option>
              <option value="CRITIQUE">Critique</option>
              <option value="ELEVEE">Élevée</option>
              <option value="MOYENNE">Moyenne</option>
              <option value="FAIBLE">Faible</option>
            </select>
            
            <Button variant="outline" size="sm" onClick={() => resetFilters()}>
              <Filter className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </div>
        
        <TabsContent value="non-traitees" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : alertes.length === 0 ? (
            <div className="bg-muted p-8 rounded-md text-center">
              <h3 className="text-lg font-semibold">Aucune alerte non traitée</h3>
              <p className="text-muted-foreground mt-1">
                Toutes les alertes ont été traitées ou aucune alerte ne correspond aux critères de recherche.
              </p>
              {(filters.search || filters.type || filters.criticite) && (
                <Button variant="outline" className="mt-4" onClick={() => resetFilters()}>
                  Effacer les filtres
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alertes.map((alerte) => (
                <AlerteCard key={alerte.id} alerte={alerte} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="traitees" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : alertes.length === 0 ? (
            <div className="bg-muted p-8 rounded-md text-center">
              <h3 className="text-lg font-semibold">Aucune alerte traitée</h3>
              <p className="text-muted-foreground mt-1">
                Aucune alerte traitée ne correspond aux critères de recherche.
              </p>
              {(filters.search || filters.type || filters.criticite) && (
                <Button variant="outline" className="mt-4" onClick={() => resetFilters()}>
                  Effacer les filtres
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alertes.map((alerte) => (
                <AlerteCard key={alerte.id} alerte={alerte} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Pagination */}
      {alertes.length > 0 && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Affichage de {alertes.length} alerte(s) sur {pagination.total}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => pagination.goToPreviousPage()}
            >
              Précédent
            </Button>
            
            <div className="flex items-center">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum = 0;
                const totalDisplayPages = Math.min(5, pagination.totalPages);
                
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - (totalDisplayPages - 1) + i;
                } else {
                  pageNum = (pagination.page - 2) + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    size="sm"
                    className="w-9"
                    onClick={() => pagination.goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => pagination.goToNextPage()}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertesManager;