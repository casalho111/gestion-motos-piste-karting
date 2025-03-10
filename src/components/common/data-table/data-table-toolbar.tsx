"use client";

import React from "react";
import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filterableColumns?: {
    id: string;
    title: string;
    options: { label: string; value: string }[];
  }[];
  searchableColumns?: {
    id: string;
    title: string;
  }[];
  enableColumnVisibility?: boolean;
}

/**
 * Barre d'outils pour le DataTable avec recherche et filtres
 */
export function DataTableToolbar<TData>({
  table,
  filterableColumns = [],
  searchableColumns = [],
  enableColumnVisibility = true,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || 
                     table.getState().globalFilter !== "";

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between py-4">
      {/* Recherche et filtres (côté gauche) */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1">
        {/* Champ de recherche globale */}
        {searchableColumns.length > 0 && (
          <Input
            placeholder="Rechercher..."
            value={table.getState().globalFilter || ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="h-9 w-full md:w-[250px] lg:w-[300px]"
          />
        )}

        {/* Filtres par facette */}
        <div className="flex flex-wrap gap-2">
          {filterableColumns.map(({ id, title, options }) => (
            <DataTableFacetedFilter
              key={id}
              column={table.getColumn(id)}
              title={title}
              options={options}
            />
          ))}
        </div>

        {/* Bouton de réinitialisation des filtres */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
            }}
            className="h-9 px-2 lg:px-3"
          >
            <X className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
        )}
      </div>
      
      {/* Options de visibilité des colonnes (côté droit) */}
      {enableColumnVisibility && (
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
        </div>
      )}
    </div>
  );
}