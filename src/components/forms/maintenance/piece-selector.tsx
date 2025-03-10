'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PieceUtiliseeFormValues } from './schema';
import { getPieces } from '@/app/actions/pieces';
import { TypePiece } from '@prisma/client';
import { Skeleton } from '@/components/ui/skeleton';

interface PieceSelectorProps {
  onSelect: (piece: PieceUtiliseeFormValues) => void;
  excludeIds?: string[];
  disabled?: boolean;
}

type Piece = {
  id: string;
  reference: string;
  nom: string;
  type: TypePiece;
  prixUnitaire: number;
  quantiteStock: number;
  quantiteMinimale: number;
};

export function PieceSelector({ onSelect, excludeIds = [], disabled = false }: PieceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [quantite, setQuantite] = useState(1);
  const [prixUnitaire, setPrixUnitaire] = useState<number | undefined>(undefined);

  useEffect(() => {
    async function fetchPieces() {
      setLoading(true);
      try {
        const response = await getPieces({ 
          limit: 100, // Récupérer un nombre suffisant pour le sélecteur 
          search 
        });
        
        // Filtrer les pièces déjà utilisées si nécessaire
        const filteredPieces = response.data.filter((piece: Piece) => 
          !excludeIds.includes(piece.id)
        );
        
        setPieces(filteredPieces);
      } catch (err) {
        console.error('Erreur lors de la récupération des pièces:', err);
        setError('Impossible de charger les pièces');
      } finally {
        setLoading(false);
      }
    }

    fetchPieces();
  }, [search, excludeIds]);

  // Réinitialiser la quantité et le prix unitaire quand une nouvelle pièce est sélectionnée
  useEffect(() => {
    if (selectedPiece) {
      setQuantite(1);
      setPrixUnitaire(selectedPiece.prixUnitaire);
    } else {
      setQuantite(1);
      setPrixUnitaire(undefined);
    }
  }, [selectedPiece]);

  const handleSubmit = () => {
    if (!selectedPiece) return;

    onSelect({
      pieceId: selectedPiece.id,
      nom: selectedPiece.nom,
      reference: selectedPiece.reference,
      type: selectedPiece.type,
      quantite,
      prixUnitaire
    });

    // Réinitialiser le formulaire
    setSelectedPiece(null);
    setQuantite(1);
    setPrixUnitaire(undefined);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedPiece ? (
              <span className="flex items-center gap-2">
                <Badge variant="outline">{selectedPiece.reference}</Badge>
                {selectedPiece.nom}
              </span>
            ) : (
              "Sélectionner une pièce..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput 
                placeholder="Rechercher une pièce..."
                value={search}
                onValueChange={setSearch}
              />
            </div>
            
            {loading ? (
              <div className="p-2 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : error ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {error}
              </div>
            ) : (
              <>
                <CommandEmpty>
                  Aucune pièce trouvée
                </CommandEmpty>
                
                <CommandList>
                  <CommandGroup heading="Pièces disponibles">
                    {pieces.map((piece) => (
                      <CommandItem
                        key={piece.id}
                        value={piece.id}
                        onSelect={() => {
                          setSelectedPiece(piece === selectedPiece ? null : piece);
                        }}
                        disabled={piece.quantiteStock === 0}
                        className={cn(
                          "flex justify-between",
                          piece.quantiteStock < piece.quantiteMinimale && "border-l-4 border-amber-500",
                          piece.quantiteStock === 0 && "opacity-50"
                        )}
                      >
                        <div className="flex flex-col">
                          <span>{piece.nom}</span>
                          <span className="text-xs text-muted-foreground">
                            {piece.reference} - {piece.prixUnitaire.toFixed(2)} €
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={piece.quantiteStock < piece.quantiteMinimale ? "outline" : "secondary"}>
                            Stock: {piece.quantiteStock}
                          </Badge>
                          <Check
                            className={cn(
                              "h-4 w-4",
                              selectedPiece?.id === piece.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {selectedPiece && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quantite">Quantité</Label>
            <Input
              id="quantite"
              type="number"
              min={1}
              max={selectedPiece.quantiteStock}
              value={quantite}
              onChange={(e) => setQuantite(parseInt(e.target.value) || 1)}
              disabled={disabled}
            />
            {selectedPiece.quantiteStock < quantite && (
              <p className="text-xs text-red-500">
                Stock insuffisant (disponible: {selectedPiece.quantiteStock})
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prix">Prix unitaire (€)</Label>
            <Input
              id="prix"
              type="number"
              step="0.01"
              min={0}
              value={prixUnitaire}
              onChange={(e) => setPrixUnitaire(parseFloat(e.target.value) || 0)}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {selectedPiece && (
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedPiece(null)}
            disabled={disabled}
          >
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          
          <Button 
            size="sm" 
            onClick={handleSubmit}
            disabled={
              disabled || 
              !selectedPiece || 
              quantite <= 0 || 
              quantite > selectedPiece.quantiteStock
            }
          >
            Ajouter
          </Button>
        </div>
      )}
    </div>
  );
}