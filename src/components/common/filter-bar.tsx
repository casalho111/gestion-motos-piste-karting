"use client";

import React, { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface FilterOption<T extends string = string> {
  id: string;
  label: string;
  options: Array<{ label: string; value: T } | { label: string; value: null }>;
  selectedValue?: T | null;
}

interface FilterBarProps<T extends string = string> {
  filters: FilterOption<T>[];
  onFilterChange: (filterId: string, value: T | null) => void;
  onResetFilters?: () => void;
  className?: string;
  showActiveFiltersCount?: boolean;
  showResetButton?: boolean;
  responsive?: boolean;
  compact?: boolean;
}

/**
 * Composant FilterBar - Barre de filtres configurable
 * 
 * @param filters - Liste des configurations de filtres
 * @param onFilterChange - Fonction appelée lors du changement d'un filtre
 * @param onResetFilters - Fonction appelée pour réinitialiser tous les filtres
 * @param className - Classes CSS additionnelles
 * @param showActiveFiltersCount - Afficher le nombre de filtres actifs
 * @param showResetButton - Afficher le bouton de réinitialisation
 * @param responsive - Adapter l'affichage en mode responsive
 * @param compact - Version compacte pour les petits écrans
 */
export function FilterBar<T extends string = string>({
  filters,
  onFilterChange,
  onResetFilters,
  className,
  showActiveFiltersCount = true,
  showResetButton = true,
  responsive = true,
  compact = false,
}: FilterBarProps<T>) {
  const [expandedOnMobile, setExpandedOnMobile] = useState(false);
  
  // Nombre de filtres actifs
  const activeFiltersCount = filters.filter(filter => filter.selectedValue !== undefined && filter.selectedValue !== null).length;

  // Réinitialiser l'expansion mobile lors des changements de filtres
  useEffect(() => {
    if (activeFiltersCount === 0) {
      setExpandedOnMobile(false);
    }
  }, [activeFiltersCount]);

  // Gérer le changement de valeur d'un filtre
  const handleFilterChange = (filterId: string, value: string | null) => {
    onFilterChange(filterId, value as T | null);
  };

  // Gérer la réinitialisation des filtres
  const handleReset = () => {
    if (onResetFilters) {
      onResetFilters();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Version mobile avec toggle */}
      {responsive && (
        <div className="flex items-center justify-between md:hidden mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedOnMobile(!expandedOnMobile)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filtres</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          {showResetButton && activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2 text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              Réinitialiser
            </Button>
          )}
        </div>
      )}
      
      {/* Conteneur principal des filtres */}
      <div 
        className={cn(
          "flex flex-col md:flex-row md:items-center gap-2 md:gap-3",
          responsive && !expandedOnMobile && "hidden md:flex",
          responsive && expandedOnMobile && "flex"
        )}
      >
        {/* Étiquette "Filtres" visible sur desktop */}
        {!compact && (
          <div className="hidden md:flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtres</span>
            {showActiveFiltersCount && activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
            <Separator orientation="vertical" className="h-6" />
          </div>
        )}
        
        {/* Liste des filtres */}
        <div className="flex flex-col md:flex-row gap-2">
          {filters.map((filter) => (
            <div key={filter.id} className="flex-1 min-w-[150px]">
              <Select
                value={filter.selectedValue?.toString() || ""}
                onValueChange={(value) => 
                  handleFilterChange(filter.id, value === "" ? null : value)
                }
              >
                <SelectTrigger
                  className={cn(
                    "h-9",
                    compact ? "text-xs" : "text-sm"
                  )}
                >
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem 
                      key={`${option.value || "null"}`} 
                      value={option.value?.toString() || ""}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        
        {/* Bouton de réinitialisation, visible sur desktop */}
        {showResetButton && activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="hidden md:flex items-center gap-1"
          >
            <X className="h-4 w-4 mr-1" />
            <span>Réinitialiser</span>
          </Button>
        )}
      </div>
    </div>
    );
}