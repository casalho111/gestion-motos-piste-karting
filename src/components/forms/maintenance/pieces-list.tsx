'use client';

import { useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { UseFieldArrayReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { PieceUtiliseeFormValues } from './schema';

interface PiecesListProps {
  fieldArray: UseFieldArrayReturn<any, "piecesUtilisees", "id">;
  isSubmitting?: boolean;
  onUpdateTotal?: (total: number) => void;
}

export function PiecesList({ fieldArray, isSubmitting = false, onUpdateTotal }: PiecesListProps) {
  const { fields, remove, update } = fieldArray;

  // Calcul du total et notification au parent
  useEffect(() => {
    if (onUpdateTotal) {
      const total = fields.reduce((sum, field) => {
        const piece = field as unknown as PieceUtiliseeFormValues;
        return sum + (piece.quantite * (piece.prixUnitaire || 0));
      }, 0);
      
      onUpdateTotal(total);
    }
  }, [fields, onUpdateTotal]);

  // Mise à jour de la quantité
  const handleQuantityChange = (index: number, value: number) => {
    const field = fields[index] as unknown as PieceUtiliseeFormValues;
    update(index, { ...field, quantite: value });
  };

  // Mise à jour du prix unitaire
  const handlePriceChange = (index: number, value: number) => {
    const field = fields[index] as unknown as PieceUtiliseeFormValues;
    update(index, { ...field, prixUnitaire: value });
  };

  if (fields.length === 0) {
    return (
      <div className="text-center p-4 border rounded-md bg-muted/20">
        <p className="text-sm text-muted-foreground">
          Aucune pièce sélectionnée
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Référence</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead className="text-center">Quantité</TableHead>
            <TableHead className="text-center">Prix unitaire (€)</TableHead>
            <TableHead className="text-right">Total (€)</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => {
            const piece = field as unknown as PieceUtiliseeFormValues;
            const total = piece.quantite * (piece.prixUnitaire || 0);
            
            return (
              <TableRow key={field.id}>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {piece.reference}
                  </Badge>
                </TableCell>
                <TableCell>
                  {piece.nom}
                  {piece.type && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Type: {piece.type}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    value={piece.quantite}
                    onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                    className="w-16 text-center mx-auto"
                    disabled={isSubmitting}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={piece.prixUnitaire}
                    onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                    className="w-20 text-center mx-auto"
                    disabled={isSubmitting}
                  />
                </TableCell>
                <TableCell className="text-right font-medium">
                  {total.toFixed(2)} €
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={isSubmitting}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">Supprimer</span>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}