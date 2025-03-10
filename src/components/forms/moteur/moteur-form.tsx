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

import { moteurFormSchema, defaultMoteurValues, MoteurFormValues } from './schema';
import { createMoteur, updateMoteur } from '@/app/actions/moteurs';

interface MoteurFormProps {
  moteurInitial?: any; // Pour l'édition
  onSuccess?: (data: any) => void;
}

export function MoteurForm({ 
  moteurInitial,
  onSuccess
}: MoteurFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  
  // En mode édition, utilisez les valeurs du moteur existant
  const defaultValues: MoteurFormValues = moteurInitial 
    ? {
        numSerie: moteurInitial.numSerie,
        type: moteurInitial.type,
        cylindree: moteurInitial.cylindree,
        dateAcquisition: new Date(moteurInitial.dateAcquisition),
        kilometrage: moteurInitial.kilometrage,
        heuresMoteur: moteurInitial.heuresMoteur || undefined,
        etat: moteurInitial.etat,
        notesEtat: moteurInitial.notesEtat || '',
      }
    : defaultMoteurValues as MoteurFormValues;

  // Configuration du formulaire avec React Hook Form et Zod
  const form = useForm<MoteurFormValues>({
    resolver: zodResolver(moteurFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Surveiller l'état pour afficher le champ de notes conditionnellement
  const etatActuel = form.watch('etat');
  const modeEdition = !!moteurInitial;

  // Traitement de la soumission du formulaire
  const onSubmit = async (values: MoteurFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      const action = modeEdition 
        ? updateMoteur(moteurInitial.id, values)
        : createMoteur(values);
        
      const result = await action;
      
      if (result.success) {
        toast.success(modeEdition ? "Moteur mis à jour" : "Moteur créé", {
          description: modeEdition 
            ? `Le moteur ${values.numSerie} a été mis à jour avec succès.`
            : `Le moteur ${values.numSerie} a été créé avec succès.`,
        });
        
        if (onSuccess) {
          onSuccess(result.data);
        } else {
          router.push(modeEdition 
            ? `/dashboard/moteurs/${moteurInitial.id}` 
            : `/dashboard/moteurs/${result.data?.id || ''}`
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
      console.error('Erreur lors de l\'enregistrement du moteur:', error);
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
            <CardTitle>{modeEdition ? 'Modifier le moteur' : 'Nouveau moteur'}</CardTitle>
            <CardDescription>
              {modeEdition 
                ? 'Modifiez les informations du moteur' 
                : 'Enregistrez un nouveau moteur dans le système'}
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
                        placeholder="Ex: M125-2023-001"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type de moteur */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de moteur</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="4 temps 125cc">4 temps 125cc</SelectItem>
                        <SelectItem value="4 temps 125cc sport">4 temps 125cc sport</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Cylindrée */}
              <FormField
                control={form.control}
                name="cylindree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cylindrée (cm³)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Cylindrée"
                        disabled={isSubmitting}
                        {...field}
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 125)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                        value={field.value}
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

              {/* Heures moteur (optionnel) */}
              <FormField
                control={form.control}
                name="heuresMoteur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heures moteur (optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.1"
                        placeholder="Heures moteur"
                        disabled={isSubmitting}
                        {...field}
                        value={field.value === undefined ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? undefined : parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            {/* Notes d'état (conditionnellement visible) */}
            {(etatActuel !== EtatEntite.DISPONIBLE || moteurInitial?.notesEtat) && (
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
              {modeEdition ? 'Mettre à jour' : 'Créer le moteur'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}