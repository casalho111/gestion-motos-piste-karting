'use client'

import { useState, useEffect } from 'react'
import { useMoteurStore } from '@/store/store'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { SearchBar } from '@/components/ui/search-bar'
import { Skeleton } from '@/components/ui/skeleton'
import { EtatEntite } from '@prisma/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MoteurCard } from '@/components/moteurs/MoteurCard'
import { useRouter } from 'next/navigation'
import { PlusCircle, SettingsIcon, WrenchIcon } from 'lucide-react'
import { PiEngineBold } from "react-icons/pi";

export function MoteursList() {
  const router = useRouter()
  const {
    moteurs,
    pagination,
    filters,
    fetchMoteurs,
    setPage,
    setFilters,
    resetFilters
  } = useMoteurStore()
  
  // Charger les moteurs au montage du composant
  useEffect(() => {
    fetchMoteurs()
  }, [fetchMoteurs, pagination.page, filters])
  
  // Handlers pour les filtres
  const handleEtatChange = (value: string) => {
    setFilters({ etat: value === '' ? undefined : value as EtatEntite })
  }
  
  const handleTypeChange = (value: string) => {
    setFilters({ type: value })
  }
  
  const handleMontageChange = (value: string) => {
    if (value === 'montes') {
      setFilters({ estMonte: true })
    } else if (value === 'disponibles') {
      setFilters({ estMonte: false })
    } else {
      setFilters({ estMonte: undefined })
    }
  }
  
  const handleSearchChange = (value: string) => {
    setFilters({ search: value })
  }
  
  // Traduction des états pour l'affichage
  const getEtatLabel = (etat: EtatEntite) => {
    switch (etat) {
      case 'DISPONIBLE': return 'Disponible'
      case 'EN_MAINTENANCE': return 'En maintenance'
      case 'A_VERIFIER': return 'À vérifier'
      case 'HORS_SERVICE': return 'Hors service'
      case 'INDISPONIBLE': return 'Indisponible'
      default: return etat
    }
  }
  
  // Afficher un état de chargement
  if (moteurs.status === 'loading' && !moteurs.data) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-[200px]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestion des Moteurs</h1>
        <Button onClick={() => router.push('/dashboard/moteurs/ajouter')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Ajouter un moteur
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-4 items-center">
        <SearchBar
          placeholder="Rechercher un moteur..."
          initialValue={filters.search || ''}
          onSearch={handleSearchChange}
          className="w-full sm:w-[250px]"
        />
        
        <Select
          value={filters.etat || ''}
          onValueChange={handleEtatChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="État" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les états</SelectItem>
            {Object.values(EtatEntite).map((etat) => (
              <SelectItem key={etat} value={etat}>
                {getEtatLabel(etat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={filters.estMonte !== undefined 
            ? filters.estMonte ? 'montes' : 'disponibles' 
            : ''}
          onValueChange={handleMontageChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous</SelectItem>
            <SelectItem value="montes">Montés</SelectItem>
            <SelectItem value="disponibles">Non montés</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={filters.type || ''}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les types</SelectItem>
            <SelectItem value="125cc Racing">125cc Racing</SelectItem>
            <SelectItem value="125cc Standard">125cc Standard</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          onClick={() => resetFilters()}
        >
          Réinitialiser
        </Button>
      </div>
      
      {moteurs.status === 'error' && (
        <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <CardContent className="py-4">
            <p className="text-red-600 dark:text-red-400">{moteurs.error || 'Une erreur est survenue lors du chargement des moteurs'}</p>
          </CardContent>
        </Card>
      )}
      
      {moteurs.data?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <PiEngineBold className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun moteur trouvé</h3>
            <p className="text-muted-foreground mb-4">Aucun moteur ne correspond à vos critères de recherche</p>
            <Button variant="outline" onClick={() => resetFilters()}>
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moteurs.data?.map((moteur) => (
              <MoteurCard key={moteur.id} moteur={moteur} />
            ))}
          </div>
          
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}