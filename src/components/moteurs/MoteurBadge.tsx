'use client';

import { EtatEntite } from '@prisma/client';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  XCircle, 
  Cog, 
} from 'lucide-react';
import { LiaMotorcycleSolid } from "react-icons/lia";
import { cn } from '@/lib/utils';

interface MoteurBadgeProps {
  moteur: {
    id: string;
    numSerie: string;
    type: string;
    etat: EtatEntite;
  };
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MoteurBadge = ({
  moteur,
  showIcon = true,
  size = 'md',
  className
}: MoteurBadgeProps) => {
  // Configurer les classes en fonction de l'état
  const getStateConfig = (etat: EtatEntite) => {
    switch (etat) {
      case 'DISPONIBLE':
        return {
          bgColor: 'bg-green-100 dark:bg-green-950/30',
          textColor: 'text-green-800 dark:text-green-300',
          borderColor: 'border-green-200 dark:border-green-900',
          icon: <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        };
      case 'EN_MAINTENANCE':
        return {
          bgColor: 'bg-amber-100 dark:bg-amber-950/30',
          textColor: 'text-amber-800 dark:text-amber-300',
          borderColor: 'border-amber-200 dark:border-amber-900',
          icon: <Cog className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        };
      case 'A_VERIFIER':
        return {
          bgColor: 'bg-orange-100 dark:bg-orange-950/30',
          textColor: 'text-orange-800 dark:text-orange-300',
          borderColor: 'border-orange-200 dark:border-orange-900',
          icon: <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        };
      case 'HORS_SERVICE':
        return {
          bgColor: 'bg-red-100 dark:bg-red-950/30',
          textColor: 'text-red-800 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-900',
          icon: <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        };
      default:
        return {
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-800 dark:text-gray-300',
          borderColor: 'border-gray-200 dark:border-gray-700',
          icon: <AlertCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        };
    }
  };

  const config = getStateConfig(moteur.etat);
  
  // Ajuster la taille
  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-1.5 px-3',
    lg: 'text-base py-2 px-4'
  };

  return (
    <div className={cn(
      'flex items-center gap-2 rounded-md border',
      'font-medium',
      config.bgColor,
      config.textColor,
      config.borderColor,
      sizeClasses[size],
      className
    )}>
      {showIcon && (
        <>
          <LiaMotorcycleSolid  className={cn(
            "mr-1",
            size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
          )} />
          {config.icon}
        </>
      )}
      <span>{moteur.numSerie}</span>
      <span className="opacity-75 text-xs">({moteur.type})</span>
    </div>
  );
};

export default MoteurBadge;