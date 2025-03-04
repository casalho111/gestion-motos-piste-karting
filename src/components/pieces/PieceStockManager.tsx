'use client';

import React, { useState } from 'react';
import { usePieces, usePiece } from '@/store/hooks';
import { TypePiece } from '@prisma/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  PlusCircle, 
  MinusCircle, 
  Package, 
  AlertTriangle, 
  Search, 
  ShoppingBag, 
  BarChart4 
} from 'lucide-react';

// Type pour une pièce avec des infos supplémentaires pour l'UI
interface PieceWithUIInfo {
  id: string;
  reference: string;
  nom: string;
  description?: string | null;
  type: TypePiece;
  fournisseur?: string | null;
  prixUnitaire: number;
  quantiteStock: number;
  quantiteMinimale: number;
  emplacement?: string | null;
  // Propriétés UI
  isStockLow: boolean;
  isOutOfStock: boolean;
}

// Formulaire pour ajouter/retirer du stock
const AjusterStockForm = ({ 
  pieceId, 
  currentStock, 
  isAjout = true,
  onSuccess, 
  onCancel 
}: { 
  pieceId: string; 
  currentStock: number;
  isAjout?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const { ajusterStock } = usePiece(pieceId);
  const [quantite, setQuantite] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Si c'est un retrait, on convertit la quantité en négatif
      const qtAjustee = isAjout ? quantite : -quantite;
      
      // Vérifier que le stock ne devient pas négatif
      if (!isAjout && quantite > currentStock) {
        toast.error(`Stock insuffisant: ${currentStock} pièces disponibles`);
        return;
      }
      
      const success = await ajusterStock(pieceId, qtAjustee, notes);
      
      if (success) {
        toast.success(`Stock ${isAjout ? 'augmenté' : 'diminué'} de ${quantite} unité(s)`);
        onSuccess();
      } else {
        toast.error('Erreur lors de l\'ajustement du stock');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="quantite">Quantité</Label>
        <Input
          id="quantite"
          type="number"
          min="1"
          value={quantite}
          onChange={(e) => setQuantite(parseInt(e.target.value) || 1)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Raison (optionnel)</Label>
        <Textarea
          id="notes"
          placeholder={isAjout ? "Raison de l'ajout..." : "Raison du retrait..."}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <DialogFooter>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || quantite <= 0}
        >
          {isSubmitting ? 'Enregistrement...' : isAjout ? 'Ajouter au stock' : 'Retirer du stock'}
        </Button>
      </DialogFooter>
    </form>
  );
};

// Composant principal pour la gestion du stock
const PieceStockManager = () => {
  const { 
    pieces, 
    isLoading, 
    filters, 
    setFilters, 
    resetFilters,
    getPiecesStockBas,
    getTotalValeurStock
  } = usePieces();
  
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const [ajoutDialogOpen, setAjoutDialogOpen] = useState(false);
  const [retraitDialogOpen, setRetraitDialogOpen] = useState(false);
  
  // Formater les pièces avec des informations UI supplémentaires
  const piecesWithInfo: PieceWithUIInfo[] = pieces.map(piece => ({
    ...piece,
    isStockLow: piece.quantiteStock <= piece.quantiteMinimale,
    isOutOfStock: piece.quantiteStock === 0
  }));
  
  // Filtrer les pièces avec stock bas
  const piecesStockBas = getPiecesStockBas().map(piece => ({
    ...piece,
    isStockLow: true,
    isOutOfStock: piece.quantiteStock === 0
  }));
  
  // Valeur totale du stock
  const valeurTotaleStock = getTotalValeurStock();
  
  // Traduire le type de pièce
  const getTypeLabel = (type: TypePiece) => {
    switch (type) {
      case 'MOTEUR': return 'Moteur';
      case 'TRANSMISSION': return 'Transmission';
      case 'FREINAGE': return 'Freinage';
      case 'SUSPENSION': return 'Suspension';
      case 'PNEU': return 'Pneu';
      case 'CHASSIS': return 'Châssis';
      case 'FLUIDE': return 'Fluide';
      case 'ELECTRIQUE': return 'Électrique';
      case 'AUTRES': return 'Autres';
      default: return type;
    }
  };
  
  // Gérer la recherche
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };
  
  // Gérer le filtre par type
  const handleTypeChange = (value: string) => {
    setFilters({ type: value ? value as TypePiece : undefined });
  };
  
  // Gérer le filtre de stock bas
  const handleStockBasChange = (checked: boolean) => {
    setFilters({ stockBas: checked });
  };
  
  // Carte individuelle pour une pièce
  const PieceCard = ({ piece }: { piece: PieceWithUIInfo }) => (
    <Card className={piece.isOutOfStock ? 'border-red-300 dark:border-red-800' : piece.isStockLow ? 'border-yellow-300 dark:border-yellow-800' : ''}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{piece.nom}</CardTitle>
          {piece.isOutOfStock && (
            <Badge variant="destructive">Stock épuisé</Badge>
          )}
          {!piece.isOutOfStock && piece.isStockLow && (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
              Stock bas
            </Badge>
          )}
        </div>
        <CardDescription>{piece.reference}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Stock:</span>
              <span className={piece.isOutOfStock ? 'text-red-600 dark:text-red-400 font-bold' : piece.isStockLow ? 'text-yellow-600 dark:text-yellow-400 font-bold' : ''}>
                {piece.quantiteStock} / {piece.quantiteMinimale}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Type:</span>
              <span>{getTypeLabel(piece.type)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Prix:</span>
              <span>{piece.prixUnitaire.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Valeur:</span>
              <span>{(piece.prixUnitaire * piece.quantiteStock).toFixed(2)} €</span>
            </div>
          </div>
        </div>
        
        {piece.emplacement && (
          <div className="mt-2 text-sm">
            <span className="font-medium">Emplacement:</span> {piece.emplacement}
          </div>
        )}
        
        {piece.fournisseur && (
          <div className="mt-1 text-sm">
            <span className="font-medium">Fournisseur:</span> {piece.fournisseur}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Dialog open={piece.id === selectedPieceId && ajoutDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setSelectedPieceId(null);
            setAjoutDialogOpen(false);
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => {
                setSelectedPieceId(piece.id);
                setAjoutDialogOpen(true);
              }}
            >
              <PlusCircle className="h-4 w-4" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter au stock</DialogTitle>
              <DialogDescription>
                Ajouter des exemplaires de {piece.nom} au stock.
              </DialogDescription>
            </DialogHeader>
            
            {piece.id === selectedPieceId && (
              <AjusterStockForm 
                pieceId={piece.id} 
                currentStock={piece.quantiteStock}
                isAjout={true}
                onSuccess={() => {
                  setSelectedPieceId(null);
                  setAjoutDialogOpen(false);
                }}
                onCancel={() => {
                  setSelectedPieceId(null);
                  setAjoutDialogOpen(false);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
        
        <Dialog open={piece.id === selectedPieceId && retraitDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setSelectedPieceId(null);
            setRetraitDialogOpen(false);
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              disabled={piece.isOutOfStock}
              onClick={() => {
                setSelectedPieceId(piece.id);
                setRetraitDialogOpen(true);
              }}
            >
              <MinusCircle className="h-4 w-4" />
              Retirer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Retirer du stock</DialogTitle>
              <DialogDescription>
                Retirer des exemplaires de {piece.nom} du stock.
              </DialogDescription>
            </DialogHeader>
            
            {piece.id === selectedPieceId && (
              <AjusterStockForm 
                pieceId={piece.id} 
                currentStock={piece.quantiteStock}
                isAjout={false}
                onSuccess={() => {
                  setSelectedPieceId(null);
                  setRetraitDialogOpen(false);
                }}
                onCancel={() => {
                  setSelectedPieceId(null);
                  setRetraitDialogOpen(false);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
  
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Gestion du stock</h2>
        <Button asChild className="gap-2">
          <a href="/dashboard/pieces/nouvelle">
            <Package className="h-4 w-4" />
            Nouvelle pièce
          </a>
        </Button>
      </div>
      
      {/* Résumé du stock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valeur du stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{valeurTotaleStock.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">
              {pieces.length} références
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alertes de stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{piecesStockBas.length}</div>
            <p className="text-xs text-muted-foreground">
              {piecesStockBas.filter(p => p.isOutOfStock).length} en rupture
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Valeur moyenne / pièce</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pieces.length > 0 
                ? (valeurTotaleStock / pieces.length).toFixed(2) + " €" 
                : "0.00 €"}
            </div>
            <p className="text-xs text-muted-foreground">
              Prix unitaire moyen
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Onglets et filtres */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Package className="h-4 w-4" />
              Toutes les pièces
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertes de stock
            </TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-8 w-full md:w-[200px]"
                value={filters.search || ''}
                onChange={handleSearchChange}
              />
            </div>
            
            <select
              className="h-9 rounded-md border border-input px-3 py-1 bg-background"
              value={filters.type || ''}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              <option value="">Tous les types</option>
              <option value="MOTEUR">Moteur</option>
              <option value="TRANSMISSION">Transmission</option>
              <option value="FREINAGE">Freinage</option>
              <option value="SUSPENSION">Suspension</option>
              <option value="PNEU">Pneu</option>
              <option value="CHASSIS">Châssis</option>
              <option value="FLUIDE">Fluide</option>
              <option value="ELECTRIQUE">Électrique</option>
              <option value="AUTRES">Autres</option>
            </select>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="stockBas"
                className="h-4 w-4"
                checked={filters.stockBas || false}
                onChange={(e) => handleStockBasChange(e.target.checked)}
              />
              <Label htmlFor="stockBas" className="text-sm cursor-pointer">
                Stock bas uniquement
              </Label>
            </div>
            
            <Button variant="outline" size="sm" onClick={() => resetFilters()}>
              Réinitialiser
            </Button>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : piecesWithInfo.length === 0 ? (
            <div className="bg-muted p-8 rounded-md text-center">
              <h3 className="text-lg font-semibold">Aucune pièce trouvée</h3>
              <p className="text-muted-foreground mt-1">
                Aucune pièce ne correspond aux critères de recherche.
              </p>
              {(filters.search || filters.type || filters.stockBas) && (
                <Button variant="outline" className="mt-4" onClick={() => resetFilters()}>
                  Effacer les filtres
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {piecesWithInfo.map((piece) => (
                <PieceCard key={piece.id} piece={piece} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="alerts" className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : piecesStockBas.length === 0 ? (
            <div className="bg-muted p-8 rounded-md text-center">
              <h3 className="text-lg font-semibold">Aucune alerte de stock</h3>
              <p className="text-muted-foreground mt-1">
                Toutes les pièces ont un niveau de stock suffisant.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {piecesStockBas.map((piece) => (
                <PieceCard key={piece.id} piece={piece} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PieceStockManager;