'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Import dynamique des formulaires pour un meilleur fractionnement du code
const MotoForm = dynamic(() => import('./moto/moto-form').then(mod => mod.MotoForm), {
  loading: () => <FormLoadingSkeleton title="Chargement du formulaire de moto..." />
});

const MoteurForm = dynamic(() => import('./moteur/moteur-form').then(mod => mod.MoteurForm), {
  loading: () => <FormLoadingSkeleton title="Chargement du formulaire de moteur..." />
});

const MaintenanceForm = dynamic(() => import('./maintenance/maintenance-form').then(mod => mod.MaintenanceForm), {
  loading: () => <FormLoadingSkeleton title="Chargement du formulaire de maintenance..." />
});

const ControleForm = dynamic(() => import('./controle/controle-form').then(mod => mod.ControleJournalierForm), {
  loading: () => <FormLoadingSkeleton title="Chargement du formulaire de contrôle..." />
});

const UtilisationForm = dynamic(() => import('./utilisation/utilisation-form').then(mod => mod.UtilisationForm), {
  loading: () => <FormLoadingSkeleton title="Chargement du formulaire d'utilisation..." />
});

// Types de formulaires disponibles
export type FormType = 'moto' | 'moteur' | 'maintenance' | 'controle' | 'utilisation';

interface FormFactoryProps {
  type: FormType;
  entityId?: string;
  mode?: 'create' | 'edit';
  initialData?: any;
  onSuccess?: (data: any) => void;
}

/**
 * Factory de formulaires - composant qui charge dynamiquement le formulaire approprié
 * basé sur le type demandé. Utile pour les interfaces à onglets ou modales.
 */
export function FormFactory({ 
  type, 
  entityId, 
  mode = 'create',
  initialData,
  onSuccess 
}: FormFactoryProps) {
  const router = useRouter();
  
  // Redirection après succès (si aucun callback personnalisé n'est fourni)
  const handleSuccess = (data: any) => {
    if (onSuccess) {
      onSuccess(data);
    } else {
      // Redirection par défaut basée sur le type de formulaire
      const routes = {
        moto: `/dashboard/motos/${data.id}`,
        moteur: `/dashboard/moteurs/${data.id}`,
        maintenance: `/dashboard/maintenances/${data.id}`,
        controle: `/dashboard/motos/${entityId || data.cycleId}`,
        utilisation: `/dashboard/motos/${entityId || data.cycleId}`,
      };
      
      router.push(routes[type]);
      router.refresh();
    }
  };
  
  // Rendu du formulaire approprié
  const renderForm = () => {
    switch (type) {
      case 'moto':
        return <MotoForm motoInitiale={initialData} onSuccess={handleSuccess} />;
      
      case 'moteur':
        return <MoteurForm moteurInitial={initialData} onSuccess={handleSuccess} />;
      
      case 'maintenance':
        return (
          <MaintenanceForm 
            preSelectedCycleId={mode === 'create' ? entityId : undefined}
            onSuccess={handleSuccess}
          />
        );
      
      case 'controle':
        return (
          <ControleForm 
            preSelectedMotoId={mode === 'create' ? entityId : undefined}
            onSuccess={handleSuccess}
          />
        );
      
      case 'utilisation':
        return (
          <UtilisationForm 
            preSelectedMotoId={mode === 'create' ? entityId : undefined}
            onSuccess={handleSuccess}
          />
        );
      
      default:
        return <div>Type de formulaire non reconnu</div>;
    }
  };
  
  return renderForm();
}

// Composant de chargement pour les formulaires
function FormLoadingSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {title}
        </CardTitle>
        <CardDescription>Veuillez patienter pendant le chargement du formulaire...</CardDescription>
      </CardHeader>
      <CardContent className="h-96 flex items-center justify-center text-muted-foreground">
        Chargement des composants...
      </CardContent>
    </Card>
  );
}