'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { UtilisationForm } from '@/components/forms';
import { Skeleton } from '@/components/ui/skeleton';

// Exemple d'utilisation dans une page
export default function AjouterSessionPage() {
  const params = useParams();
  const id = params.id as string;
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full" 
          asChild
        >
          <a href={`/dashboard/motos/${id}`}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Retour</span>
          </a>
        </Button>
        <h1 className="text-2xl font-bold">Enregistrer une session</h1>
      </div>
      
      <Suspense fallback={<FormSkeleton />}>
        <UtilisationForm preSelectedMotoId={id} />
      </Suspense>
    </div>
  );
}

// Composant de chargement
function FormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}