'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Constantes pour les seuils d'entretien
const KILOMETRAGE_ENTRETIEN_CYCLE = 6000; // 6000 km
const KILOMETRAGE_ENTRETIEN_MOTEUR = 3000; // 3000 km
const SEUIL_ALERTE_ENTRETIEN = 500; // 500 km

interface KilometrageDisplayProps {
  kilometrage: number;
  isCycle: boolean;  // true pour une partie cycle, false pour un moteur
  showEntretienInfo?: boolean;
  className?: string;
}

const KilometrageDisplay = ({
  kilometrage,
  isCycle,
  showEntretienInfo = true,
  className
}: KilometrageDisplayProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'ok' | 'warning' | 'critical'>('ok');
  const [kilometrageRestant, setKilometrageRestant] = useState(0);
  const [progressColor, setProgressColor] = useState('');

  // Calculer les valeurs nécessaires
  useEffect(() => {
    const entretienSeuil = isCycle ? KILOMETRAGE_ENTRETIEN_CYCLE : KILOMETRAGE_ENTRETIEN_MOTEUR;
    const dernierSeuilFranchi = Math.floor(kilometrage / entretienSeuil) * entretienSeuil;
    const prochainSeuil = dernierSeuilFranchi + entretienSeuil;
    const restant = prochainSeuil - kilometrage;
    const progressValue = ((kilometrage - dernierSeuilFranchi) / entretienSeuil) * 100;
    
    // Déterminer le statut
    let currentStatus: 'ok' | 'warning' | 'critical' = 'ok';
    let color = '';
    
    if (restant <= SEUIL_ALERTE_ENTRETIEN / 3) {
      currentStatus = 'critical';
      color = 'bg-red-500';
    } else if (restant <= SEUIL_ALERTE_ENTRETIEN) {
      currentStatus = 'warning';
      color = 'bg-amber-500';
    } else {
      currentStatus = 'ok';
      color = 'bg-blue-500';
    }
    
    setProgress(progressValue);
    setStatus(currentStatus);
    setKilometrageRestant(restant);
    setProgressColor(color);
  }, [kilometrage, isCycle]);

  // Formater le message d'entretien
  const getEntretienMessage = () => {
    const typeEntite = isCycle ? "la moto" : "du moteur";
    const typeSeuil = isCycle ? "tous les 6 000 km" : "tous les 3 000 km";
    
    if (status === 'critical') {
      return `Entretien ${typeEntite} nécessaire (dépassement de ${kilometrageRestant.toFixed(0)} km)`;
    } else if (status === 'warning') {
      return `Entretien ${typeEntite} à prévoir prochainement (dans ${kilometrageRestant.toFixed(0)} km)`;
    } else {
      return `Entretien ${typeEntite} recommandé ${typeSeuil} (dans ${kilometrageRestant.toFixed(0)} km)`;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <p className="text-2xl font-bold">{kilometrage.toFixed(1)} km</p>
        
        {showEntretienInfo && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  {status === 'ok' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {status === 'warning' && (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  )}
                  {status === 'critical' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getEntretienMessage()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {showEntretienInfo && (
        <>
          <Progress value={progress} className={cn("h-2", progressColor)} />
          <p className="text-xs text-muted-foreground">
            Prochain entretien dans {kilometrageRestant.toFixed(0)} km
            {status === 'warning' && " (prévoir bientôt)"}
            {status === 'critical' && " (urgent)"}
          </p>
        </>
      )}
    </div>
  );
};

export default KilometrageDisplay;