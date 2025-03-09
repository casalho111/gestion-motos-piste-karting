'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EtatEntite } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { PiEngineBold } from "react-icons/pi";
import { LiaMotorcycleSolid } from "react-icons/lia";
import { AlertTriangle, CheckCircle, Settings, Wrench } from 'lucide-react'

// Type pour les propriétés du composant
interface MoteurCardProps {
  moteur: {
    id: string;
    numSerie: string;
    type: string;
    cylindree: number;
    dateAcquisition: Date;
    kilometrage: number;
    heuresMoteur?: number | null;
    etat: EtatEntite;
    cycleActuel?: {
      id: string;
      numSerie: string;
      modele: string;
    } | null;
  };
}

export function MoteurCard({ moteur }: MoteurCardProps) {
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
  
  // Formater la date d'acquisition
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center">
            <PiEngineBold className="mr-2 h-5 w-5 text-blue-500" />
            {moteur.numSerie}
          </CardTitle>
          <Badge variant={getEtatBadgeVariant(moteur.etat)}>
            {getEtatLabel(moteur.etat)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-1 text-sm">
          <p><span className="text-muted-foreground">Type:</span> {moteur.type}</p>
          <p><span className="text-muted-foreground">Cylindrée:</span> {moteur.cylindree} cc</p>
          <p><span className="text-muted-foreground">Kilométrage:</span> {moteur.kilometrage} km</p>
          <p><span className="text-muted-foreground">Acquis le:</span> {formatDate(moteur.dateAcquisition)}</p>
          
          <div className="flex items-center mt-2 pt-2 border-t border-border">
            <span className="text-muted-foreground mr-1">Monté sur:</span>
            {moteur.cycleActuel ? (
              <span className="flex items-center">
                <LiaMotorcycleSolid className="h-3.5 w-3.5 mr-1 text-green-500" />
                {moteur.cycleActuel.numSerie} ({moteur.cycleActuel.modele})
              </span>
            ) : (
              <span className="text-orange-500 flex items-center">
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                Non monté
              </span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          variant="default" 
          size="sm"
          onClick={() => router.push(`/dashboard/moteurs/${moteur.id}`)}
          className="flex-1"
        >
          Voir détails
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/moteurs/${moteur.id}/maintenance`)}
        >
          <Wrench className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}