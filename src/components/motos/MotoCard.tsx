'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EtatEntite } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { PiEngineBold } from "react-icons/pi";
import { LiaMotorcycleSolid } from "react-icons/lia";
import { AlertTriangle, CheckCircle } from 'lucide-react'

// Type pour les propriétés du composant
interface MotoCardProps {
  moto: {
    id: string;
    numSerie: string;
    modele: string;
    kilometrage: number;
    etat: EtatEntite;
    moteurCourantId?: string | null;
    moteurCourant?: {
      id: string;
      numSerie: string;
      type: string;
    } | null;
    controles?: any[];
  };
}

export function MotoCard({ moto }: MotoCardProps) {
  const router = useRouter()
  
  // Fonction pour obtenir la couleur du badge en fonction de l'état
  const getEtatBadgeVariant = (etat: EtatEntite) => {
    switch (etat) {
      case 'DISPONIBLE': return 'secondary' as const
      case 'EN_MAINTENANCE': return 'outline' as const
      case 'A_VERIFIER': return 'destructive' as const
      case 'HORS_SERVICE': return 'destructive' as const
      case 'INDISPONIBLE': return 'outline' as const
      default: return 'default' as const
    }
  }
  
  // Fonction pour obtenir le libellé de l'état
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
  
  // Récupérer le dernier contrôle
  const dernierControle = moto.controles?.[0]
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center">
            {moto.numSerie}
          </CardTitle>
          <Badge variant={getEtatBadgeVariant(moto.etat)}>
            {getEtatLabel(moto.etat)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-1 text-sm">
          <p><span className="text-muted-foreground">Modèle:</span> {moto.modele}</p>
          <p><span className="text-muted-foreground">Kilométrage:</span> {moto.kilometrage} km</p>
          <div className="flex items-center">
            <span className="text-muted-foreground mr-1">Moteur:</span>
            {moto.moteurCourant ? (
              <span className="flex items-center">
                <PiEngineBold  className="h-3.5 w-3.5 mr-1 text-blue-500" />
                {moto.moteurCourant.numSerie}
              </span>
            ) : (
              <span className="text-orange-500 flex items-center">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                Non monté
              </span>
            )}
          </div>
          {dernierControle && (
            <div className="flex items-center text-xs mt-2">
              <span className="text-muted-foreground mr-1">Dernier contrôle:</span>
              {dernierControle.estConforme ? (
                <span className="text-green-500 flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  OK
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Non conforme
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="default" 
          size="sm"
          onClick={() => router.push(`/dashboard/motos/${moto.id}`)}
          className="w-full"
        >
          Voir détails
        </Button>
      </CardFooter>
    </Card>
  )
}