'use client'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TypeEntretien } from '@prisma/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { WrenchIcon, CircleDollarSign, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface MaintenanceListProps {
  maintenances: any[]
  isLoading: boolean
}

/**
 * Composant qui affiche la liste des maintenances récentes
 */
export function MaintenanceList({ maintenances, isLoading }: MaintenanceListProps) {
  // Fonction pour obtenir le badge du type de maintenance
  const getMaintenanceTypeInfo = (type: TypeEntretien) => {
    switch (type) {
      case 'ENTRETIEN_REGULIER':
        return {
          label: 'Entretien régulier',
          variant: 'default' as const,
          icon: <WrenchIcon className="h-3 w-3 mr-1" />
        }
      case 'REPARATION':
        return {
          label: 'Réparation',
          variant: 'destructive' as const,
          icon: <AlertTriangle className="h-3 w-3 mr-1" />
        }
      case 'REVISION_MOTEUR':
        return {
          label: 'Révision moteur',
          variant: 'secondary' as const,
          icon: <WrenchIcon className="h-3 w-3 mr-1" />
        }
      case 'VIDANGE':
        return {
          label: 'Vidange',
          variant: 'outline' as const,
          icon: null
        }
      case 'FREINS':
        return {
          label: 'Freins',
          variant: 'outline' as const,
          icon: null
        }
      case 'PNEUS':
        return {
          label: 'Pneus',
          variant: 'outline' as const,
          icon: null
        }
      default:
        return {
          label: type,
          variant: 'outline' as const,
          icon: null
        }
    }
  }

  // Si les données sont en cours de chargement
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-start space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Si aucune maintenance n'est disponible
  if (!maintenances || maintenances.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="bg-muted inline-flex items-center justify-center p-4 rounded-full mb-4">
          <WrenchIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">Aucune maintenance récente</h3>
        <p className="text-sm text-muted-foreground">
          Toutes les motos sont en bon état
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {maintenances.map((maintenance) => {
        const typeInfo = getMaintenanceTypeInfo(maintenance.type)
        const formattedDate = format(
          new Date(maintenance.dateRealisation), 
          'dd MMM yyyy', 
          { locale: fr }
        )

        return (
          <div key={maintenance.id} className="flex items-start space-x-4">
            <div className="bg-primary/10 dark:bg-primary/20 h-10 w-10 rounded-full flex items-center justify-center">
              <WrenchIcon className="h-5 w-5 text-primary" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">
                  {maintenance.cycle ? maintenance.cycle.numSerie : maintenance.moteur?.numSerie}
                </h4>
                <Badge variant={typeInfo.variant} className="text-[10px] h-5 px-1.5 flex items-center">
                  {typeInfo.icon}
                  {typeInfo.label}
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mt-1">
                {formattedDate} • {maintenance.technicien}
              </p>
              
              <p className="text-xs mt-0.5 flex items-center">
                <CircleDollarSign className="h-3.5 w-3.5 mr-1" />
                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(maintenance.coutTotal)}
              </p>
            </div>
            
            <div>
              <Link 
                href={`/dashboard/maintenances/${maintenance.id}`}
                className="text-xs text-primary hover:underline"
              >
                Détails
              </Link>
            </div>
          </div>
        )
      })}
      
      <div className="pt-2">
        <Link 
          href="/dashboard/maintenances"
          className="text-sm text-primary hover:underline"
        >
          Voir toutes les maintenances →
        </Link>
      </div>
    </div>
  )
}