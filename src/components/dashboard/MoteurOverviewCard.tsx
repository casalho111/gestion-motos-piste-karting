'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { InfoIcon } from 'lucide-react'
import Link from 'next/link'

interface MoteurOverviewCardProps {
  totalMoteurs: number
  disponibles: number
  montes: number
  horsService: number
}

/**
 * Carte affichant une vue d'ensemble des moteurs du parc
 */
export function MoteurOverviewCard({ 
  totalMoteurs, 
  disponibles, 
  montes, 
  horsService 
}: MoteurOverviewCardProps) {
  // Calculer le taux d'utilisation (moteurs montés)
  const tauxUtilisation = totalMoteurs > 0 
    ? Math.round((montes / totalMoteurs) * 100) 
    : 0

  // Couleurs selon le taux d'utilisation
  const getProgressColor = () => {
    if (tauxUtilisation >= 75) return 'bg-blue-500'
    if (tauxUtilisation >= 50) return 'bg-blue-400'
    return 'bg-blue-300'
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Moteurs</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>État du parc de moteurs</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {montes} / {totalMoteurs}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Moteurs montés
        </p>
        
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Taux d'utilisation</span>
            <span>
              {tauxUtilisation}%
            </span>
          </div>
          <Progress value={tauxUtilisation} className={getProgressColor()} />
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Disponibles</span>
            <span className="font-medium">{disponibles}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Hors service</span>
            <span className="font-medium">{horsService}</span>
          </div>
        </div>
        
        <div className="mt-4">
          <Link 
            href="/dashboard/moteurs" 
            className="text-xs text-primary hover:underline"
          >
            Voir tous les moteurs →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}