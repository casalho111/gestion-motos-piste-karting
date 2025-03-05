'use client'

import { useState, useEffect } from 'react'
import { useMotoStore } from '@/store/store'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { SearchBar } from '@/components/ui/search-bar'
import { Skeleton } from '@/components/ui/skeleton'
import { EtatEntite } from '@prisma/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MotoCard } from '@/components/motos/MotoCard'
import { useRouter } from 'next/navigation'
import {  PlusCircle } from 'lucide-react'
import { LiaMotorcycleSolid } from "react-icons/lia";

export function MotosList() {
  const router = useRouter()
  const {
    motos,
    pagination,
    filters,
    fetchMotos,
    setPage,
    setFilters,
    resetFilters
  } = useMotoStore()
  
  useEffect(() => {
    fetchMotos()
  }, [fetchMotos, pagination.page, filters])
  
  const handleEtatChange = (value: string) => {
    setFilters({ etat: value === '' ? undefined : value as EtatEntite })
  }
  
  const handleModeleChange = (value: string) => {
    setFilters({ modele: value })
  }
  
  const handleSearchChange = (value: string) => {
    setFilters({ search: value })
  }
  
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
  if (motos.status === 'loading' && !motos.data) {
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
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <SearchBar
            placeholder="Rechercher une moto..."
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
            value={filters.modele || ''}
            onValueChange={handleModeleChange}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Modèle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les modèles</SelectItem>
              <SelectItem value="YZF-R 125">YZF-R 125</SelectItem>
              <SelectItem value="MT 125">MT 125</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => resetFilters()}
          >
            Réinitialiser
          </Button>
        </div>
        
        <Button onClick={() => router.push('/dashboard/motos/ajouter')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Ajouter une moto
        </Button>
      </div>
      
      {motos.status === 'error' && (
        <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <CardContent className="py-4">
            <p className="text-red-600 dark:text-red-400">{motos.error || 'Une erreur est survenue lors du chargement des motos'}</p>
          </CardContent>
        </Card>
      )}
      
      {motos.data?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <LiaMotorcycleSolid className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune moto trouvée</h3>
            <p className="text-muted-foreground mb-4">Aucune moto ne correspond à vos critères de recherche</p>
            <Button variant="outline" onClick={() => resetFilters()}>
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {motos.data?.map((moto) => (
              <MotoCard key={moto.id} moto={moto} />
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