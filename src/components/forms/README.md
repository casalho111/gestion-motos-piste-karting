# Formulaires pour l'application de gestion des motos de piste

Ce dossier contient tous les formulaires utilisés dans l'application, organisés par entité. Chaque formulaire est constitué d'un schéma de validation (Zod) et d'un composant React qui utilise React Hook Form.

## Structure des dossiers

```
forms/
├── controle/              # Formulaires pour les contrôles journaliers
│   ├── controle-form.tsx  # Composant principal
│   └── schema.ts          # Schéma de validation Zod
├── maintenance/           # Formulaires pour les maintenances
│   ├── maintenance-form.tsx  # Composant principal
│   ├── piece-selector.tsx    # Sélecteur de pièces
│   ├── pieces-list.tsx       # Liste des pièces sélectionnées
│   └── schema.ts             # Schéma de validation Zod
├── moteur/                # Formulaires pour les moteurs
│   ├── moteur-form.tsx    # Composant principal
│   └── schema.ts          # Schéma de validation Zod
├── moto/                  # Formulaires pour les motos
│   ├── moto-form.tsx      # Composant principal
│   └── schema.ts          # Schéma de validation Zod
├── utilisation/           # Formulaires pour les sessions d'utilisation
│   ├── utilisation-form.tsx  # Composant principal
│   └── schema.ts             # Schéma de validation Zod
├── form-factory.tsx       # Factory pour charger dynamiquement les formulaires
├── index.ts               # Point d'entrée pour faciliter l'importation
└── README.md              # Cette documentation
```

## Utilisation des formulaires

### Importation simple

Vous pouvez importer les formulaires directement depuis le point d'entrée :

```tsx
import { MotoForm, MoteurForm, MaintenanceForm, ControleJournalierForm, UtilisationForm } from '@/components/forms';
```

### Utilisation dans une page

Exemple d'utilisation dans une page :

```tsx
'use client';

import { MotoForm } from '@/components/forms';

export default function CreateMotoPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Nouvelle moto</h1>
      <MotoForm />
    </div>
  );
}
```

### Utilisation avec paramètres

Les formulaires acceptent différentes propriétés pour personnaliser leur comportement :

```tsx
<MotoForm 
  motoInitiale={dataFromDatabase} // Pour le mode édition
  onSuccess={(data) => {
    // Traitement personnalisé après soumission réussie
    console.log('Moto créée/mise à jour avec succès:', data);
  }}
/>
```

### Utilisation du FormFactory

Pour un chargement dynamique (utile pour les interfaces à onglets ou les modales), utilisez le FormFactory :

```tsx
import { FormFactory } from '@/components/forms/form-factory';

// Dans votre composant
<FormFactory 
  type="moto" // 'moto', 'moteur', 'maintenance', 'controle', ou 'utilisation'
  entityId="123" // ID de l'entité pour les formulaires qui en ont besoin
  mode="create" // 'create' ou 'edit'
  initialData={entityData} // Données initiales pour le mode édition
  onSuccess={handleSuccess} // Callback après soumission réussie
/>
```

## Validation et gestion des erreurs

Tous les formulaires utilisent Zod pour la validation côté client et côté serveur. Les erreurs sont affichées de manière cohérente :

1. Les erreurs de validation des champs sont affichées sous chaque champ
2. Les erreurs serveur sont affichées en haut du formulaire dans une alerte
3. Des toasts sont utilisés pour les notifications de succès ou d'erreur globale

## Adaptations mobiles

Tous les formulaires sont optimisés pour les appareils mobiles :

- Mise en page responsive (colonnes qui s'empilent sur petit écran)
- Contrôles de taille adaptée pour les interactions tactiles
- États de chargement clairs
- Gestion des erreurs adaptée aux petits écrans

## Personnalisation

Pour étendre ces formulaires :

1. Créez un nouveau dossier pour votre entité
2. Définissez un schéma Zod dans `schema.ts`
3. Créez votre composant de formulaire dans `[nom]-form.tsx`
4. Mettez à jour le barrel file (`index.ts`) pour exporter vos nouveaux composants
5. Si nécessaire, mettez à jour le `form-factory.tsx` pour prendre en charge votre nouveau type de formulaire