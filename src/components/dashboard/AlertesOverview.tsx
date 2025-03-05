'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ArrowRight, Package } from 'lucide-react'
import Link from 'next/link'
import { useAlerteStore } from '@/store/store'
import { useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface AlertesOverviewProps {
  alertes: any[]
  nombreAlertesNonTraitees: number
  isLoading: boolean
}

/**
 * Composant affichant une vue d'ensemble des alertes actives
 */
export function AlertesOverview({ 
  alertes, 
  nombreAlertesNonTraitees, 
  isLoading 
}: AlertesOverviewProps) {
  // Récupérer la fonction pour générer les alertes depuis le store
  const { genererAlertes } = useAlerteStore()

  // Générer des alertes automatiquement au chargement du composant si aucune n'existe
  useEffect(() => {
    if (!isLoading && alertes.length === 0 && nombreAlertesNonTraitees === 0) {
      genererAlertes()
    }
  }, [isLoading, alertes.length, nombreAlertesNonTraitees, genererAlertes])

  // Afficher un squelette de chargement
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertes système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Skeleton className="h-9 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Alertes système</CardTitle>
          {nombreAlertesNonTraitees > 0 && (
            <Badge variant="destructive">
              {nombreAlertesNonTraitees} non traitée{nombreAlertesNonTraitees > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {alertes.length === 0 ? (
          <div className="text-center py-6">
            <div className="bg-muted inline-flex items-center justify-center p-4 rounded-full mb-4">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">Aucune alerte active</h3>
            <p className="text-sm text-muted-foreground">
              Le système fonctionne normalement
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alertes.slice(0, 5).map((alerte) => (
              <div key={alerte.id} className="flex items-start gap-3">
                <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-full">
                  <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Stock faible: {alerte.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {alerte.quantiteStock} en stock (min: {alerte.quantiteMinimale})
                  </p>
                </div>
              </div>
            ))}
            
            {alertes.length > 5 && (
              <p className="text-xs text-muted-foreground mt-2">
                + {alertes.length - 5} autre{alertes.length - 5 > 1 ? 's' : ''} alerte{alertes.length - 5 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
        
        <div className="flex flex-col mt-6 space-y-2">
          <Button asChild>
            <Link href="/dashboard/alertes" className="w-full flex items-center justify-center gap-2">
              Voir toutes les alertes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => genererAlertes()} className="w-full">
            Vérifier les maintenances dues
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}