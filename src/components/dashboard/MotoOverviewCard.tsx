'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { InfoIcon } from 'lucide-react'
import Link from 'next/link'

interface MotoOverviewCardProps {
  totalMotos: number
  disponibles: number
  enMaintenance: number
  horsService: number
}

/**
 * Carte affichant une vue d'ensemble des motos du parc
 */
export function MotoOverviewCard({ 
  totalMotos, 
  disponibles, 
  enMaintenance, 
  horsService 
}: MotoOverviewCardProps) {
  // Calculer le taux de disponibilité
  const tauxDisponibilite = totalMotos > 0 
    ? Math.round((disponibles / totalMotos) * 100) 
    : 0

  // Couleurs selon le taux de disponibilité
  const getProgressColor = () => {
    if (tauxDisponibilite >= 75) return 'bg-green-500'
    if (tauxDisponibilite >= 50) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Motos</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>État du parc de motos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {disponibles} / {totalMotos}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Motos disponibles
        </p>
        
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Disponibilité</span>
            <span className={tauxDisponibilite < 50 ? 'text-red-500 font-medium' : ''}>
              {tauxDisponibilite}%
            </span>
          </div>
          <Progress value={tauxDisponibilite} className={getProgressColor()} />
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div className="flex flex-col">
            <span className="text-muted-foreground">En maintenance</span>
            <span className="font-medium">{enMaintenance}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Hors service</span>
            <span className="font-medium">{horsService}</span>
          </div>
        </div>
        
        <div className="mt-4">
          <Link 
            href="/dashboard/motos" 
            className="text-xs text-primary hover:underline"
          >
            Voir toutes les motos →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}