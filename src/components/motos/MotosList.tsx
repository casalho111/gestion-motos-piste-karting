'use client';

import React, { useEffect } from 'react';
import { useMotos } from '@/store/hooks';
import { useUIStore } from '@/store/store';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EtatEntite } from '@prisma/client';
import { Filter, Plus, RefreshCw, Search } from 'lucide-react';
import Link from 'next/link';

const MotosList = () => {
  // Récupérer les données et actions du store des motos
  const {
    motos,
    isLoading,
    error,
    pagination,
    filters,
    setFilters,
    resetFilters,
    fetchMotos
  } = useMotos();
  
  // Récupérer l'état UI pour les préférences d'affichage
  const { ui } = useUIStore();
  
  // Gérer le filtrage
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };
  
  const handleEtatChange = (value: string) => {
    setFilters({ etat: value ? value as EtatEntite : undefined });
  };
  
  const handleModeleChange = (value: string) => {
    setFilters({ modele: value || undefined });
  };
  
  // Déterminer la couleur du badge en fonction de l'état
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
  
  // Traduire l'état en français pour l'affichage
  const getEtatLabel = (etat: EtatEntite) => {
    switch (etat) {
      case 'DISPONIBLE':
        return 'Disponible';
      case 'EN_MAINTENANCE':
        return 'En maintenance';
      case 'HORS_SERVICE':
        return 'Hors service';
      case 'A_VERIFIER':
        return 'À vérifier';
      case 'INDISPONIBLE':
        return 'Indisponible';
      default:
        return etat;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* En-tête avec titre et bouton d'ajout */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Motos</h2>
        <Link href="/dashboard/motos/ajouter">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une moto
          </Button>
        </Link>
      </div>
      
      {/* Barre de filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="pl-8"
            value={filters.search || ''}
            onChange={handleSearchChange}
          />
        </div>
        
        <Select
          value={filters.etat || ''}
          onValueChange={handleEtatChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="État" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les états</SelectItem>
            <SelectItem value="DISPONIBLE">Disponible</SelectItem>
            <SelectItem value="EN_MAINTENANCE">En maintenance</SelectItem>
            <SelectItem value="HORS_SERVICE">Hors service</SelectItem>
            <SelectItem value="A_VERIFIER">À vérifier</SelectItem>
            <SelectItem value="INDISPONIBLE">Indisponible</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={filters.modele || ''}
          onValueChange={handleModeleChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Modèle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les modèles</SelectItem>
            <SelectItem value="YZF-R 125">YZF-R 125</SelectItem>
            <SelectItem value="MT 125">MT 125</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={() => resetFilters()}>
          <Filter className="mr-2 h-4 w-4" />
          Réinitialiser
        </Button>
        
        <Button variant="outline" onClick={() => fetchMotos()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>
      
      {/* Affichage des motos */}
      {isLoading ? (
        // État de chargement
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        // Affichage des erreurs
        <div className="bg-red-50 p-4 rounded-md text-red-800 dark:bg-red-900/20 dark:text-red-300">
          <h3 className="text-lg font-semibold">Erreur</h3>
          <p>{error}</p>
          <Button variant="outline" className="mt-2" onClick={() => fetchMotos()}>
            Réessayer
          </Button>
        </div>
      ) : motos.length === 0 ? (
        // Aucune moto trouvée
        <div className="bg-muted p-8 rounded-md text-center">
          <h3 className="text-lg font-semibold">Aucune moto trouvée</h3>
          <p className="text-muted-foreground mt-1">
            Aucune moto ne correspond aux critères de recherche.
          </p>
          {(filters.search || filters.etat || filters.modele) && (
            <Button variant="outline" className="mt-4" onClick={() => resetFilters()}>
              Effacer les filtres
            </Button>
          )}
        </div>
      ) : (
        // Affichage des cartes de motos
        <div className={`grid grid-cols-1 md:grid-cols-${ui.cardsPerRow} gap-4`}>
          {motos.map((moto) => (
            <Card key={moto.id} className={ui.tableCompactMode ? 'p-3' : ''}>
              <CardHeader className={ui.tableCompactMode ? 'p-2' : ''}>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{moto.numSerie}</CardTitle>
                  <Badge className={getEtatBadgeColor(moto.etat)}>
                    {getEtatLabel(moto.etat)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className={ui.tableCompactMode ? 'p-2 pt-0' : ''}>
                <div className="space-y-1 text-sm">
                  <p><strong>Modèle:</strong> {moto.modele}</p>
                  <p><strong>Kilométrage:</strong> {moto.kilometrage.toFixed(1)} km</p>
                  <p>
                    <strong>Moteur:</strong> {
                      moto.moteurCourant 
                        ? `${moto.moteurCourant.numSerie} (${moto.moteurCourant.kilometrage.toFixed(1)} km)` 
                        : "Non monté"
                    }
                  </p>
                  {moto.notesEtat && (
                    <p className="text-xs text-muted-foreground italic">
                      {moto.notesEtat}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className={ui.tableCompactMode ? 'p-2 pt-0' : ''}>
                <Button 
                  variant="default" 
                  size="sm"
                  asChild
                  className="w-full"
                >
                  <Link href={`/dashboard/motos/${moto.id}`}>
                    Voir détails
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {motos.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Affichage de {motos.length} motos sur {pagination.total}
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
                // Logique pour afficher les pages autour de la page courante
                let pageNum = 0;
                const totalDisplayPages = Math.min(5, pagination.totalPages);
                
                if (pagination.totalPages <= 5) {
                  // Si moins de 5 pages, afficher toutes les pages
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  // Si près du début
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  // Si près de la fin
                  pageNum = pagination.totalPages - (totalDisplayPages - 1) + i;
                } else {
                  // Au milieu
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

export default MotosList;