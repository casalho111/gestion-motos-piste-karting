"use client";

import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableEmptyState } from "./data-table-empty-state";
import { DataTableLoading } from "./data-table-loading";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  error?: string | null;
  showToolbar?: boolean;
  showPagination?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableColumnVisibility?: boolean;
  enablePagination?: boolean;
  pageCount?: number;
  onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void;
  filterableColumns?: {
    id: string;
    title: string;
    options: { label: string; value: string }[];
  }[];
  searchableColumns?: {
    id: string;
    title: string;
  }[];
  className?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
}

/**
 * Composant DataTable - Tableau de données flexible et réutilisable
 * 
 * Basé sur TanStack Table v8 et shadcn/ui.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  error = null,
  showToolbar = true,
  showPagination = true,
  enableSorting = true,
  enableFiltering = true,
  enableColumnVisibility = true,
  enablePagination = true,
  pageCount,
  onPaginationChange,
  filterableColumns = [],
  searchableColumns = [],
  className,
  emptyMessage = "Aucune donnée disponible",
  loadingMessage = "Chargement des données...",
  errorMessage = "Une erreur est survenue lors du chargement des données.",
}: DataTableProps<TData, TValue>) {
  // États pour la gestion des fonctionnalités du tableau
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState<string>("");
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Initialisation du tableau avec TanStack Table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
    },
    enableSorting,
    enableColumnFilters: enableFiltering,
    enableGlobalFilter: enableFiltering,
    enableRowSelection: false, // Désactivé par défaut, peut être activé via les props
    enableMultiRowSelection: false,
    manualPagination: !!onPaginationChange, // Si onPaginationChange est fourni, pagination manuelle
    pageCount: pageCount,
    onPaginationChange: (updater) => {
      // Gérer les changements de pagination
      if (typeof updater === "function") {
        const newPagination = updater(pagination);
        setPagination(newPagination);
        onPaginationChange?.(newPagination);
      } else {
        setPagination(updater);
        onPaginationChange?.(updater);
      }
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: !onPaginationChange ? getPaginationRowModel() : undefined, // Utiliser la pagination intégrée seulement si onPaginationChange n'est pas fourni
  });

  // Rendu conditionnel en fonction de l'état (chargement, erreur, vide)
  if (isLoading) {
    return <DataTableLoading message={loadingMessage} />;
  }

  if (error) {
    return <DataTableEmptyState message={errorMessage} error={error} />;
  }

  if (!data.length) {
    return <DataTableEmptyState message={emptyMessage} />;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Barre d'outils avec filtres, recherche, etc. */}
      {showToolbar && (
        <DataTableToolbar
          table={table}
          filterableColumns={filterableColumns}
          searchableColumns={searchableColumns}
          enableColumnVisibility={enableColumnVisibility}
        />
      )}

      {/* Tableau principal */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center",
                          enableSorting &&
                            header.column.getCanSort() &&
                            "cursor-pointer select-none"
                        )}
                        onClick={
                          enableSorting && header.column.getCanSort()
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination en bas du tableau */}
      {showPagination && enablePagination && (
        <DataTablePagination table={table} />
      )}
    </div>
  );
}