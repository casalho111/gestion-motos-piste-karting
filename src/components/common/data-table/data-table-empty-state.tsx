"use client";

import React from "react";
import { FileX, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataTableEmptyStateProps {
  message?: string;
  error?: string | null;
  retry?: () => void;
}

/**
 * Composant d'état vide pour le DataTable
 */
export function DataTableEmptyState({ 
  message = "Aucune donnée disponible",
  error = null,
  retry
}: DataTableEmptyStateProps) {
  return (
    <div className="flex h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        {error ? (
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        ) : (
          <FileX className="h-10 w-10 text-muted-foreground mb-4" />
        )}
        
        <h3 className={cn(
          "text-lg font-semibold",
          error ? "text-destructive" : ""
        )}>
          {error ? "Erreur" : "Aucune donnée"}
        </h3>
        
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          {error ? error : message}
        </p>
        
        {retry && (
          <Button onClick={retry} className="mt-2">
            Réessayer
          </Button>
        )}
      </div>
    </div>
  );
}