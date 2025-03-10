'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, CalendarIcon, CircleOff, CalculatorIcon } from 'lucide-react';
import { TypeUtilisation, EtatEntite } from '@prisma/client';

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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { utilisationFormSchema, defaultUtilisationValues, UtilisationFormValues } from './schema';
import { createUtilisation } from '@/app/actions/utilisations';
import { getMotoById } from '@/app/actions/motos';
import { getMotos } from '@/app/actions/motos';

interface UtilisationFormProps {
  preSelectedMotoId?: string;
  onSuccess?: (data: any) => void;
}

export function UtilisationForm({ 
  preSelectedMotoId,
  onSuccess 
}: UtilisationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [motos, setMotos] = useState<any[]>([]);
  const [motoDetails, setMotoDetails] = useState<any | null>(null);
  const [loadingMotos, setLoadingMotos] = useState(false);
  const [distanceEstimee, setDistanceEstimee] = useState(0);

  // Initialiser les valeurs par défaut avec l'ID présélectionné
  const defaultValues: Partial<UtilisationFormValues> = {
    ...defaultUtilisationValues,
    cycleId: preSelectedMotoId,
  };

  // Configuration du formulaire avec React Hook Form et Zod
  const form = useForm<UtilisationFormValues>({
    resolver: zodResolver(utilisationFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Observer les changements du nombre de tours et de la distance du tour
  const nbTours = form.watch('nbTours');
  const distanceTour = form.watch('distanceTour');

  // Calculer la distance estimée
  useEffect(() => {
    if (nbTours && distanceTour) {
      const distance = (nbTours * distanceTour) / 1000; // Convertir en km
      setDistanceEstimee(distance);
    } else {
      setDistanceEstimee(0);
    }
  }, [nbTours, distanceTour]);

  // Chargement des motos disponibles
  useEffect(() => {
    async function fetchDisponibleMotos() {
      try {
        setLoadingMotos(true);
        // Charger uniquement les motos disponibles avec un moteur monté
        const result = await getMotos({
          etat: EtatEntite.DISPONIBLE,
          limit: 100
        });
        
        // Filtrer pour n'avoir que celles avec un moteur monté
        const motosAvecMoteur = result.data.filter(moto => moto.moteurCourantId);
        setMotos(motosAvecMoteur);
      } catch (error) {
        console.error('Erreur lors de la récupération des motos:', error);
        toast.error("Erreur", {
          description: "Impossible de charger la liste des motos",
        });
      } finally {
        setLoadingMotos(false);
      }
    }
    
    if (!preSelectedMotoId) {
      fetchDisponibleMotos();
    }
  }, [preSelectedMotoId]);

  // Récupérer les détails de la moto présélectionnée
  useEffect(() => {
    async function fetchMotoDetails() {
      if (!preSelectedMotoId) return;
      
      try {
        const moto = await getMotoById(preSelectedMotoId);
        
        // Vérifier si la moto a un moteur monté
        if (!moto.moteurCourantId) {
          toast.warning("Attention", {
            description: "Cette moto n'a pas de moteur monté, elle ne peut pas être utilisée.",
          });
        } else {
          setMotoDetails(moto);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des détails de la moto:', error);
        toast.error("Erreur", {
          description: "Impossible de charger les détails de la moto",
        });
      }
    }
    
    fetchMotoDetails();
  }, [preSelectedMotoId]);

  // Traitement de la soumission du formulaire
  const onSubmit = async (values: UtilisationFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      const result = await createUtilisation(values);
      
      if (result.success) {
        toast.success("Session enregistrée", {
          description: `Session de ${values.nbTours} tours (${distanceEstimee.toFixed(1)} km) enregistrée avec succès`,
        });
        
        if (onSuccess) {
          onSuccess(result.data);
        } else {
          // Redirection ou réinitialisation du formulaire
          // Vous pouvez choisir de garder la moto sélectionnée pour faciliter les entrées multiples
          form.reset({
            ...defaultUtilisationValues,
            cycleId: values.cycleId,
          });
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
          description: result.error || "Une erreur est survenue lors de l'enregistrement de la session",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error);
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
        
        {/* Message d'avertissement si pas de moteur monté */}
        {preSelectedMotoId && motoDetails && !motoDetails.moteurCourantId && (
          <Alert variant="destructive">
            <CircleOff className="h-4 w-4" />
            <AlertDescription>
              Cette moto n'a pas de moteur monté et ne peut pas être utilisée.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Enregistrement d'utilisation</CardTitle>
            <CardDescription>
              Enregistrez une session d'utilisation sur circuit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sélection de la moto */}
            <FormField
              control={form.control}
              name="cycleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moto</FormLabel>
                  <Select
                    disabled={isSubmitting || !!preSelectedMotoId || loadingMotos}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingMotos ? "Chargement..." : "Sélectionner une moto"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {preSelectedMotoId && motoDetails ? (
                        <SelectItem value={motoDetails.id}>
                          {motoDetails.numSerie} - {motoDetails.modele}
                        </SelectItem>
                      ) : (
                        motos.map((moto) => (
                          <SelectItem key={moto.id} value={moto.id}>
                            {moto.numSerie} - {moto.modele}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {field.value && (
                    <FormDescription>
                      {motoDetails ? (
                        <span>
                          Kilométrage actuel: <strong>{motoDetails.kilometrage} km</strong>
                          {motoDetails.moteurCourant && (
                            <> | Moteur: <Badge variant="outline">{motoDetails.moteurCourant.numSerie}</Badge></>
                          )}
                        </span>
                      ) : (
                        <span>Chargement des détails...</span>
                      )}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date de la session */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de la session</FormLabel>
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

            {/* Nom du responsable */}
            <FormField
              control={form.control}
              name="responsable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsable</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nom du responsable de la session"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type d'utilisation */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'utilisation</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as TypeUtilisation)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type d'utilisation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TypeUtilisation.SESSION_NORMALE}>Session normale</SelectItem>
                      <SelectItem value={TypeUtilisation.COURSE}>Course</SelectItem>
                      <SelectItem value={TypeUtilisation.FORMATION}>Formation</SelectItem>
                      <SelectItem value={TypeUtilisation.TEST_TECHNIQUE}>Test technique</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Information sur la distance */}
            <div className="rounded-md bg-muted p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <CalculatorIcon className="h-4 w-4" />
                <span>Calcul de la distance</span>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nbTours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de tours</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="Nombre de tours"
                          disabled={isSubmitting}
                          {...field}
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="distanceTour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance du tour (m)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={100}
                          placeholder="Distance en mètres"
                          disabled={isSubmitting}
                          {...field}
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4 text-right">
                <p className="text-sm">
                  Distance totale : <strong>{distanceEstimee.toFixed(1)} km</strong>
                </p>
                {motoDetails && (
                  <p className="text-xs text-muted-foreground">
                    Nouveau kilométrage estimé : {(motoDetails.kilometrage + distanceEstimee).toFixed(1)} km
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observations, comportement de la moto..."
                      disabled={isSubmitting}
                      rows={2}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              disabled={
                isSubmitting || 
                (preSelectedMotoId && motoDetails && !motoDetails.moteurCourantId) ||
                !form.getValues().cycleId
              }
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer la session
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}