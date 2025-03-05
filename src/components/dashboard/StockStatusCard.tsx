'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { InfoIcon, Package, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

interface StockStatusCardProps {
  totalPieces: number
  piecesStockBas: any[]
}

/**
 * Carte affichant l'état du stock de pièces
 */
export function StockStatusCard({ totalPieces, piecesStockBas }: StockStatusCardProps) {
  // Calculer le nombre de pièces en rupture
  const piecesEnRupture = piecesStockBas.filter(p => p.quantiteStock === 0).length

  // Déterminer la sévérité de l'état du stock
  const getStatusColor = () => {
    if (piecesEnRupture > 0) return 'text-red-500'
    if (piecesStockBas.length > 0) return 'text-amber-500'
    return 'text-green-500'
  }

  // Déterminer le message à afficher
  const getStatusText = () => {
    if (piecesEnRupture > 0) return 'Rupture de stock'
    if (piecesStockBas.length > 0) return 'Stock bas'
    return 'Stock normal'
  }

  // Déterminer l'icône à afficher
  const getStatusIcon = () => {
    if (piecesEnRupture > 0) return <ShoppingCart className={`h-5 w-5 ${getStatusColor()}`} />
    if (piecesStockBas.length > 0) return <Package className={`h-5 w-5 ${getStatusColor()}`} />
    return <Package className={`h-5 w-5 ${getStatusColor()}`} />
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Stock de pièces</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>État du stock de pièces détachées</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-base font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Pièces en stock bas</span>
            <span className={piecesStockBas.length > 0 ? 'font-medium text-amber-500' : ''}>
              {piecesStockBas.length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Ruptures de stock</span>
            <span className={piecesEnRupture > 0 ? 'font-medium text-red-500' : ''}>
              {piecesEnRupture}
            </span>
          </div>
        </div>
        
        {piecesStockBas.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-xs font-medium mb-2">Pièces à commander</h4>
            <ul className="text-xs space-y-1">
              {piecesStockBas.slice(0, 3).map(piece => (
                <li key={piece.id} className="truncate">
                  {piece.nom} ({piece.quantiteStock}/{piece.quantiteMinimale})
                </li>
              ))}
              {piecesStockBas.length > 3 && (
                <li className="text-muted-foreground">
                  + {piecesStockBas.length - 3} autres...
                </li>
              )}
            </ul>
          </div>
        )}
        
        <div className="mt-4">
          <Link 
            href="/dashboard/pieces" 
            className="text-xs text-primary hover:underline"
          >
            Gérer le stock →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}