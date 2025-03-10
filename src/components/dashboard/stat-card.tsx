"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { cva, type VariantProps } from "class-variance-authority";
import { LucideIcon } from "lucide-react";

// Définition des variants pour le badge de variation
const variationBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        positive: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20",
        negative: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
        neutral: "bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/20",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface StatCardProps extends VariantProps<typeof variationBadgeVariants> {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  variation?: number;
  variationText?: string;
  isLoading?: boolean;
  className?: string;
  valueClassName?: string;
}

/**
 * StatCard - Carte pour afficher une statistique avec variation et icône
 * 
 * @param title - Titre de la statistique
 * @param value - Valeur à afficher
 * @param description - Description optionnelle
 * @param icon - Icône Lucide optionnelle
 * @param iconColor - Couleur de l'icône
 * @param variation - Pourcentage de variation (positif ou négatif)
 * @param variationText - Texte expliquant la variation (ex: "vs dernier mois")
 * @param variant - Style du badge de variation (positive, negative, neutral)
 * @param isLoading - Indique si les données sont en cours de chargement
 * @param className - Classes CSS additionnelles pour la carte
 * @param valueClassName - Classes CSS additionnelles pour la valeur
 */
export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "text-primary",
  variation,
  variationText,
  variant = "neutral",
  isLoading = false,
  className,
  valueClassName,
}: StatCardProps) {
  // Déterminer automatiquement la variant en fonction de la variation si non spécifiée
  if (variation !== undefined && variant === "neutral") {
    if (variation > 0) {
      variant = "positive";
    } else if (variation < 0) {
      variant = "negative";
    }
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {isLoading ? <Skeleton className="h-4 w-24" /> : title}
        </CardTitle>
        {Icon && !isLoading && (
          <div className={cn("rounded-md p-2", iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        {Icon && isLoading && (
          <Skeleton className="h-8 w-8 rounded-md" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoading ? (
            <Skeleton className="h-8 w-28" />
          ) : (
            <span className={valueClassName}>{value}</span>
          )}
        </div>
        {(description || variation !== undefined) && (
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-full" />
            ) : (
              <>
                {variation !== undefined && (
                  <div
                    className={cn(
                      variationBadgeVariants({ variant }),
                      "mr-2"
                    )}
                  >
                    {variation > 0 ? "+" : ""}
                    {variation}%
                  </div>
                )}
                <span>{description || variationText}</span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}