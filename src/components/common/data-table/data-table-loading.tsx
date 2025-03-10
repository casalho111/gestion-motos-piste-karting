"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface DataTableLoadingProps {
  message?: string;
}

/**
 * Composant d'état de chargement pour le DataTable
 */
export function DataTableLoading({ 
  message = "Chargement des données..." 
}: DataTableLoadingProps) {
  return (
    <div className="flex h-[400px] shrink-0 items-center justify-center rounded-md border border-dashed">
      <div className="mx-auto flex flex-col items-center justify-center text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}