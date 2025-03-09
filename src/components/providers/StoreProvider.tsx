'use client'

import { useEffect, useState, createContext } from 'react'
import { useStore } from '@/store/store'

// Contexte pour le statut d'initialisation du store
export const StoreContext = createContext({
  isInitialized: false,
  isLoading: true,
  error: null
})

export function StoreProvider({ children }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // En différant la mise à jour de l'état, on évite les erreurs d'hydratation
    const timeout = setTimeout(() => {
      const state = useStore.getState()
      
      // Initialiser les propriétés essentielles avec des valeurs par défaut
      const defaultPagination = { page: 1, limit: 10, total: 0, totalPages: 0 }
      
      useStore.setState({
        motoPagination: defaultPagination,
        moteurPagination: defaultPagination,
        piecePagination: defaultPagination,
        maintenancePagination: defaultPagination,
        planningPagination: defaultPagination,
        alertePagination: defaultPagination,
      })
      
      setIsHydrated(true)
    }, 0)
    
    return () => clearTimeout(timeout)
  }, [])
  
  if (!isHydrated) {
    return <div className="h-screen flex items-center justify-center">Chargement...</div>
  }
  
  return children
}