"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ClipboardCheck, Wrench, RotateCcw, Settings, Users, AlertTriangle, ArrowRight } from "lucide-react";

// Types d'activité
export type ActivityType = 
  | "maintenance"
  | "control"
  | "mounting"
  | "session"
  | "stock"
  | "status";

// Interface pour une activité
export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  date: Date;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  entity?: {
    id: string;
    type: "moto" | "moteur" | "piece";
    name: string;
  };
  details?: Record<string, any>;
  href?: string;
}

interface ActivitiesListProps {
  activities: Activity[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  onViewAll?: () => void;
  emptyMessage?: string;
  maxItems?: number;
  maxHeight?: number | string;
  className?: string;
}

/**
 * ActivitiesList - Liste des activités récentes
 * 
 * @param activities - Liste des activités à afficher
 * @param isLoading - Indique si les données sont en cours de chargement
 * @param title - Titre de la liste (défaut: "Activités récentes")
 * @param description - Description de la liste
 * @param onViewAll - Fonction pour voir toutes les activités
 * @param emptyMessage - Message à afficher quand il n'y a pas d'activités
 * @param maxItems - Nombre maximum d'activités à afficher
 * @param maxHeight - Hauteur maximale de la liste
 * @param className - Classes CSS additionnelles
 */
export function ActivitiesList({
  activities,
  isLoading = false,
  title = "Activités récentes",
  description,
  onViewAll,
  emptyMessage = "Aucune activité récente",
  maxItems = 5,
  maxHeight = 400,
  className,
}: ActivitiesListProps) {
  // Fonction pour obtenir l'icône correspondant au type d'activité
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case "maintenance":
        return <Wrench className="h-5 w-5 text-blue-500" />;
      case "control":
        return <ClipboardCheck className="h-5 w-5 text-green-500" />;
      case "mounting":
        return <Settings className="h-5 w-5 text-amber-500" />;
      case "session":
        return <Users className="h-5 w-5 text-indigo-500" />;
      case "stock":
        return <RotateCcw className="h-5 w-5 text-purple-500" />;
      case "status":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Wrench className="h-5 w-5 text-gray-500" />;
    }
  };

  // Filtrer les activités pour n'afficher que les maxItems premières
  const displayedActivities = maxItems ? activities.slice(0, maxItems) : activities;
  const hasMoreActivities = activities.length > maxItems;

  // Formater la date relative (il y a X heures, etc.)
  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: fr
    });
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          {isLoading ? <Skeleton className="h-6 w-40" /> : title}
        </CardTitle>
        {description && (
          <CardDescription className="text-xs mt-1">
            {isLoading ? <Skeleton className="h-4 w-56" /> : description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ 
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight
        }}>
          {isLoading ? (
            <div className="space-y-4 p-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedActivities.length === 0 ? (
            <div className="flex items-center justify-center text-center p-6">
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            </div>
          ) : (
            <div className="relative">
              {/* Ligne verticale de timeline */}
              <div className="absolute left-9 top-0 bottom-0 w-0.5 bg-border"></div>
              
              {displayedActivities.map((activity, index) => (
                <div 
                  key={activity.id}
                  className="relative flex items-start space-x-4 p-4"
                >
                  {/* Cercle du timeline */}
                  <div className="absolute left-9 top-9 w-3 h-3 rounded-full bg-background border-2 border-primary transform -translate-x-1.5"></div>
                  
                  {/* Icône de l'activité */}
                  <div className="relative flex flex-shrink-0 items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  {/* Contenu de l'activité */}
                  <div className="flex-1 min-w-0 pt-1 pb-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline">
                      <p className="text-sm font-medium">
                        {activity.href ? (
                          <a href={activity.href} className="hover:underline">
                            {activity.title}
                          </a>
                        ) : (
                          activity.title
                        )}
                      </p>
                      <span className="text-xs text-muted-foreground sm:ml-2">
                        {formatRelativeTime(activity.date)}
                      </span>
                    </div>
                    
                    {activity.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{activity.description}</p>
                    )}
                    
                    {activity.entity && (
                      <div className="mt-1.5 text-xs">
                        <span className="text-muted-foreground">
                          {activity.entity.type === "moto" 
                            ? "Moto: " 
                            : activity.entity.type === "moteur" 
                              ? "Moteur: " 
                              : "Pièce: "}
                        </span>
                        <span className="font-medium">{activity.entity.name}</span>
                      </div>
                    )}
                    
                    <div className="mt-1 flex items-center text-xs">
                      <span className="flex items-center text-muted-foreground">
                        Par {activity.user.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      {onViewAll && activities.length > 0 && !isLoading && (
        <>
          <Separator />
          <CardFooter className="p-2 flex justify-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewAll}
              className="w-full text-xs"
            >
              {hasMoreActivities ? `Voir toutes les activités (${activities.length})` : "Voir toutes les activités"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}