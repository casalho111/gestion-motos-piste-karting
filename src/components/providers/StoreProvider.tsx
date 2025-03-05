'use client'

import { ReactNode, createContext, useEffect, useState } from 'react'
import { useStoreInitialization } from '@/store/store'
import { Loader2, XCircle } from 'lucide-react'

// Contexte pour le statut d'initialisation du store
export const StoreContext = createContext<{
  isInitialized: boolean
  isLoading: boolean
  error: Error | null
}>({
  isInitialized: false,
  isLoading: true,
  error: null
})

interface StoreProviderProps {
  children: ReactNode
}

/**
 * Provider qui initialise le store Zustand et fournit son statut au reste de l'application
 * Utiliser au niveau le plus haut de l'application pour garantir que le store est initialisé
 * avant que les composants enfants ne soient rendus
 */
export function StoreProvider({ children }: StoreProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  // Hook d'initialisation du store
  const { initializeStore } = useStoreInitialization()
  
  // Initialiser le store au montage du composant
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeStore()
        setIsInitialized(true)
      } catch (err) {
        console.error('Erreur lors de l\'initialisation du store:', err)
        setError(err instanceof Error ? err : new Error('Erreur inconnue'))
      } finally {
        setIsLoading(false)
      }
    }
    
    initialize()
  }, [initializeStore])
  
  // Écran de chargement pendant l'initialisation
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-lg font-medium">Chargement du système...</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Initialisation des données
          </p>
        </div>
      </div>
    )
  }
  
  // Écran d'erreur en cas de problème d'initialisation
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
            Erreur d'initialisation
          </h2>
          <p className="mt-2 text-muted-foreground">
            Une erreur est survenue lors de l'initialisation du système.
          </p>
          <p className="mt-4 text-sm border border-border p-2 rounded bg-muted">
            {error.message}
          </p>
          <button
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }
  
  // Tout est prêt, rendre les enfants
  return (
    <StoreContext.Provider value={{ isInitialized, isLoading, error }}>
      {children}
    </StoreContext.Provider>
  )
}