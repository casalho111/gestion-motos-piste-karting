'use client'

import { ReactNode, useEffect, useState } from 'react'
import { SideNav } from '@/components/navigation/SideNav'
import { useStoreInitialization } from '@/store/store'
import { Suspense } from 'react'

// Interface pour les props du layout
interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // État pour le suivi de l'initialisation
  const [isLoading, setIsLoading] = useState(true)
  const { initializeStore } = useStoreInitialization()

  useEffect(() => {
    // Initialisation avec un timing plus long pour éviter les problèmes de timing
    const timer = setTimeout(() => {
      initializeStore()
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }, 100)
    
    return () => clearTimeout(timer)
  }, [initializeStore])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Chargement...</h2>
          <p className="text-muted-foreground mt-2">Initialisation du système</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Utiliser Suspense pour chaque composant qui peut causer des erreurs */}
      <Suspense fallback={<div>Chargement du menu...</div>}>
        <SideNav items={[/* votre navigation */]} />
      </Suspense>
      
      <div className="flex-1">
        <Suspense fallback={<div className="p-6">Chargement du contenu...</div>}>
          {children}
        </Suspense>
      </div>
    </div>
  )
}