'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, Calendar, ArrowRight, User, Map } from 'lucide-react';
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

interface Session {
  id: string;
  date: string | Date;
  responsable: string;
  nbTours: number;
  distanceTour: number;
  distanceTotale: number;
  type: string;
  notes?: string;
  cycle?: { numSerie: string; modele: string; id: string };
}

interface SessionsListProps {
  sessions: Session[];
  maxItems?: number;
  hideEntityName?: boolean;
  showPagination?: boolean;
  compact?: boolean;
  className?: string;
}

const SessionsList = ({
  sessions,
  maxItems = 5,
  hideEntityName = false,
  showPagination = false,
  compact = false,
  className
}: SessionsListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  
  if (!sessions || sessions.length === 0) {
    return (
      <div className={cn("text-center text-muted-foreground p-4", className)}>
        Aucune session d'utilisation enregistrée
      </div>
    );
  }

  // Pagination
  const totalPages = showPagination ? Math.ceil(sessions.length / maxItems) : 1;
  const startIndex = showPagination ? (currentPage - 1) * maxItems : 0;
  const visibleSessions = showPagination 
    ? sessions.slice(startIndex, startIndex + maxItems) 
    : sessions.slice(0, maxItems);

  return (
    <div className={className}>
      <div className="space-y-4">
        {visibleSessions.map((session) => (
          <SessionCard 
            key={session.id} 
            session={session} 
            hideEntityName={hideEntityName}
            compact={compact}
            onClick={() => router.push(`/dashboard/utilisations/${session.id}`)}
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

const SessionCard = ({ 
  session, 
  hideEntityName = false,
  compact = false,
  onClick 
}: { 
  session: Session; 
  hideEntityName?: boolean;
  compact?: boolean;
  onClick?: () => void;
}) => {
  const sessionDate = new Date(session.date);
  
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
              {format(sessionDate, 'dd/MM/yyyy')}
            </p>
            {!hideEntityName && session.cycle && (
              <p className="text-xs text-muted-foreground">
                {session.cycle.numSerie} - {session.cycle.modele}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-medium">{session.distanceTotale.toFixed(1)} km</p>
            <p className="text-xs text-muted-foreground">{session.nbTours} tours</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Card 
      className={onClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : undefined}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">
              Session du {format(sessionDate, 'dd MMMM yyyy', { locale: fr })}
            </CardTitle>
            <CardDescription>
              {format(sessionDate, 'HH:mm')} - {session.responsable}
            </CardDescription>
          </div>
          <Badge variant="outline">{session.type.replace('_', ' ')}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{session.nbTours} tours</span>
          </div>
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{session.distanceTotale.toFixed(1)} km</span>
          </div>
        </div>
        
        {!hideEntityName && session.cycle && (
          <>
            <Separator className="my-3" />
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>
                <span className="text-muted-foreground">Moto:</span> {session.cycle.numSerie} - {session.cycle.modele}
              </span>
            </div>
          </>
        )}
        
        {session.notes && (
          <p className="mt-3 text-sm text-muted-foreground">
            {session.notes}
          </p>
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

export default SessionsList;