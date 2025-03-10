'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, CalendarIcon } from 'lucide-react';
import { EtatEntite } from '@prisma/client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { motoFormSchema, defaultMotoValues, MotoFormValues } from './schema';
import { createMoto, updateMoto } from '@/app/actions/motos';

interface MotoFormProps {
  motoInitiale?: any; // Pour l'édition
  onSuccess?: (data: any) => void;
}

export function MotoForm({ 
  motoInitiale,
  onSuccess
}: MotoFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  // En mode édition, utilisez les valeurs de la moto existante
  const defaultValues: MotoFormValues = motoInitiale 
    ? {
        numSerie: motoInitiale.numSerie,
        modele: motoInitiale.modele,
        dateAcquisition: new Date(motoInitiale.dateAcquisition),
        etat: motoInitiale.etat,
        notesEtat: motoInitiale.notesEtat || '',
        couleur: motoInitiale.couleur || '',
        kilometrage: motoInitiale.kilometrage,
        moteurCourantId: motoInitiale.moteurCourantId || undefined,
      }
    : defaultMotoValues as MotoFormValues;

  // Configuration du formulaire avec React Hook Form et Zod
  const form = useForm<MotoFormValues>({
    resolver: zodResolver(motoFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Surveiller l'état pour afficher le champ de notes conditionnellement
  const etatActuel = form.watch('etat');
  const modeEdition = !!motoInitiale;

  // Traitement de la soumission du formulaire
  const onSubmit = async (values: MotoFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      const action = modeEdition 
        ? updateMoto(motoInitiale.id, values)
        : createMoto(values);
        
      const result = await action;
      
      if (result.success) {
        toast.success(modeEdition ? "Moto mise à jour" : "Moto créée", {
          description: modeEdition 
            ? `La moto ${values.numSerie} a été mise à jour avec succès.`
            : `La moto ${values.numSerie} a été créée avec succès.`,
        });
        
        if (onSuccess) {
          onSuccess(result.data);
        } else {
          router.push(modeEdition 
            ? `/dashboard/motos/${motoInitiale.id}` 
            : result.data?.id ? `/dashboard/motos/${result.data.id}` : '/dashboard/motos'
          );
          router.refresh();
        }
      } else {
        setServerError(result.error || "Une erreur est survenue");
        
        // Gérer les erreurs de validation spécifiques
        if (result.validationErrors) {
          result.validationErrors.forEach((error) => {
            form.setError(error.path[0] as any, { 
              type: "server", 
              message: error.message 
            });
          });
        }
        
        toast.error("Erreur", {
          description: result.error || "Une erreur est survenue lors de l'enregistrement",
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la moto:', error);
      setServerError("Une erreur inattendue s'est produite. Veuillez réessayer.");
      
      toast.error("Erreur", {
        description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>
              {serverError}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{modeEdition ? 'Modifier la moto' : 'Nouvelle moto'}</CardTitle>
            <CardDescription>
              {modeEdition 
                ? 'Modifiez les informations de la moto' 
                : 'Enregistrez une nouvelle moto dans le système'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Numéro de série */}
              <FormField
                control={form.control}
                name="numSerie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de série</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: YZ125-2023-001"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Modèle */}
              <FormField
                control={form.control}
                name="modele"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modèle</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un modèle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="YZF-R 125">YZF-R 125</SelectItem>
                        <SelectItem value="MT 125">MT 125</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Date d'acquisition */}
              <FormField
                control={form.control}
                name="dateAcquisition"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date d'acquisition</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                            disabled={isSubmitting}
                          >
                            {field.value ? (
                              format(field.value, "dd MMMM yyyy", { locale: fr })
                            ) : (
                              <span>Sélectionner une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Couleur (optionnel) */}
              <FormField
                control={form.control}
                name="couleur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Couleur (optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Bleu Racing"
                        disabled={isSubmitting}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* État */}
              <FormField
                control={form.control}
                name="etat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>État</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as EtatEntite)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un état" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={EtatEntite.DISPONIBLE}>Disponible</SelectItem>
                        <SelectItem value={EtatEntite.EN_MAINTENANCE}>En maintenance</SelectItem>
                        <SelectItem value={EtatEntite.A_VERIFIER}>À vérifier</SelectItem>
                        <SelectItem value={EtatEntite.HORS_SERVICE}>Hors service</SelectItem>
                        <SelectItem value={EtatEntite.INDISPONIBLE}>Indisponible</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Kilométrage */}
              <FormField
                control={form.control}
                name="kilometrage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kilométrage (km)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        placeholder="Kilométrage"
                        disabled={isSubmitting}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      {modeEdition && 'Attention: cette valeur est généralement mise à jour automatiquement'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes d'état (conditionnellement visible) */}
            {(etatActuel !== EtatEntite.DISPONIBLE || motoInitiale?.notesEtat) && (
              <FormField
                control={form.control}
                name="notesEtat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes sur l'état</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Détails sur l'état actuel..."
                        disabled={isSubmitting}
                        rows={3}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modeEdition ? 'Mettre à jour' : 'Créer la moto'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}