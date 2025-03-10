'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Check, 
  X, 
  Info, 
  ArrowRight, 
  Calendar, 
  AlertCircle, 
  CheckCircle,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface Controle {
  id: string;
  date: string | Date;
  controleur: string;
  estConforme: boolean;
  freinsAvant: boolean;
  freinsArriere: boolean;
  pneus: boolean;
  suspensions: boolean;
  transmission: boolean;
  niveauxFluides: boolean;
  eclairage: boolean;
  autres?: string | null;
  commentaires?: string | null;
  cycle?: { id: string; numSerie: string; modele: string; };
}

interface ControlesListProps {
  controles: Controle[];
  maxItems?: number;
  hideEntityName?: boolean;
  showPagination?: boolean;
  compact?: boolean;
  className?: string;
}

const ControlesList = ({
  controles,
  maxItems = 5,
  hideEntityName = false,
  showPagination = false,
  compact = false,
  className
}: ControlesListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  
  if (!controles || controles.length === 0) {
    return (
      <div className={cn("text-center text-muted-foreground p-4", className)}>
        Aucun contrôle journalier enregistré
      </div>
    );
  }

  // Pagination
  const totalPages = showPagination ? Math.ceil(controles.length / maxItems) : 1;
  const startIndex = showPagination ? (currentPage - 1) * maxItems : 0;
  const visibleControles = showPagination 
    ? controles.slice(startIndex, startIndex + maxItems) 
    : controles.slice(0, maxItems);

  return (
    <div className={className}>
      <div className="space-y-4">
        {visibleControles.map((controle) => (
          <ControleCard 
            key={controle.id} 
            controle={controle} 
            hideEntityName={hideEntityName}
            compact={compact}
            onClick={() => router.push(`/dashboard/controles/${controle.id}`)}
          />
        ))}
      </div>
      
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>
          
          <span className="text-sm">
            Page {currentPage} sur {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
};

const ControleCard = ({ 
  controle, 
  hideEntityName = false,
  compact = false,
  onClick 
}: { 
  controle: Controle; 
  hideEntityName?: boolean;
  compact?: boolean;
  onClick?: () => void;
}) => {
  const controleDate = new Date(controle.date);
  
  const StatusIcon = ({ isChecked }: { isChecked: boolean }) => (
    isChecked ? (
      <Check className="h-4 w-4 text-green-500" />
    ) : (
      <X className="h-4 w-4 text-red-500" />
    )
  );
  
  if (compact) {
    return (
      <div
        className={cn(
          "p-3 border rounded-md",
          controle.estConforme 
            ? "border-green-200 dark:border-green-900" 
            : "border-red-200 dark:border-red-900",
          onClick && "cursor-pointer hover:bg-muted/50 transition-colors"
        )}
        onClick={onClick}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              {format(controleDate, 'dd/MM/yyyy')}
            </p>
            {!hideEntityName && controle.cycle && (
              <p className="text-xs text-muted-foreground">
                {controle.cycle.numSerie} - {controle.cycle.modele}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {controle.estConforme ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            <span className={cn(
              "text-sm font-medium",
              controle.estConforme ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}>
              {controle.estConforme ? 'Conforme' : 'Non conforme'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Card 
      className={cn(
        controle.estConforme 
          ? "border-green-200 dark:border-green-900" 
          : "border-red-200 dark:border-red-900",
        onClick && "cursor-pointer hover:bg-muted/50 transition-colors"
      )}
      onClick={onClick}
    >
      <CardHeader className={cn(
        "pb-2",
        controle.estConforme 
          ? "bg-green-50 dark:bg-green-950/30" 
          : "bg-red-50 dark:bg-red-950/30"
      )}>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">
              Contrôle journalier du {format(controleDate, 'dd MMMM yyyy', { locale: fr })}
            </CardTitle>
            <CardDescription>
              {controle.controleur}
            </CardDescription>
          </div>
          <Badge className={cn(
            controle.estConforme 
              ? "bg-green-500 hover:bg-green-600" 
              : "bg-red-500 hover:bg-red-600"
          )}>
            {controle.estConforme ? 'Conforme' : 'Non conforme'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-3">
        {!hideEntityName && controle.cycle && (
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>
                <span className="text-muted-foreground">Moto:</span> {controle.cycle.numSerie} - {controle.cycle.modele}
              </span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <ControlItem label="Freins avant" checked={controle.freinsAvant} />
          <ControlItem label="Freins arrière" checked={controle.freinsArriere} />
          <ControlItem label="Pneus" checked={controle.pneus} />
          <ControlItem label="Suspensions" checked={controle.suspensions} />
          <ControlItem label="Transmission" checked={controle.transmission} />
          <ControlItem label="Niveaux fluides" checked={controle.niveauxFluides} />
          <ControlItem label="Éclairage" checked={controle.eclairage} />
        </div>
        
        {(controle.autres || controle.commentaires) && (
          <>
            <Separator className="my-3" />
            
            {controle.autres && (
              <div className="mb-2">
                <p className="text-sm font-medium">Autres vérifications:</p>
                <p className="text-sm text-muted-foreground">{controle.autres}</p>
              </div>
            )}
            
            {controle.commentaires && (
              <div>
                <p className="text-sm font-medium">Commentaires:</p>
                <p className="text-sm text-muted-foreground">{controle.commentaires}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
      {onClick && (
        <CardFooter className="pt-0">
          <Button variant="ghost" size="sm" className="ml-auto">
            Détails <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

// Composant pour afficher un élément de contrôle
const ControlItem = ({ label, checked }: { label: string, checked: boolean }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center justify-between gap-2 px-2 py-1 rounded-md",
            checked 
              ? "bg-green-50 dark:bg-green-950/30" 
              : "bg-red-50 dark:bg-red-950/30"
          )}>
            <span className="text-sm">{label}</span>
            {checked ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {checked ? 'Conforme' : 'Non conforme'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ControlesList;