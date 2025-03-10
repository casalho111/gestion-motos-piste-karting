"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, AlertTriangle, InfoIcon, Clock, Package } from "lucide-react";
import { Criticite } from "@prisma/client";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types d'alerte
export type AlertType = 
  | "maintenance"
  | "stock"
  | "technical" 
  | "info";

// Interface pour une alerte
export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  date: Date;
  criticite: Criticite;
  isRead?: boolean;
  entity?: {
    id: string;
    type: "moto" | "moteur" | "piece";
    name: string;
  };
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

interface AlertsListProps {
  alerts: Alert[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  onViewAll?: () => void;
  onMarkAllAsRead?: () => void;
  emptyMessage?: string;
  maxItems?: number;
  maxHeight?: number | string;
  className?: string;
}

/**
 * AlertsList - Liste des alertes de maintenance, stock, etc.
 * 
 * @param alerts - Liste des alertes à afficher
 * @param isLoading - Indique si les données sont en cours de chargement
 * @param title - Titre de la liste (défaut: "Alertes")
 * @param description - Description de la liste
 * @param onViewAll - Fonction pour voir toutes les alertes
 * @param onMarkAllAsRead - Fonction pour marquer toutes les alertes comme lues
 * @param emptyMessage - Message à afficher quand il n'y a pas d'alertes
 * @param maxItems - Nombre maximum d'alertes à afficher
 * @param maxHeight - Hauteur maximale de la liste
 * @param className - Classes CSS additionnelles
 */
export function AlertsList({
  alerts,
  isLoading = false,
  title = "Alertes",
  description,
  onViewAll,
  onMarkAllAsRead,
  emptyMessage = "Aucune alerte en cours",
  maxItems = 5,
  maxHeight = 400,
  className,
}: AlertsListProps) {
  // Fonction pour obtenir l'icône correspondant au type d'alerte
  const getAlertIcon = (type: AlertType, criticite: Criticite) => {
    switch (type) {
      case "maintenance":
        return criticite === "CRITIQUE" 
          ? <AlertCircle className="h-5 w-5 text-destructive" />
          : <Clock className="h-5 w-5 text-amber-500" />;
      case "stock":
        return <Package className="h-5 w-5 text-amber-500" />;
      case "technical":
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case "info":
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  // Fonction pour obtenir la couleur du badge selon la criticité
  const getAlertBadgeVariant = (criticite: Criticite) => {
    switch (criticite) {
      case "CRITIQUE":
        return "destructive";
      case "ELEVEE":
        return "destructive";
      case "MOYENNE":
        return "secondary";
      case "FAIBLE":
        return "outline";
      default:
        return "outline";
    }
  };

  // Filtrer les alertes pour n'afficher que les maxItems premières
  const displayedAlerts = maxItems ? alerts.slice(0, maxItems) : alerts;
  const hasMoreAlerts = alerts.length > maxItems;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center">
              {isLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <>
                  {title}
                  {alerts.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {alerts.length}
                    </Badge>
                  )}
                </>
              )}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs mt-1">
                {isLoading ? <Skeleton className="h-4 w-48" /> : description}
              </CardDescription>
            )}
          </div>
          {onMarkAllAsRead && alerts.length > 0 && !isLoading && (
            <Button variant="ghost" size="sm" onClick={onMarkAllAsRead} className="h-8 text-xs">
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ 
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight
        }}>
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedAlerts.length === 0 ? (
            <div className="flex items-center justify-center text-center p-6">
              <div>
                <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
                <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {displayedAlerts.map((alert, index) => (
                <div 
                  key={alert.id}
                  className={cn(
                    "flex items-start space-x-3 p-4",
                    alert.isRead && "opacity-60 bg-muted/40"
                  )}
                >
                  <div className="flex-shrink-0 pt-0.5">
                    {getAlertIcon(alert.type, alert.criticite)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate pr-2">{alert.title}</p>
                      <Badge variant={getAlertBadgeVariant(alert.criticite)} className="text-xs">
                        {alert.criticite.charAt(0) + alert.criticite.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    {alert.entity && (
                      <div className="mt-2 flex items-center text-xs">
                        <span className="text-muted-foreground">
                          {alert.entity.type === "moto" 
                            ? "Moto: " 
                            : alert.entity.type === "moteur" 
                              ? "Moteur: " 
                              : "Pièce: "}
                        </span>
                        <span className="font-medium ml-1">{alert.entity.name}</span>
                      </div>
                    )}
                    {alert.action && (
                      <div className="mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={alert.action.onClick}
                          asChild={!!alert.action.href}
                        >
                          {alert.action.href ? (
                            <a href={alert.action.href}>{alert.action.label}</a>
                          ) : (
                            alert.action.label
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      {onViewAll && alerts.length > 0 && !isLoading && (
        <>
          <Separator />
          <CardFooter className="p-2 flex justify-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onViewAll}
              className="w-full text-xs"
            >
              {hasMoreAlerts ? `Voir toutes les alertes (${alerts.length})` : "Voir toutes les alertes"}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}