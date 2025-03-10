'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, ArrowLeft, Info } from 'lucide-react';
import { TypeEntretien, EtatEntite } from '@prisma/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from "sonner";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { PieceSelector } from './piece-selector';
import { PiecesList } from './pieces-list';
import { maintenanceFormSchema, defaultMaintenanceValues, MaintenanceFormValues, PieceUtiliseeFormValues } from './schema';
import { createMaintenance } from '@/app/actions/maintenances';
import { getMotoById } from '@/app/actions/motos';
import { getMoteurById } from '@/app/actions/moteurs';

interface MaintenanceFormProps {
  preSelectedCycleId?: string;
  preSelectedMoteurId?: string;
  onSuccess?: (data: any) => void;
}

export function MaintenanceForm({ 
  preSelectedCycleId, 
  preSelectedMoteurId,
  onSuccess
}: MaintenanceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [cycleDetails, setCycleDetails] = useState<any | null>(null);
  const [moteurDetails, setMoteurDetails] = useState<any | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<'cycle' | 'moteur' | 'both'>(
    preSelectedCycleId ? 'cycle' : preSelectedMoteurId ? 'moteur' : 'cycle'
  );
  const [piecesTotalCost, setPiecesTotalCost] = useState(0);
  const [activeTab, setActiveTab] = useState('general');

  // Initialiser les valeurs par défaut avec les IDs présélectionnés
  const defaultValues: Partial<MaintenanceFormValues> = {
    ...defaultMaintenanceValues,
    cycleId: preSelectedCycleId,
    moteurId: preSelectedMoteurId,
  };

  // Configuration du formulaire avec React Hook Form et Zod
  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Récupérer les détails des entités présélectionnées
  useEffect(() => {
    async function fetchPreselectedEntities() {
      try {
        if (preSelectedCycleId) {
          const cycleData = await getMotoById(preSelectedCycleId);
          setCycleDetails(cycleData);
        }
        
        if (preSelectedMoteurId) {
          const moteurData = await getMoteurById(preSelectedMoteurId);
          setMoteurDetails(moteurData);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des détails:', error);
        toast.error("Erreur", {
          description: "Impossible de charger les détails des entités sélectionnées",
        });
      }
    }
    
    fetchPreselectedEntities();
  }, [preSelectedCycleId, preSelectedMoteurId]);

  // Configuration du FieldArray pour les pièces
  const piecesFieldArray = useFieldArray({
    control: form.control,
    name: "piecesUtilisees",
  });

  // Surveiller les changements de type d'entité
  useEffect(() => {
    if (selectedEntityType === 'cycle') {
      form.setValue('moteurId', undefined);
    } else if (selectedEntityType === 'moteur') {
      form.setValue('cycleId', undefined);
    }
  }, [selectedEntityType, form]);

  // Mettre à jour le coût total lorsque les pièces changent
  useEffect(() => {
    form.setValue('coutTotal', piecesTotalCost);
  }, [piecesTotalCost, form]);

  // Extraire la liste des IDs des pièces déjà utilisées
  const selectedPieceIds = piecesFieldArray.fields.map(
    (field) => (field as unknown as PieceUtiliseeFormValues).pieceId
  );

  // Ajouter une pièce à la liste
  const handleAddPiece = (piece: PieceUtiliseeFormValues) => {
    piecesFieldArray.append(piece);
  };

  // Mettre à jour le coût total des pièces
  const handleUpdatePiecesTotal = (total: number) => {
    setPiecesTotalCost(total);
  };

  // Traitement de la soumission du formulaire
  const onSubmit = async (values: MaintenanceFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    
    try {
      const result = await createMaintenance(values);
      
      if (result.success && result.data) {
        toast.success("Maintenance créée", {
          description: "La maintenance a été enregistrée avec succès",
        });
        
        if (onSuccess) {
          onSuccess(result.data);
        } else {
          // Redirection vers la page de détails de la maintenance
          router.push(`/dashboard/maintenances/${result.data.id}`);
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
          description: result.error || "Une erreur est survenue lors de la création de la maintenance",
        });
        
        // Faire défiler vers le premier champ avec une erreur
        const firstError = Object.keys(form.formState.errors)[0];
        if (firstError) {
          const element = document.getElementById(firstError);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.focus();
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la création de la maintenance:', error);
      setServerError("Une erreur inattendue s'est produite. Veuillez réessayer.");
      
      toast.error("Erreur", {
        description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vérification si une entité est en maintenance
  const isEntityInMaintenance = (entity: any) => {
    return entity?.etat === EtatEntite.EN_MAINTENANCE;
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

        <Tabs defaultValue="general" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Informations générales</TabsTrigger>
            <TabsTrigger value="pieces">Pièces utilisées</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6 pt-4">
            {/* Sélection de l'entité concernée */}
            <Card>
              <CardHeader>
                <CardTitle>Entité concernée</CardTitle>
                <CardDescription>
                  Sélectionnez une moto, un moteur ou les deux pour cette maintenance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  defaultValue={selectedEntityType}
                  onValueChange={(value) => setSelectedEntityType(value as 'cycle' | 'moteur' | 'both')}
                  className="grid gap-4 sm:grid-cols-3"
                >
                  <div>
                    <RadioGroupItem value="cycle" id="cycle" className="peer sr-only" />
                    <Label
                      htmlFor="cycle"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <span>Moto uniquement</span>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem value="moteur" id="moteur" className="peer sr-only" />
                                          <Label
                      htmlFor="moteur"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <span>Moteur uniquement</span>
                    </Label>
                  </div>
                  
                  <div>
                    <RadioGroupItem value="both" id="both" className="peer sr-only" />
                    <Label
                      htmlFor="both"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <span>Moto et moteur</span>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Sélection de la moto */}
                {(selectedEntityType === 'cycle' || selectedEntityType === 'both') && (
                  <FormField
                    control={form.control}
                    name="cycleId"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Moto</FormLabel>
                        <Select
                          disabled={isSubmitting || !!preSelectedCycleId}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une moto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Option de moto présélectionnée */}
                            {cycleDetails && (
                              <SelectItem 
                                value={cycleDetails.id}
                                disabled={isEntityInMaintenance(cycleDetails)}
                              >
                                {cycleDetails.numSerie} - {cycleDetails.modele}
                                {isEntityInMaintenance(cycleDetails) && " (En maintenance)"}
                              </SelectItem>
                            )}
                            {/* Ici, vous pourriez ajouter d'autres motos si nécessaire */}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {preSelectedCycleId && cycleDetails && (
                            <span>
                              Kilométrage actuel: <strong>{cycleDetails.kilometrage} km</strong>
                            </span>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Sélection du moteur */}
                {(selectedEntityType === 'moteur' || selectedEntityType === 'both') && (
                  <FormField
                    control={form.control}
                    name="moteurId"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Moteur</FormLabel>
                        <Select
                          disabled={isSubmitting || !!preSelectedMoteurId}
                          value={field.value || ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un moteur" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Option de moteur présélectionné */}
                            {moteurDetails && (
                              <SelectItem 
                                value={moteurDetails.id}
                                disabled={isEntityInMaintenance(moteurDetails)}
                              >
                                {moteurDetails.numSerie} - {moteurDetails.type}
                                {isEntityInMaintenance(moteurDetails) && " (En maintenance)"}
                              </SelectItem>
                            )}
                            {/* Ici, vous pourriez ajouter d'autres moteurs si nécessaire */}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {preSelectedMoteurId && moteurDetails && (
                            <span>
                              Kilométrage actuel: <strong>{moteurDetails.kilometrage} km</strong>
                            </span>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Informations générales de la maintenance */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de maintenance</CardTitle>
                <CardDescription>
                  Détails de l'intervention technique
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type d'entretien</FormLabel>
                      <Select
                        disabled={isSubmitting}
                        value={field.value}
                        onValueChange={(value) => field.onChange(value as TypeEntretien)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type d'entretien" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TypeEntretien.ENTRETIEN_REGULIER}>Entretien régulier</SelectItem>
                          <SelectItem value={TypeEntretien.REPARATION}>Réparation</SelectItem>
                          <SelectItem value={TypeEntretien.REVISION_MOTEUR}>Révision moteur</SelectItem>
                          <SelectItem value={TypeEntretien.VIDANGE}>Vidange</SelectItem>
                          <SelectItem value={TypeEntretien.FREINS}>Freins</SelectItem>
                          <SelectItem value={TypeEntretien.PNEUS}>Pneus</SelectItem>
                          <SelectItem value={TypeEntretien.TRANSMISSION}>Transmission</SelectItem>
                          <SelectItem value={TypeEntretien.AUTRES}>Autres</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="dateRealisation"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date de réalisation</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="kilometrageEffectue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kilométrage à la maintenance</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="Kilométrage"
                            disabled={isSubmitting}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="technicien"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Technicien</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nom du technicien"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Description des travaux</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez les travaux réalisés"
                            disabled={isSubmitting}
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Notes complémentaires (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notes additionnelles"
                            disabled={isSubmitting}
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Coût total</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Le coût total inclut toutes les pièces ajoutées</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="coutTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="Coût total en euros"
                          disabled={isSubmitting}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Total des pièces: {piecesTotalCost.toFixed(2)} €
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setActiveTab('pieces')}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Continuer vers les pièces
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="pieces" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Pièces utilisées</CardTitle>
                <CardDescription>
                  Ajoutez les pièces utilisées pour cette maintenance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PieceSelector
                  onSelect={handleAddPiece}
                  excludeIds={selectedPieceIds}
                  disabled={isSubmitting}
                />
                <Separator className="my-4" />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Pièces sélectionnées</h4>
                  <PiecesList
                    fieldArray={piecesFieldArray}
                    isSubmitting={isSubmitting}
                    onUpdateTotal={handleUpdatePiecesTotal}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <Button
                type="button"
                onClick={() => setActiveTab('general')}
                variant="outline"
                disabled={isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer la maintenance
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}

// Composant Label réutilisable
function Label({ htmlFor, className, children }: { 
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={className}
    >
      {children}
    </label>
  );
}