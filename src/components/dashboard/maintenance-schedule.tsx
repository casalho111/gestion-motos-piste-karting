"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/common/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { differenceInDays, format, isSameDay, isAfter, isBefore, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight, Calendar, MoreHorizontal, Plus } from "lucide-react";
import { Criticite, EtatEntite, TypeEntretien } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Interface pour le planning de maintenance
export interface MaintenanceScheduleItem {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: TypeEntretien;
  criticite: Criticite;
  technicien?: string;
  entity: {
    id: string;
    type: "moto" | "moteur";
    name: string;
    etat: EtatEntite;
  };
  isComplete?: boolean;
}

interface MaintenanceScheduleProps {
  items: MaintenanceScheduleItem[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  onAddMaintenance?: () => void;
  onViewItem?: (item: MaintenanceScheduleItem) => void;
  onCompleteItem?: (item: MaintenanceScheduleItem) => void;
  onRescheduleItem?: (item: MaintenanceScheduleItem) => void;
  onViewAll?: () => void;
  maxItems?: number;
  maxHeight?: number | string;
  className?: string;
}

/**
 * MaintenanceSchedule - Planning des maintenances à venir
 * 
 * @param items - Liste des maintenances planifiées
 * @param isLoading - Indique si les données sont en cours de chargement
 * @param title - Titre du composant
 * @param description - Description du composant
 * @param onAddMaintenance - Fonction pour ajouter une maintenance
 * @param onViewItem - Fonction pour voir une maintenance
 * @param onCompleteItem - Fonction pour marquer une maintenance comme terminée
 * @param onRescheduleItem - Fonction pour reporter une maintenance
 * @param onViewAll - Fonction pour voir toutes les maintenances
 * @param maxItems - Nombre maximum d'éléments à afficher
 * @param maxHeight - Hauteur maximale du composant
 * @param className - Classes CSS additionnelles
 */
export function MaintenanceSchedule({
  items,
  isLoading = false,
  title = "Planning de maintenance",
  description = "Prochaines interventions programmées",
  onAddMaintenance,
  onViewItem,
  onCompleteItem,
  onRescheduleItem,
  onViewAll,
  maxItems = 5,
  maxHeight = 400,
  className,
}: MaintenanceScheduleProps) {
  const today = new Date();
  
  // Trier les maintenances par date
  const sortedItems = [...items].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Filtrer les éléments affichés selon maxItems
  const displayedItems = maxItems ? sortedItems.slice(0, maxItems) : sortedItems;
  const hasMoreItems = items.length > maxItems;

  // Obtenir une couleur selon la criticité
  const getCriticiteColor = (criticite: Criticite) => {
    switch (criticite) {
      case "CRITIQUE":
        return "text-destructive";
      case "ELEVEE":
        return "text-red-500";
      case "MOYENNE":
        return "text-amber-500";
      case "FAIBLE":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  // Formater les dates relatives (aujourd'hui, demain, etc.)
  const formatRelativeDate = (date: Date) => {
    const diffDays = differenceInDays(date, today);
    
    if (isSameDay(date, today)) {
      return "Aujourd'hui";
    } else if (isSameDay(date, addDays(today, 1))) {
      return "Demain";
    } else if (diffDays > 0 && diffDays < 7) {
      return format(date, "EEEE", { locale: fr });
    } else {
      return format(date, "d MMMM", { locale: fr });
    }
  };

  // Obtenir un badge pour le type d'entretien
  const getTypeBadge = (type: TypeEntretien) => {
    switch (type) {
      case "ENTRETIEN_REGULIER":
        return <Badge variant="outline">Entretien régulier</Badge>;
      case "REPARATION":
        return <Badge variant="destructive">Réparation</Badge>;
      case "REVISION_MOTEUR":
        return <Badge variant="secondary">Révision moteur</Badge>;
      case "VIDANGE":
        return <Badge variant="outline">Vidange</Badge>;
      case "FREINS":
        return <Badge variant="outline">Freins</Badge>;
      case "PNEUS":
        return <Badge variant="outline">Pneus</Badge>;
      case "TRANSMISSION":
        return <Badge variant="outline">Transmission</Badge>;
      default:
        return <Badge variant="outline">Autre</Badge>;
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              {isLoading ? <Skeleton className="h-6 w-40" /> : title}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs mt-1">
                {isLoading ? <Skeleton className="h-4 w-56" /> : description}
              </CardDescription>
            )}
          </div>
          {onAddMaintenance && !isLoading && (
            <Button size="sm" onClick={onAddMaintenance} className="h-8">
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          )}
        </div>
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
          ) : displayedItems.length === 0 ? (
            <div className="flex items-center justify-center text-center p-6">
              <div>
                <Calendar className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
                <p className="mt-2 text-sm text-muted-foreground">Aucune maintenance planifiée</p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {displayedItems.map((item) => (
                <div 
                  key={item.id}
                  className={cn(
                    "p-4 relative",
                    item.isComplete && "opacity-60 bg-muted/40",
                    isAfter(today, item.date) && !item.isComplete && "bg-red-50 dark:bg-red-950/10"
                  )}
                >
                  <div className="flex items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div 
                          className={cn(
                            "text-sm font-medium flex items-center gap-2",
                            isAfter(today, item.date) && !item.isComplete && "text-destructive"
                          )}
                        >
                          <span>{item.title}</span>
                          {isAfter(today, item.date) && !item.isComplete && (
                            <Badge variant="destructive" className="text-xs">En retard</Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <span className="sr-only">Actions</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {onViewItem && (
                              <DropdownMenuItem onClick={() => onViewItem(item)}>
                                Voir les détails
                              </DropdownMenuItem>
                            )}
                            {onCompleteItem && !item.isComplete && (
                              <DropdownMenuItem onClick={() => onCompleteItem(item)}>
                                Marquer comme terminée
                              </DropdownMenuItem>
                            )}
                            {onRescheduleItem && (
                              <DropdownMenuItem onClick={() => onRescheduleItem(item)}>
                                Reporter
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="mt-1 flex items-center text-xs text-muted-foreground gap-2">
                        <span className={cn(
                          getCriticiteColor(item.criticite),
                          "font-medium"
                        )}>
                          {item.criticite.charAt(0) + item.criticite.slice(1).toLowerCase()}
                        </span>
                        <span>•</span>
                        <span>{getTypeBadge(item.type)}</span>
                      </div>
                      
                      {item.description && (
                        <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                      )}
                      
                      <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                        <div className="flex items-center text-xs">
                          <span className="text-muted-foreground mr-1">
                            {item.entity.type === "moto" ? "Moto:" : "Moteur:"}
                          </span>
                          <span className="font-medium mr-2">{item.entity.name}</span>
                          <StatusBadge status={item.entity.etat} size="sm" />
                        </div>
                        
                        <div className="flex items-center text-xs">
                          <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className={cn(
                            isBefore(item.date, today) && !item.isComplete 
                              ? "text-destructive font-medium" 
                              : "text-muted-foreground"
                          )}>
                            {formatRelativeDate(item.date)} - {format(item.date, "HH:mm")}
                          </span>
                        </div>
                      </div>
                      
                      {item.technicien && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          <span>Technicien assigné: </span>
                          <span className="font-medium">{item.technicien}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      {onViewAll && items.length > 0 && !isLoading && (
        <>
          <Separator />
          <div className="p-2 flex justify-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewAll}
              className="w-full text-xs"
            >
              {hasMoreItems ? `Voir toutes les maintenances (${items.length})` : "Voir toutes les maintenances"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}