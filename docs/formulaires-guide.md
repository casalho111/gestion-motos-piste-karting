# Guide des Formulaires avec React Hook Form, Zod et shadcn/UI

Ce document présente l'architecture et les bonnes pratiques utilisées pour implémenter les formulaires dans l'application de gestion de motos de piste. Il sert de référence pour créer de nouveaux formulaires ou modifier les formulaires existants.

## Table des matières

1. [Architecture des formulaires](#architecture-des-formulaires)
2. [Validation avec Zod](#validation-avec-zod)
3. [Gestion des formulaires avec React Hook Form](#gestion-des-formulaires-avec-react-hook-form)
4. [Intégration avec les Server Actions](#intégration-avec-les-server-actions)
5. [Composants réutilisables](#composants-réutilisables)
6. [Accessibilité et UX mobile](#accessibilité-et-ux-mobile)
7. [Modèles de formulaires](#modèles-de-formulaires)
8. [Conseils d'implémentation](#conseils-dimplémentation)

## Architecture des formulaires

Chaque formulaire suit une structure modulaire en trois parties :

1. **Schéma** (`schema.ts`) - Définit le schéma Zod pour la validation et les types TypeScript
2. **Formulaire** (`[nom]-form.tsx`) - Composant principal du formulaire
3. **Composants spécifiques** - Composants additionnels pour les fonctionnalités complexes (ex: `piece-selector.tsx`)

### Structure de dossiers

```
components/
  forms/
    moto/
      schema.ts                 # Schéma Zod et types
      moto-form.tsx             # Composant principal
    maintenance/
      schema.ts                 # Schéma Zod et types
      maintenance-form.tsx      # Composant principal
      piece-selector.tsx        # Composant spécifique
      pieces-list.tsx           # Composant spécifique
    controle/
      schema.ts                 # Schéma Zod et types
      controle-form.tsx         # Composant principal
    utilisation/
      ...
```

## Validation avec Zod

Nous utilisons Zod pour définir des schémas de validation robustes qui sont partagés entre le client et le serveur.

### Bonnes pratiques pour les schémas Zod

1. **Messages d'erreur personnalisés** - Fournir des messages d'erreur clairs et en français
2. **Valeurs par défaut** - Définir des valeurs par défaut pour les champs optionnels
3. **Validations complexes** - Utiliser `refine()` pour des validations dépendant de plusieurs champs
4. **Compatibilité serveur/client** - S'assurer que le schéma client est compatible avec le schéma serveur

### Exemple de schéma Zod

```typescript
// schema.ts
import { z } from "zod";
import { TypeEntretien } from "@prisma/client";

export const maintenanceFormSchema = z.object({
  type: z.nativeEnum(TypeEntretien, {
    required_error: "Le type d'entretien est requis",
  }),
  dateRealisation: z.date({
    required_error: "La date est requise",
  }),
  // ... autres champs
})
.refine(data => data.cycleId || data.moteurId, {
  message: "Vous devez sélectionner au moins une moto ou un moteur",
  path: ["cycleId"],
});

export type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

export const defaultMaintenanceValues: Partial<MaintenanceFormValues> = {
  type: TypeEntretien.ENTRETIEN_REGULIER,
  dateRealisation: new Date(),
  // ... autres valeurs par défaut
};
```

## Gestion des formulaires avec React Hook Form

Nous utilisons React Hook Form avec le resolver Zod pour gérer l'état des formulaires, la validation et la soumission.

### Configuration de base

```typescript
const form = useForm<MaintenanceFormValues>({
  resolver: zodResolver(maintenanceFormSchema),
  defaultValues,
  mode: "onChange", // Valider au changement
});
```

### Utilisation des Field Arrays

Pour les formulaires avec des tableaux (comme la liste des pièces dans MaintenanceForm), utilisez `useFieldArray` :

```typescript
const piecesFieldArray = useFieldArray({
  control: form.control,
  name: "piecesUtilisees",
});

// Utilisation
const { fields, append, remove, update } = piecesFieldArray;
```

## Intégration avec les Server Actions

Les formulaires sont connectés aux Server Actions pour la persistance des données.

### Gestion des erreurs serveur

```typescript
const onSubmit = async (values: FormValues) => {
  setIsSubmitting(true);
  setServerErrors(null);
  
  try {
    const action = await serverAction(values);
    
    if (action.success) {
      // Traitement réussi
      toast({ title: "Succès", description: "..." });
      
      // Redirection ou réinitialisation
      if (onSuccess) {
        onSuccess(action.data);
      } else {
        router.push("/route");
        router.refresh();
      }
    } else {
      // Afficher les erreurs
      setServerErrors(action.error);
      
      // Gérer les erreurs de validation
      if (action.validationErrors) {
        action.validationErrors.forEach((error) => {
          form.setError(error.path[0], { 
            type: "server", 
            message: error.message 
          });
        });
      }
      
      toast({
        title: "Erreur",
        description: action.error,
        variant: "destructive",
      });
    }
  } catch (error) {
    // Gestion des erreurs inattendues
  } finally {
    setIsSubmitting(false);
  }
};
```

## Composants réutilisables

Nous avons développé plusieurs composants réutilisables pour les formulaires complexes.

### PieceSelector

Sélecteur de pièces avec recherche et filtrage pour les formulaires de maintenance.

```tsx
<PieceSelector 
  onSelect={handleAddPiece} 
  excludeIds={selectedPieceIds} 
/>
```

### PiecesList

Liste des pièces sélectionnées avec calcul automatique du total.

```tsx
<PiecesList 
  fieldArray={piecesFieldArray}
  isSubmitting={isSubmitting}
  onUpdateTotal={updateTotalCost}
/>
```

## Accessibilité et UX mobile

Tous les formulaires sont conçus pour être accessibles et optimisés pour les appareils mobiles.

### Accessibilité

- Utilisation des attributs ARIA appropriés
- Labels explicites pour tous les champs
- Messages d'erreur clairs et associés aux champs
- Support de la navigation au clavier

### UX mobile

- Layout responsive avec empilage sur petits écrans
- Contrôles de taille adaptée pour les interactions tactiles
- Adaptations spécifiques aux différentes tailles d'écran
- Feedback visuel clair lors des interactions

```tsx
// Exemple de grid responsive
<div className="grid gap-4 md:grid-cols-2">
  {/* Champs qui s'empilent sur mobile, côte à côte sur desktop */}
</div>
```

## Modèles de formulaires

### Formulaire simple (MotoForm)

Utilisez ce modèle pour les formulaires avec des champs simples sans relations complexes.

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    {/* Champs du formulaire */}
    <FormField
      control={form.control}
      name="field"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    
    {/* Boutons */}
    <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit
      </Button>
    </div>
  </form>
</Form>
```

### Formulaire complexe (MaintenanceForm)

Utilisez ce modèle pour les formulaires avec des relations et des sous-composants.

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    {/* Onglets ou sections */}
    <Tabs>
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      </TabsList>
      
      <TabsContent value="tab1">
        {/* Champs de la première section */}
      </TabsContent>
      
      <TabsContent value="tab2">
        {/* Champs de la deuxième section */}
      </TabsContent>
    </Tabs>
    
    {/* Composants spécifiques */}
    <CustomComponent 
      fieldArray={fieldArray}
      // autres props
    />
    
    {/* Boutons */}
    <div className="flex gap-2 justify-end">
      <Button type="submit">Submit</Button>
    </div>
  </form>
</Form>
```

### Formulaire avec checklist (ControleForm)

Utilisez ce modèle pour les formulaires avec des listes de contrôle.

```tsx
<FormField
  control={form.control}
  name="checkItem"
  render={({ field }) => (
    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
      <FormControl>
        <Checkbox
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </FormControl>
      <div className="space-y-1 leading-none">
        <FormLabel>Label</FormLabel>
        <FormDescription>Description</FormDescription>
      </div>
    </FormItem>
  )}
/>
```

## Conseils d'implémentation

### 1. État de chargement et feedback utilisateur

Toujours montrer un indicateur de chargement pendant la soumission :

```tsx
<Button disabled={isSubmitting}>
  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Enregistrer
</Button>
```

### 2. Validation en temps réel

Utilisez le mode `onChange` pour la validation en temps réel :

```typescript
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues,
  mode: "onChange", // Valider au changement
});
```

### 3. Gestion des erreurs

Afficher clairement les erreurs de validation et les erreurs serveur :

```tsx
{serverErrors && (
  <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
    {serverErrors}
  </div>
)}
```

### 4. Préremplit et initialisation

Utilisez les paramètres d'URL ou les props pour pré-remplir les formulaires :

```tsx
// Dans une page
<MotoForm preSelectedMotoId={searchParams.motoId} />

// Dans le composant
const defaultValues = {
  ...defaultValues,
  cycleId: preSelectedMotoId || "",
};
```

### 5. Optimisation des performances

Pour les formulaires complexes, évitez les rendus inutiles :

```tsx
// Surveiller uniquement les champs nécessaires
const watchField = form.watch("field");

// Utiliser useEffect pour des effets secondaires
useEffect(() => {
  // Faire quelque chose quand watchField change
}, [watchField]);
```

### 6. Confirmation après soumission

Pour les formulaires utilisés fréquemment (comme ControleForm), affichez une confirmation après la soumission :

```tsx
if (formCompleted) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Formulaire soumis avec succès</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setFormCompleted(false)}>
          Nouveau formulaire
        </Button>
      </CardContent>
    </Card>
  );
}
```

## Conclusion

Cette architecture de formulaires garantit une expérience utilisateur cohérente, une validation robuste et une bonne intégration avec le reste de l'application. En suivant ces principes, vous pouvez facilement ajouter de nouveaux formulaires ou modifier ceux existants.

Pour les formulaires restants (UtilisationForm et MoteurForm), appliquez ces mêmes patterns en adaptant les spécificités à chaque cas d'utilisation.