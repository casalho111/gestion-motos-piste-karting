'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, CalendarIcon, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { controleJournalierSchema, defaultControleValues, ControleJournalierFormValues } from './schema';
import { createControle, verifierBesoinControle } from '@/app/actions/controles';
import { getMotoById } from '@/app/actions/motos';
import { getMotos } from '@/app/actions/motos';
import { EtatEntite } from '@prisma/client';

interface ControleJournalierFormProps {
  preSelectedMotoId?: string;
  onSuccess?: (data: any) => void;
}

export function ControleJournalierForm({ 
  preSelectedMotoId,
  onSuccess 
}: ControleJournalierFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [formCompleted, setFormCompleted] = useState(false);
  const [motos, setMotos] = useState<any[]>([]);
  const [motoDetails, setMotoDetails] = useState<any | null>(null);
  const [controleNeeded, setControleNeeded] = useState<boolean | null>(null);
  const [loadingMotos, setLoadingMotos] = useState(false);

  // Initialiser les valeurs par défaut avec l'ID présélectionné
  const defaultValues: Partial<ControleJournalierFormValues> = {
    ...defaultControleValues,
    cycleId: preSelectedMotoId,
  };

  // Configuration du formulaire avec React Hook Form et Zod
  const form = useForm<ControleJournalierFormValues>({
    resolver: zodResolver(controleJournalierSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Observer les changements de l'état de conformité
  const estConforme = form.watch('estConforme');

  // Chargement des motos disponibles
  useEffect(() => {
    async function fetchDisponibleMotos() {
      try {
        setLoadingMotos(true);
        const result = await getMotos({
          etat: EtatEntite.DISPONIBLE,
          limit: 100 // Récupérer toutes les motos disponibles
        });
        
        setMotos(result.data);
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
        setMotoDetails(moto);
        
        // Vérifier si un contrôle est nécessaire
        const besoinControle = await verifierBesoinControle(preSelectedMotoId);
        setControleNeeded(besoinControle.besoinControle);
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
  const onSubmit = async (values: ControleJournalierFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      const result = await createControle(values);
      
      if (result.success) {
        toast.success("Contrôle enregistré", {
          description: "Le contrôle journalier a été enregistré avec succès",
        });
        
        setFormCompleted(true);
        
        if (onSuccess) {
          onSuccess(result.data);
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
          description: result.error || "Une erreur est survenue lors de l'enregistrement du contrôle",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la création du contrôle:', error);
      setServerError("Une erreur inattendue s'est produite. Veuillez réessayer.");
      
      toast.error("Erreur", {
        description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Afficher la confirmation après soumission réussie
  if (formCompleted) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <CardTitle>Contrôle enregistré avec succès</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p>Le contrôle journalier a été enregistré avec succès.</p>
          {motoDetails && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                Moto : <span className="font-medium text-foreground">{motoDetails.numSerie} - {motoDetails.modele}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                État : <span className="font-medium text-foreground">{estConforme ? 'Conforme ✅' : 'Non conforme ❌'}</span>
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            onClick={() => {
              setFormCompleted(false);
              form.reset(defaultControleValues);
              if (preSelectedMotoId) {
                form.setValue('cycleId', preSelectedMotoId);
              }
            }}
            variant="outline"
          >
            Nouveau contrôle
          </Button>
          <Button
            onClick={() => router.push(preSelectedMotoId ? `/dashboard/motos/${preSelectedMotoId}` : '/dashboard/motos')}
          >
            Retour aux motos
          </Button>
        </CardFooter>
      </Card>
    );
  }

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
        
        {controleNeeded === false && preSelectedMotoId && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              Un contrôle journalier a déjà été effectué aujourd'hui pour cette moto.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Informations sur la moto et la date du contrôle
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
                  {preSelectedMotoId && motoDetails && (
                    <FormDescription>
                      Kilométrage actuel: <strong>{motoDetails.kilometrage} km</strong>
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date du contrôle */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date du contrôle</FormLabel>
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

            {/* Nom du contrôleur */}
            <FormField
              control={form.control}
              name="controleur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrôleur</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nom du contrôleur"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>État de conformité</CardTitle>
            <CardDescription>
              Indiquez si la moto est conforme aux standards de sécurité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="estConforme"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>État général</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(value === "true")}
                      defaultValue={field.value ? "true" : "false"}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="true" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer flex items-center">
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                          Conforme aux standards
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="false" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer flex items-center">
                          <XCircle className="mr-2 h-4 w-4 text-red-600" />
                          Non conforme (nécessite une intervention)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vérifications détaillées</CardTitle>
            <CardDescription>
              Vérifiez chaque élément, décochez les éléments non conformes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="freinsAvant"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Freins avant</FormLabel>
                        <FormDescription>
                          Niveau d'usure et fonctionnement
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="freinsArriere"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Freins arrière</FormLabel>
                        <FormDescription>
                          Niveau d'usure et fonctionnement
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pneus"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Pneus</FormLabel>
                        <FormDescription>
                          Pression et état général
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="suspensions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Suspensions</FormLabel>
                        <FormDescription>
                          Débattement et fonctionnement
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transmission"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Transmission</FormLabel>
                        <FormDescription>
                          Chaîne et pignons
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="niveauxFluides"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Niveaux fluides</FormLabel>
                        <FormDescription>
                          Huile, liquide de frein
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eclairage"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 sm:col-span-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Éclairage</FormLabel>
                        <FormDescription>
                          Phares, clignotants et feux de stop
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="autres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Autres vérifications (optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Précisez d'autres vérifications effectuées"
                        disabled={isSubmitting}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commentaires"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {estConforme ? "Commentaires (optionnel)" : "Commentaires sur les problèmes détectés"}
                      {!estConforme && <span className="text-red-500">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={estConforme 
                          ? "Observations générales..." 
                          : "Décrivez les problèmes détectés (obligatoire)"}
                        disabled={isSubmitting}
                        rows={3}
                        {...field}
                        value={field.value || ''}
                        className={!estConforme && !field.value ? "border-red-500" : ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
              Valider le contrôle
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}