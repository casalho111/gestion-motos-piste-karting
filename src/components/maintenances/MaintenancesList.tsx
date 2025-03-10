'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TypeEntretien } from '@prisma/client';
import { 
  ArrowRight, 
  Calendar, 
  User, 
  Receipt, 
  Wrench,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';
import { LiaMotorcycleSolid } from "react-icons/lia";
import { FaTools } from "react-icons/fa";
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

interface EntityReference {
  id: string;
  numSerie: string;
  modele?: string;
  type?: string;
}

interface Maintenance {
  id: string;
  type: TypeEntretien;
  dateRealisation: string | Date;
  kilometrageEffectue: number;
  coutTotal: number;
  technicien: string;
  description: string;
  notes?: string | null;
  cycle?: EntityReference | null;
  moteur?: EntityReference | null;
  piecesUtilisees?: any[];
}

interface MaintenancesListProps {
  maintenances: Maintenance[];
  maxItems?: number;
  hideEntityName?: boolean;
  showPagination?: boolean;
  compact?: boolean;
  className?: string;
}

const MaintenancesList = ({
  maintenances,
  maxItems = 5,
  hideEntityName = false,
  showPagination = false,
  compact = false,
  className
}: MaintenancesListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  
  if (!maintenances || maintenances.length === 0) {
    return (
      <div className={cn("text-center text-muted-foreground p-4", className)}>
        Aucune maintenance enregistrée
      </div>
    );
  }

  // Pagination
  const totalPages = showPagination ? Math.ceil(maintenances.length / maxItems) : 1;
  const startIndex = showPagination ? (currentPage - 1) * maxItems : 0;
  const visibleMaintenances = showPagination 
    ? maintenances.slice(startIndex, startIndex + maxItems) 
    : maintenances.slice(0, maxItems);

  return (
    <div className={className}>
      <div className="space-y-4">
        {visibleMaintenances.map((maintenance) => (
          <MaintenanceCard 
            key={maintenance.id} 
            maintenance={maintenance} 
            hideEntityName={hideEntityName}
            compact={compact}
            onClick={() => router.push(`/dashboard/maintenances/${maintenance.id}`)}
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

const MaintenanceCard = ({ 
  maintenance, 
  hideEntityName = false,
  compact = false,
  onClick 
}: { 
  maintenance: Maintenance; 
  hideEntityName?: boolean;
  compact?: boolean;
  onClick?: () => void;
}) => {
  const maintenanceDate = new Date(maintenance.dateRealisation);
  
  // Formatter le type de maintenance pour l'affichage
  const formatEntretienType = (type: TypeEntretien) => {
    switch(type) {
      case 'ENTRETIEN_REGULIER': return 'Entretien régulier';
      case 'REPARATION': return 'Réparation';
      case 'REVISION_MOTEUR': return 'Révision moteur';
      case 'VIDANGE': return 'Vidange';
      case 'FREINS': return 'Freins';
      case 'PNEUS': return 'Pneus';
      case 'TRANSMISSION': return 'Transmission';
      case 'AUTRES': return 'Autres';
      default: return type;
    }
  };
  
  // Récupérer l'icône en fonction du type
  const getTypeIcon = (type: TypeEntretien) => {
    switch(type) {
      case 'ENTRETIEN_REGULIER': return <Wrench className="h-4 w-4" />;
      case 'REPARATION': return <FaTools className="h-4 w-4" />;
      case 'REVISION_MOTEUR': return <LiaMotorcycleSolid className="h-4 w-4" />;
      default: return <FaTools className="h-4 w-4" />;
    }
  };
  
  if (compact) {
    return (
      <div
        className={cn(
          "p-3 border rounded-md",
          onClick && "cursor-pointer hover:bg-muted/50 transition-colors"
        )}
        onClick={onClick}
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              {format(maintenanceDate, 'dd/MM/yyyy')}
            </p>
            <p className="text-xs flex items-center">
              {getTypeIcon(maintenance.type)}
              <span className="ml-1">{formatEntretienType(maintenance.type)}</span>
            </p>
            {!hideEntityName && (maintenance.cycle || maintenance.moteur) && (
              <p className="text-xs text-muted-foreground mt-1">
                {maintenance.cycle && (
                  <span>Moto: {maintenance.cycle.numSerie}</span>
                )}
                {maintenance.cycle && maintenance.moteur && (
                  <span> & </span>
                )}
                {maintenance.moteur && (
                  <span>Moteur: {maintenance.moteur.numSerie}</span>
                )}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-medium">{maintenance.coutTotal.toFixed(2)} €</p>
            <p className="text-xs text-muted-foreground">{maintenance.technicien}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Card 
      className={cn(
        onClick && "cursor-pointer hover:bg-muted/50 transition-colors"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">
              {formatEntretienType(maintenance.type)}
            </CardTitle>
            <CardDescription>
              {format(maintenanceDate, 'dd MMMM yyyy', { locale: fr })} - {maintenance.technicien}
            </CardDescription>
          </div>
          <Badge className="flex items-center gap-1">
            {getTypeIcon(maintenance.type)}
            <span>{maintenance.type.replace(/_/g, ' ')}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Kilométrage</span>
            <span className="font-medium">{maintenance.kilometrageEffectue.toFixed(1)} km</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Coût total</span>
            <span className="font-medium">{maintenance.coutTotal.toFixed(2)} €</span>
          </div>
        </div>
        
        {!hideEntityName && (maintenance.cycle || maintenance.moteur) && (
          <>
            <Separator className="my-3" />
            <div className="space-y-2">
              {maintenance.cycle && (
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <span className="text-muted-foreground">Moto:</span> {maintenance.cycle.numSerie}
                    {maintenance.cycle.modele && ` - ${maintenance.cycle.modele}`}
                  </span>
                </div>
              )}
              {maintenance.moteur && (
                <div className="flex items-center gap-2">
                  <LiaMotorcycleSolid className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <span className="text-muted-foreground">Moteur:</span> {maintenance.moteur.numSerie}
                    {maintenance.moteur.type && ` - ${maintenance.moteur.type}`}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
        
        {maintenance.description && (
          <div className="mt-3">
            <p className="text-sm">
              {maintenance.description.substring(0, 100)}
              {maintenance.description.length > 100 && '...'}
            </p>
          </div>
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

export default MaintenancesList;