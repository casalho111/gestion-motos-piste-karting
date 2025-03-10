"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { EtatEntite } from "@prisma/client";

interface StatusBadgeProps {
  status: EtatEntite;
  size?: "default" | "sm" | "lg";
  className?: string;
}

/**
 * Composant StatusBadge - Affiche un badge coloré selon l'état
 * 
 * @param status - État actuel (EtatEntite)
 * @param size - Taille du badge (default, sm, lg)
 * @param className - Classes CSS additionnelles
 * @returns Un badge avec la couleur correspondant à l'état
 */
export function StatusBadge({ status, size = "default", className }: StatusBadgeProps) {
  // Mapper les états aux variants du badge
  const statusMap: Record<EtatEntite, {
    variant: "disponible" | "maintenance" | "horsService" | "aVerifier" | "indisponible";
    label: string;
  }> = {
    "DISPONIBLE": { variant: "disponible", label: "Disponible" },
    "EN_MAINTENANCE": { variant: "maintenance", label: "En maintenance" },
    "HORS_SERVICE": { variant: "horsService", label: "Hors service" },
    "A_VERIFIER": { variant: "aVerifier", label: "À vérifier" },
    "INDISPONIBLE": { variant: "indisponible", label: "Indisponible" }
  };

  const { variant, label } = statusMap[status] || { variant: "indisponible", label: status };

  return (
    <Badge
      variant={variant}
      size={size}
      className={className}
    >
      {label}
    </Badge>
  );
}

// Variante pour les niveaux de stock
interface StockLevelBadgeProps {
  currentStock: number;
  minStock: number;
  size?: "default" | "sm" | "lg";
  className?: string;
}

/**
 * Composant StockLevelBadge - Affiche un badge coloré selon le niveau de stock
 * 
 * @param currentStock - Stock actuel
 * @param minStock - Stock minimum souhaité
 * @param size - Taille du badge
 * @param className - Classes CSS additionnelles
 * @returns Un badge avec la couleur correspondant au niveau de stock
 */
export function StockLevelBadge({ 
  currentStock, 
  minStock, 
  size = "default", 
  className 
}: StockLevelBadgeProps) {
  // Déterminer le variant et le libellé en fonction du niveau de stock
  let variant: "disponible" | "low" | "critical" | "destructive";
  let label = `${currentStock} en stock`;

  if (currentStock === 0) {
    variant = "destructive";
    label = "Rupture de stock";
  } else if (currentStock <= minStock * 0.5) {
    variant = "critical";
    label = `Critique: ${currentStock}`;
  } else if (currentStock <= minStock) {
    variant = "low";
    label = `Bas: ${currentStock}`;
  } else {
    variant = "disponible";
  }

  return (
    <Badge
      variant={variant}
      size={size}
      className={className}
    >
      {label}
    </Badge>
  );
}