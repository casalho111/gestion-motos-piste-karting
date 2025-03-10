"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { RefreshCw, HelpCircle, DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ResponsiveContainer,
} from "recharts";

interface ChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  onRefresh?: () => void;
  helpText?: string;
  downloadOptions?: {
    onDownloadPNG?: () => void;
    onDownloadCSV?: () => void;
    onDownloadPDF?: () => void;
  };
  className?: string;
  height?: number | string;
  minHeight?: number | string;
  headerAction?: React.ReactNode;
}

/**
 * ChartContainer - Conteneur pour les graphiques Recharts
 * 
 * @param title - Titre du graphique
 * @param description - Description du graphique
 * @param children - Contenu du graphique (composants Recharts)
 * @param isLoading - État de chargement
 * @param onRefresh - Fonction appelée lors d'un rafraîchissement manuel
 * @param helpText - Texte d'aide affiché dans une infobulle
 * @param downloadOptions - Options de téléchargement (PNG, CSV, PDF)
 * @param className - Classes CSS additionnelles
 * @param height - Hauteur du conteneur (défaut: 300px)
 * @param minHeight - Hauteur minimale du conteneur
 * @param headerAction - Action additionnelle dans l'en-tête
 */
export function ChartContainer({
  title,
  description,
  children,
  isLoading = false,
  onRefresh,
  helpText,
  downloadOptions,
  className,
  height = 300,
  minHeight = 200,
  headerAction,
}: ChartContainerProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Réinitialiser l'état de redimensionnement après un court délai
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isResizing) {
      timeoutId = setTimeout(() => setIsResizing(false), 100);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isResizing]);

  // Détecter les changements de taille du conteneur
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setIsResizing(true);
    });

    if (chartRef.current) {
      resizeObserver.observe(chartRef.current);
    }

    return () => {
      if (chartRef.current) {
        resizeObserver.unobserve(chartRef.current);
      }
    };
  }, []);

  // Télécharger le graphique comme PNG
  const handleDownloadPNG = () => {
    if (downloadOptions?.onDownloadPNG) {
      downloadOptions.onDownloadPNG();
    } else if (chartRef.current) {
      try {
        // Utiliser html-to-image ou une autre bibliothèque si nécessaire
        console.log("Téléchargement PNG");
      } catch (error) {
        console.error("Erreur lors du téléchargement en PNG:", error);
      }
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">
            {isLoading ? <Skeleton className="h-6 w-40" /> : title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs mt-1">
              {isLoading ? <Skeleton className="h-4 w-60" /> : description}
            </CardDescription>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {headerAction}
          
          {helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">Aide</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">{helpText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              className="h-8 w-8"
              disabled={isLoading}
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                isLoading && "animate-spin"
              )} />
              <span className="sr-only">Rafraîchir</span>
            </Button>
          )}
          
          {downloadOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <DownloadIcon className="h-4 w-4" />
                  <span className="sr-only">Télécharger</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Télécharger</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadPNG}>
                  Image PNG
                </DropdownMenuItem>
                {downloadOptions.onDownloadCSV && (
                  <DropdownMenuItem onClick={downloadOptions.onDownloadCSV}>
                    Données CSV
                  </DropdownMenuItem>
                )}
                {downloadOptions.onDownloadPDF && (
                  <DropdownMenuItem onClick={downloadOptions.onDownloadPDF}>
                    Document PDF
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent 
        className="p-0 pb-4"
        ref={chartRef}
        style={{ 
          height: typeof height === 'number' ? `${height}px` : height,
          minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight
        }}
      >
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Skeleton className="h-4/5 w-11/12 rounded-md" />
          </div>
        ) : isResizing ? (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Redimensionnement...</p>
          </div>
        ) : (
          React.isValidElement(children) ? (
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <p className="text-sm text-muted-foreground">Contenu invalide</p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}