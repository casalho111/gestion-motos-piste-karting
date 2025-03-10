"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/status-badge";
import { EtatEntite } from "@prisma/client";
import { Circle, AlertTriangle, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Type pour un emplacement de moto
export interface MotoBay {
  id: string;
  name: string;
  moto?: {
    id: string;
    numSerie: string;
    modele: string;
    kilometrage: number;
    etat: EtatEntite;
    maintenance?: {
      nextDueKm: number;
      nextDueDate?: Date;
    };
  };
}

interface AvailabilityGridProps {
  bays: MotoBay[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  className?: string;
  onClick?: (bay: MotoBay) => void;
}

/**
 * AvailabilityGrid - Grille de disponibilité des motos
 * 
 * @param bays - Liste des emplacements de motos
 * @param isLoading - Indique si les données sont en cours de chargement
 * @param title - Titre du composant
 * @param description - Description du composant
 * @param className - Classes CSS additionnelles
 * @param onClick - Fonction appelée au clic sur un emplacement
 */
export function AvailabilityGrid({
  bays,
  isLoading = false,
  title = "Disponibilité des motos",
  description = "État actuel du parc",
  className,
  onClick,
}: AvailabilityGridProps) {
  // Grouper les emplacements par modèle
  const groupedBays = bays.reduce((acc, bay) => {
    const modele = bay.moto?.modele || "Vide";
    if (!acc[modele]) {
      acc[modele] = [];
    }
    acc[modele].push(bay);
    return acc;
  }, {} as Record<string, MotoBay[]>);

  // Extraire les modèles
  const models = Object.keys(groupedBays);

  // Fonction pour afficher l'état d'entretien
  const renderMaintenanceStatus = (moto: MotoBay['moto']) => {
    if (!moto || !moto.maintenance) return null;
    
    const { nextDueKm, nextDueDate } = moto.maintenance;
    const remainingKm = nextDueKm - moto.kilometrage;
    
    // Icône et couleur en fonction de l'urgence
    let icon = <Circle className="h-3 w-3" />;
    let color = "text-green-500";
    let tooltipText = `Prochain entretien: dans ${remainingKm} km`;
    
    if (remainingKm <= 0) {
      icon = <AlertTriangle className="h-3 w-3" />;
      color = "text-destructive";
      tooltipText = "Entretien dépassé!";
    } else if (remainingKm <= 200) {
      icon = <Clock className="h-3 w-3" />;
      color = "text-amber-500";
      tooltipText = `Entretien imminent: ${remainingKm} km restants`;
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("absolute bottom-1 right-1", color)}>
              {icon}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{tooltipText}</p>
            {nextDueDate && (
              <p className="text-xs">
                Date prévue: {nextDueDate.toLocaleDateString()}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
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
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue={models[0] || "all"}>
            <TabsList className="w-full mb-4">
              {models.map(model => (
                <TabsTrigger key={model} value={model} className="flex-1">
                  {model}
                </TabsTrigger>
              ))}
              {models.length > 1 && (
                <TabsTrigger value="all" className="flex-1">
                  Tous
                </TabsTrigger>
              )}
            </TabsList>
            
            {models.map(model => (
              <TabsContent key={model} value={model}>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {groupedBays[model].map((bay) => (
                    <div
                      key={bay.id}
                      className={cn(
                        "relative p-3 border rounded-md h-24 flex flex-col justify-between",
                        bay.moto ? "cursor-pointer hover:border-primary" : "bg-muted/30",
                        onClick && "cursor-pointer"
                      )}
                      onClick={() => onClick && onClick(bay)}
                    >
                      <div className="text-xs font-medium">{bay.name}</div>
                      {bay.moto ? (
                        <>
                          <div className="text-sm font-semibold mt-1">{bay.moto.numSerie}</div>
                          <div className="mt-auto text-xs text-muted-foreground">
                            {bay.moto.kilometrage.toLocaleString()} km
                          </div>
                          <div className="absolute top-1 right-1">
                            <StatusBadge status={bay.moto.etat} size="sm" />
                          </div>
                          {renderMaintenanceStatus(bay.moto)}
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                          Emplacement vide
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
            
            {models.length > 1 && (
              <TabsContent value="all">
                <div className="space-y-6">
                  {models.map(model => (
                    <div key={model} className="space-y-2">
                      <h3 className="text-sm font-medium">{model}</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {groupedBays[model].map((bay) => (
                          <div
                            key={bay.id}
                            className={cn(
                              "relative p-3 border rounded-md h-24 flex flex-col justify-between",
                              bay.moto ? "cursor-pointer hover:border-primary" : "bg-muted/30",
                              onClick && "cursor-pointer"
                            )}
                            onClick={() => onClick && onClick(bay)}
                          >
                            <div className="text-xs font-medium">{bay.name}</div>
                            {bay.moto ? (
                              <>
                                <div className="text-sm font-semibold mt-1">{bay.moto.numSerie}</div>
                                <div className="mt-auto text-xs text-muted-foreground">
                                  {bay.moto.kilometrage.toLocaleString()} km
                                </div>
                                <div className="absolute top-1 right-1">
                                  <StatusBadge status={bay.moto.etat} size="sm" />
                                </div>
                                {renderMaintenanceStatus(bay.moto)}
                              </>
                            ) : (
                              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                                Emplacement vide
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}