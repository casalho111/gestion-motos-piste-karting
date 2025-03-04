'use client'

/**
 * Hook pour la gestion des alertes
 * @param fetchAction - Server Action pour récupérer les alertes
 * @param traitementAction - Server Action pour traiter une alerte
 * @returns - État et fonctions pour gérer les alertes
 */
export function useAlertes(
  fetchAction: (params: any) => Promise<ServerActionResult<any>>,
  traitementAction: (params: any) => Promise<ServerActionResult<any>>
) {
  const { page, limit, updateTotal, pagination } = usePagination()
  const { filters, resetFilters, ...filterProps } = useAlerteFilters()
  
  const [alertes, setAlertes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)
  
  const { execute: executeTraitement, isLoading: isTraitement } = useServerAction(traitementAction, {
    successMessage: 'Alerte traitée avec succès',
    revalidatePaths: ['/dashboard/alertes', '/dashboard']
  })
  
  const fetchAlertes = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)
    
    try {
      const result = await fetchAction({
        ...pagination,
        ...filters
      })
      
      if (result.success) {
        setAlertes(result.data.data || [])
        updateTotal(result.data.pagination.total)
      } else {
        setError(result.error || 'Erreur lors de la récupération des alertes')
      }
    } catch (error) {
      setError('Erreur lors de la récupération des alertes')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchAction, pagination, filters, updateTotal])
  
  useEffect(() => {
    fetchAlertes()
  }, [fetchAlertes])
  
  const traiterAlerte = useCallback(async (id: string, utilisateur: string) => {
    return executeTraitement({ id, utilisateur })
  }, [executeTraitement])
  
  const refresh = useCallback(() => {
    fetchAlertes()
  }, [fetchAlertes])
  
  const alertesCritiques = useMemo(() => {
    return alertes.filter(alerte => 
      (alerte.criticite === Criticite.CRITIQUE || alerte.criticite === Criticite.ELEVEE) 
      && !alerte.estTraitee
    )
  }, [alertes])
  
  const getAlertesByType = useCallback((type: string) => {
    return alertes.filter(alerte => alerte.type === type)
  }, [alertes])
  
  return {
    alertes,
    isLoading,
    isTraitement,
    error,
    page,
    limit,
    alertesCritiques,
    traiterAlerte,
    refresh,
    getAlertesByType,
    ...filterProps
  }
}

/**
 * Hook pour la gestion du thème et des préférences UI
 * @returns - État et fonctions pour gérer le thème
 */
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Récupérer le thème depuis localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) return savedTheme as 'light' | 'dark'
      
      // Sinon, détecter la préférence système
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
    }
    
    return 'light'
  })
  
  useEffect(() => {
    // Mettre à jour l'attribut data-theme sur le document
    document.documentElement.setAttribute('data-theme', theme)
    
    // Sauvegarder le thème dans localStorage
    localStorage.setItem('theme', theme)
  }, [theme])
  
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }, [])
  
  return { theme, setTheme, toggleTheme, isDark: theme === 'dark' }
}

/**
 * Hook pour le tableau de bord d'utilisation hebdomadaire
 * @param fetchAction - Server Action pour récupérer les données d'utilisation
 * @returns - État et fonctions pour les données d'utilisation
 */
export function useUtilisationHebdomadaire(
  fetchAction: () => Promise<ServerActionResult<any>>
) {
  const [utilisationData, setUtilisationData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)
  
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)
    
    try {
      const result = await fetchAction()
      
      if (result.success) {
        setUtilisationData(result.data || [])
      } else {
        setError(result.error || 'Erreur lors de la récupération des données d\'utilisation')
      }
    } catch (error) {
      setError('Erreur lors de la récupération des données d\'utilisation')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchAction])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])
  
  // Calculer les statistiques d'utilisation
  const stats = useMemo(() => {
    if (!utilisationData.length) return { total: 0, moyenne: 0, max: 0 }
    
    const total = utilisationData.reduce((sum, day) => sum + (day.distanceTotale || 0), 0)
    const max = Math.max(...utilisationData.map(day => day.distanceTotale || 0))
    const moyenne = total / utilisationData.length
    
    return { total, moyenne, max }
  }, [utilisationData])
  
  return {
    utilisationData,
    isLoading,
    error,
    refresh,
    stats
  }
}

// Hook pour combiner plusieurs server actions en une seule fonction
export function useCombinedServerActions<T = any>(
  actions: Record<string, (params: any) => Promise<ServerActionResult<any>>>,
  options: UseServerActionOptions<T> = {}
) {
  const [status, setStatus] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [isLoading, setIsLoading] = useState(false)
  
  // Initialiser les statuts
  useEffect(() => {
    const initialStatus: Record<string, boolean> = {}
    Object.keys(actions).forEach(key => {
      initialStatus[key] = false
    })
    setStatus(initialStatus)
  }, [actions])
  
  // Fonction pour exécuter toutes les actions en séquence
  const executeAll = useCallback(async (params: Record<string, any>) => {
    setIsLoading(true)
    
    const newResults: Record<string, any> = {}
    const newErrors: Record<string, string | undefined> = {}
    const newStatus: Record<string, boolean> = {}
    
    let hasError = false
    
    for (const [key, action] of Object.entries(actions)) {
      try {
        newStatus[key] = true
        setStatus(prev => ({ ...prev, [key]: true }))
        
        const result = await action(params[key] || {})
        
        if (result.success) {
          newResults[key] = result.data
        } else {
          hasError = true
          newErrors[key] = result.error
        }
        
        newStatus[key] = false
      } catch (error) {
        hasError = true
        newErrors[key] = error instanceof Error ? error.message : 'Erreur inconnue'
        newStatus[key] = false
      }
    }
    
    setResults(newResults)
    setErrors(newErrors)
    setStatus(newStatus)
    setIsLoading(false)
    
    if (hasError) {
      if (options.onError) {
        options.onError('Une ou plusieurs actions ont échoué', [])
      }
      
      if (options.showErrorToast) {
        toast.error('Une ou plusieurs actions ont échoué')
      }
    } else {
      if (options.onSuccess) {
        options.onSuccess(newResults as any)
      }
      
      if (options.showSuccessToast) {
        toast.success(options.successMessage || 'Toutes les actions ont réussi')
      }
      
      if (options.revalidatePaths && options.revalidatePaths.length) {
        const router = useRouter()
        router.refresh()
      }
    }
    
    if (options.onSettled) {
      options.onSettled()
    }
    
    return { success: !hasError, results: newResults, errors: newErrors }
  }, [actions, options])
  
  return {
    executeAll,
    status,
    results,
    errors,
    isLoading
  }
} 

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { EtatEntite, TypeEntretien, TypePiece, TypeUtilisation, Criticite } from '@prisma/client'
import { fr } from 'date-fns/locale'

// Type générique pour les résultats des Server Actions
type ServerActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
  validationErrors?: any[]
}

// Options pour les hooks basés sur les Server Actions
interface UseServerActionOptions<TData = any> {
  onSuccess?: (data: TData) => void
  onError?: (error: string, validationErrors?: any[]) => void
  onSettled?: () => void
  revalidatePaths?: string[]
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
}

/**
 * Hook générique pour appeler une Server Action avec gestion d'état
 * @param action - La Server Action à exécuter
 * @param options - Options pour personnaliser le comportement
 * @returns - État et fonctions pour exécuter l'action
 */
export function useServerAction<TParams, TData>(
  action: (params: TParams) => Promise<ServerActionResult<TData>>,
  options: UseServerActionOptions<TData> = {}
) {
  const {
    onSuccess,
    onError,
    onSettled,
    revalidatePaths,
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'Opération réussie'
  } = options

  const router = useRouter()
  const [data, setData] = useState<TData | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [validationErrors, setValidationErrors] = useState<any[] | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const isMounted = useRef(true)

  // Nettoyer à la désinscription du composant
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const execute = useCallback(
    async (params: TParams): Promise<ServerActionResult<TData>> => {
      setIsLoading(true)
      setError(undefined)
      setValidationErrors(undefined)

      try {
        const result = await action(params)

        if (isMounted.current) {
          if (result.success) {
            setData(result.data)
            
            if (showSuccessToast) {
              toast.success(successMessage)
            }

            if (onSuccess) {
              onSuccess(result.data as TData)
            }

            // Revalider les chemins si spécifiés
            if (revalidatePaths && revalidatePaths.length > 0) {
              router.refresh()
            }
          } else {
            setError(result.error)
            setValidationErrors(result.validationErrors)
            
            if (showErrorToast) {
              toast.error(result.error || 'Une erreur est survenue')
            }

            if (onError) {
              onError(result.error || 'Une erreur est survenue', result.validationErrors)
            }
          }
        }

        return result
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Une erreur inconnue est survenue'
        
        if (isMounted.current) {
          setError(errorMessage)
          
          if (showErrorToast) {
            toast.error(errorMessage)
          }

          if (onError) {
            onError(errorMessage)
          }
        }

        return { success: false, error: errorMessage }
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
          
          if (onSettled) {
            onSettled()
          }
        }
      }
    },
    [action, onSuccess, onError, onSettled, revalidatePaths, router, showSuccessToast, showErrorToast, successMessage]
  )

  const reset = useCallback(() => {
    setData(undefined)
    setError(undefined)
    setValidationErrors(undefined)
  }, [])

  return {
    execute,
    reset,
    data,
    error,
    validationErrors,
    isLoading
  }
}

/**
 * Hook pour gérer la pagination
 * @param initialPage - Page initiale (défaut: 1)
 * @param initialLimit - Limite d'éléments par page (défaut: 10)
 * @returns - État et fonctions pour gérer la pagination
 */
export function usePagination(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [total, setTotal] = useState(0)

  const pageCount = Math.ceil(total / limit)

  const changePage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, pageCount || 1)))
  }, [pageCount])

  const nextPage = useCallback(() => {
    if (page < pageCount) {
      changePage(page + 1)
    }
  }, [page, pageCount, changePage])

  const prevPage = useCallback(() => {
    if (page > 1) {
      changePage(page - 1)
    }
  }, [page, changePage])

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit)
    // Recalculer la page pour éviter les pages vides
    const newPageCount = Math.ceil(total / newLimit)
    if (page > newPageCount) {
      setPage(Math.max(1, newPageCount))
    }
  }, [total, page])

  const updateTotal = useCallback((newTotal: number) => {
    setTotal(newTotal)
  }, [])

  const resetPagination = useCallback(() => {
    setPage(initialPage)
  }, [initialPage])

  return {
    page,
    limit,
    total,
    pageCount,
    setPage: changePage,
    nextPage,
    prevPage,
    changeLimit,
    updateTotal,
    resetPagination,
    pagination: { page, limit }
  }
}

/**
 * Hook pour gérer les filtres des motos
 * @returns - État et fonctions pour gérer les filtres
 */
export function useMotoFilters() {
  const [etat, setEtat] = useState<EtatEntite | ''>('')
  const [modele, setModele] = useState<string>('')
  const [search, setSearch] = useState<string>('')

  const filters = {
    ...(etat && { etat }),
    ...(modele && { modele }),
    ...(search && { search })
  }

  const resetFilters = useCallback(() => {
    setEtat('')
    setModele('')
    setSearch('')
  }, [])

  return {
    filters,
    etat,
    modele,
    search,
    setEtat,
    setModele,
    setSearch,
    resetFilters
  }
}

/**
 * Hook pour gérer les filtres des moteurs
 * @returns - État et fonctions pour gérer les filtres
 */
export function useMoteurFilters() {
  const [etat, setEtat] = useState<EtatEntite | ''>('')
  const [type, setType] = useState<string>('')
  const [estMonte, setEstMonte] = useState<boolean | undefined>(undefined)
  const [search, setSearch] = useState<string>('')

  const filters = {
    ...(etat && { etat }),
    ...(type && { type }),
    ...(estMonte !== undefined && { estMonte }),
    ...(search && { search })
  }

  const resetFilters = useCallback(() => {
    setEtat('')
    setType('')
    setEstMonte(undefined)
    setSearch('')
  }, [])

  return {
    filters,
    etat,
    type,
    estMonte,
    search,
    setEtat,
    setType,
    setEstMonte,
    setSearch,
    resetFilters
  }
}

/**
 * Hook pour gérer les filtres des maintenances
 * @returns - État et fonctions pour gérer les filtres
 */
export function useMaintenanceFilters() {
  const [type, setType] = useState<TypeEntretien | ''>('')
  const [cycleId, setCycleId] = useState<string>('')
  const [moteurId, setMoteurId] = useState<string>('')
  const [dateDebut, setDateDebut] = useState<Date | undefined>(undefined)
  const [dateFin, setDateFin] = useState<Date | undefined>(undefined)

  const filters = {
    ...(type && { type }),
    ...(cycleId && { cycleId }),
    ...(moteurId && { moteurId }),
    ...(dateDebut && { dateDebut }),
    ...(dateFin && { dateFin })
  }

  const resetFilters = useCallback(() => {
    setType('')
    setCycleId('')
    setMoteurId('')
    setDateDebut(undefined)
    setDateFin(undefined)
  }, [])

  return {
    filters,
    type,
    cycleId,
    moteurId,
    dateDebut,
    dateFin,
    setType,
    setCycleId,
    setMoteurId,
    setDateDebut,
    setDateFin,
    resetFilters
  }
}

/**
 * Hook pour gérer les filtres des pièces
 * @returns - État et fonctions pour gérer les filtres
 */
export function usePieceFilters() {
  const [type, setType] = useState<TypePiece | ''>('')
  const [stockBas, setStockBas] = useState<boolean>(false)
  const [search, setSearch] = useState<string>('')

  const filters = {
    ...(type && { type }),
    ...(stockBas && { stockBas }),
    ...(search && { search })
  }

  const resetFilters = useCallback(() => {
    setType('')
    setStockBas(false)
    setSearch('')
  }, [])

  return {
    filters,
    type,
    stockBas,
    search,
    setType,
    setStockBas,
    setSearch,
    resetFilters
  }
}

/**
 * Hook pour gérer les filtres des alertes
 * @returns - État et fonctions pour gérer les filtres
 */
export function useAlerteFilters() {
  const [type, setType] = useState<string>('')
  const [criticite, setCriticite] = useState<Criticite | ''>('')
  const [estTraitee, setEstTraitee] = useState<boolean>(false)
  const [search, setSearch] = useState<string>('')

  const filters = {
    ...(type && { type }),
    ...(criticite && { criticite }),
    estTraitee,
    ...(search && { search })
  }

  const resetFilters = useCallback(() => {
    setType('')
    setCriticite('')
    setEstTraitee(false)
    setSearch('')
  }, [])

  return {
    filters,
    type,
    criticite,
    estTraitee,
    search,
    setType,
    setCriticite,
    setEstTraitee,
    setSearch,
    resetFilters
  }
}

/**
 * Hook pour gérer les données des motos avec pagination et filtres
 * @param fetchAction - Server Action pour récupérer les motos
 * @returns - État et fonctions pour gérer les motos
 */
export function useMotosData(
  fetchAction: (params: any) => Promise<ServerActionResult<any>>
) {
  const { page, limit, updateTotal, resetPagination, pagination } = usePagination()
  const { filters, resetFilters, ...filterProps } = useMotoFilters()
  
  const [motos, setMotos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)

  const fetchMotos = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)

    try {
      const result = await fetchAction({
        ...pagination,
        ...filters
      })

      if (result.success) {
        setMotos(result.data.data || [])
        updateTotal(result.data.pagination.total)
      } else {
        setError(result.error || 'Erreur lors de la récupération des motos')
      }
    } catch (error) {
      setError('Erreur lors de la récupération des motos')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchAction, pagination, filters, updateTotal])

  // Déclencher la récupération des données lorsque les filtres ou la pagination changent
  useEffect(() => {
    fetchMotos()
  }, [fetchMotos])

  const refresh = useCallback(() => {
    fetchMotos()
  }, [fetchMotos])

  const resetAll = useCallback(() => {
    resetFilters()
    resetPagination()
  }, [resetFilters, resetPagination])

  return {
    motos,
    isLoading,
    error,
    page,
    limit,
    refresh,
    resetAll,
    ...filterProps
  }
}

/**
 * Hook pour le formulaire d'utilisation: enregistrement des sessions
 * @param createAction - Server Action pour créer une utilisation
 * @param options - Options supplémentaires
 * @returns - État et fonctions pour le formulaire
 */
export function useUtilisationForm(
  createAction: (params: any) => Promise<ServerActionResult<any>>,
  options: {
    onSuccess?: (data: any) => void;
    cycleId?: string;
  } = {}
) {
  const { onSuccess, cycleId } = options
  
  const initialState = {
    date: new Date(),
    responsable: '',
    nbTours: 0,
    distanceTour: 800,
    type: TypeUtilisation.SESSION_NORMALE,
    notes: '',
    cycleId: cycleId || ''
  }
  
  const [formData, setFormData] = useState(initialState)
  const [distanceTotale, setDistanceTotale] = useState(0)
  
  const { execute, isLoading, error, validationErrors } = useServerAction(createAction, {
    onSuccess: (data) => {
      resetForm()
      if (onSuccess) onSuccess(data)
    },
    successMessage: 'Session enregistrée avec succès'
  })
  
  // Calculer la distance totale lorsque les tours ou la distance changent
  useEffect(() => {
    const { nbTours, distanceTour } = formData
    if (nbTours && distanceTour) {
      setDistanceTotale((nbTours * distanceTour) / 1000) // Conversion en km
    } else {
      setDistanceTotale(0)
    }
  }, [formData.nbTours, formData.distanceTour])
  
  const handleChange = useCallback((name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    await execute(formData)
  }, [execute, formData])
  
  const resetForm = useCallback(() => {
    setFormData(initialState)
  }, [initialState])
  
  return {
    formData,
    distanceTotale,
    isLoading,
    error,
    validationErrors,
    handleChange,
    handleSubmit,
    resetForm
  }
}

/**
 * Hook pour gérer l'état d'un contrôle journalier
 * @param createAction - Server Action pour créer un contrôle journalier
 * @returns - État et fonctions pour le formulaire de contrôle
 */
export function useControleJournalierForm(
  createAction: (params: any) => Promise<ServerActionResult<any>>
) {
  const initialState = {
    date: new Date(),
    controleur: '',
    estConforme: true,
    freinsAvant: true,
    freinsArriere: true,
    pneus: true,
    suspensions: true,
    transmission: true,
    niveauxFluides: true,
    eclairage: true,
    autres: '',
    commentaires: '',
    cycleId: ''
  }
  
  const [formData, setFormData] = useState(initialState)
  
  const { execute, isLoading, error, validationErrors } = useServerAction(createAction, {
    successMessage: 'Contrôle journalier enregistré avec succès'
  })
  
  const handleChange = useCallback((name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])
  
  const toggleVerification = useCallback((name: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [name]: !prev[name as keyof typeof prev],
      // Si un élément est non conforme, le contrôle global n'est pas conforme
      estConforme: name === 'estConforme' 
        ? !prev.estConforme
        : ['freinsAvant', 'freinsArriere', 'pneus', 'suspensions', 'transmission', 'niveauxFluides', 'eclairage'].every(
            item => item === name ? !prev[item as keyof typeof prev] : prev[item as keyof typeof prev]
          )
    }))
  }, [])
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    await execute(formData)
  }, [execute, formData])
  
  const resetForm = useCallback(() => {
    setFormData(initialState)
  }, [initialState])
  
  const setCycleId = useCallback((id: string) => {
    setFormData(prev => ({ ...prev, cycleId: id }))
  }, [])
  
  return {
    formData,
    isLoading,
    error,
    validationErrors,
    handleChange,
    toggleVerification,
    handleSubmit,
    resetForm,
    setCycleId
  }
}

/**
 * Hook pour gérer le montage/démontage des moteurs
 * @param monterAction - Server Action pour monter un moteur
 * @param demonterAction - Server Action pour démonter un moteur
 * @returns - État et fonctions pour les opérations de montage/démontage
 */
export function useMoteurMontage(
  monterAction: (params: any) => Promise<ServerActionResult<any>>,
  demonterAction: (params: any) => Promise<ServerActionResult<any>>
) {
  const initialMontageState = {
    moteurId: '',
    cycleId: '',
    technicien: '',
    date: new Date(),
    notes: ''
  }
  
  const initialDemontageState = {
    cycleId: '',
    technicien: '',
    date: new Date(),
    notes: ''
  }
  
  const [montageData, setMontageData] = useState(initialMontageState)
  const [demontageData, setDemontageData] = useState(initialDemontageState)
  
  const { execute: executeMontage, isLoading: isMontageLoading, error: montageError } = 
    useServerAction(monterAction, {
      successMessage: 'Moteur monté avec succès'
    })
  
  const { execute: executeDemontage, isLoading: isDemontageLoading, error: demontageError } = 
    useServerAction(demonterAction, {
      successMessage: 'Moteur démonté avec succès'
    })
  
  const handleMontageChange = useCallback((name: string, value: any) => {
    setMontageData(prev => ({ ...prev, [name]: value }))
  }, [])
  
  const handleDemontageChange = useCallback((name: string, value: any) => {
    setDemontageData(prev => ({ ...prev, [name]: value }))
  }, [])
  
  const handleMontage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    await executeMontage(montageData)
  }, [executeMontage, montageData])
  
  const handleDemontage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    await executeDemontage(demontageData)
  }, [executeDemontage, demontageData])
  
  const resetMontageForm = useCallback(() => {
    setMontageData(initialMontageState)
  }, [initialMontageState])
  
  const resetDemontageForm = useCallback(() => {
    setDemontageData(initialDemontageState)
  }, [initialDemontageState])
  
  const setCycleForMontage = useCallback((cycleId: string) => {
    setMontageData(prev => ({ ...prev, cycleId }))
  }, [])
  
  const setCycleForDemontage = useCallback((cycleId: string) => {
    setDemontageData(prev => ({ ...prev, cycleId }))
  }, [])
  
  return {
    montageData,
    demontageData,
    isMontageLoading,
    isDemontageLoading,
    montageError,
    demontageError,
    handleMontageChange,
    handleDemontageChange,
    handleMontage,
    handleDemontage,
    resetMontageForm,
    resetDemontageForm,
    setCycleForMontage,
    setCycleForDemontage
  }
}

/**
 * Hook pour gérer les dashboard stats
 * @param fetchAction - Server Action pour récupérer les stats du dashboard
 * @returns - État et fonctions pour les stats
 */
export function useDashboardStats(
  fetchAction: () => Promise<ServerActionResult<any>>
) {
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)
  
  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)
    
    try {
      const result = await fetchAction()
      
      if (result.success) {
        setStats(result.data)
      } else {
        setError(result.error || 'Erreur lors de la récupération des statistiques')
      }
    } catch (error) {
      setError('Erreur lors de la récupération des statistiques')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchAction])
  
  useEffect(() => {
    fetchStats()
    
    // Rafraîchir les stats toutes les 5 minutes
    const interval = setInterval(() => {
      fetchStats()
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [fetchStats])
  
  const refresh = useCallback(() => {
    fetchStats()
  }, [fetchStats])
  
  return {
    stats,
    isLoading,
    error,
    refresh
  }
}

/**
 * Hook pour gérer les formulaires de maintenance
 * @param createAction - Server Action pour créer une maintenance
 * @param options - Options supplémentaires
 * @returns - État et fonctions pour le formulaire
 */
export function useMaintenanceForm(
  createAction: (params: any) => Promise<ServerActionResult<any>>,
  options: {
    onSuccess?: (data: any) => void;
    cycleId?: string;
    moteurId?: string;
  } = {}
) {
  const { onSuccess, cycleId, moteurId } = options
  
  const initialState = {
    type: TypeEntretien.ENTRETIEN_REGULIER,
    dateRealisation: new Date(),
    kilometrageEffectue: 0,
    coutTotal: 0,
    technicien: '',
    description: '',
    notes: '',
    cycleId: cycleId || '',
    moteurId: moteurId || '',
    piecesUtilisees: []
  }
  
  const [formData, setFormData] = useState(initialState)
  const [selectedPieces, setSelectedPieces] = useState<any[]>([])
  
  const { execute, isLoading, error, validationErrors } = useServerAction(createAction, {
    onSuccess: (data) => {
      resetForm()
      if (onSuccess) onSuccess(data)
    },
    successMessage: 'Maintenance enregistrée avec succès'
  })
  
  const handleChange = useCallback((name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Préparer les pièces utilisées au format attendu par l'API
    const piecesUtilisees = selectedPieces.map(p => ({
      pieceId: p.id,
      quantite: p.quantite
    }))
    
    await execute({
      ...formData,
      piecesUtilisees
    })
  }, [execute, formData, selectedPieces])
  
  const resetForm = useCallback(() => {
    setFormData(initialState)
    setSelectedPieces([])
  }, [initialState])
  
  const addPiece = useCallback((piece: any, quantite: number) => {
    setSelectedPieces(prev => {
      // Vérifier si la pièce existe déjà
      const existingIndex = prev.findIndex(p => p.id === piece.id)
      
      if (existingIndex >= 0) {
        // Mettre à jour la quantité
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantite: updated[existingIndex].quantite + quantite
        }
        return updated
      } else {
        // Ajouter la nouvelle pièce
        return [...prev, { ...piece, quantite }]
      }
    })
  }, [])
  
  const removePiece = useCallback((pieceId: string) => {
    setSelectedPieces(prev => prev.filter(p => p.id !== pieceId))
  }, [])
  
  const updatePieceQuantite = useCallback((pieceId: string, quantite: number) => {
    setSelectedPieces(prev => 
      prev.map(p => 
        p.id === pieceId 
          ? { ...p, quantite: Math.max(1, quantite) } 
          : p
      )
    )
  }, [])
  
  const calculateTotalCost = useCallback(() => {
    const piecesTotal = selectedPieces.reduce(
      (sum, piece) => sum + (piece.prixUnitaire * piece.quantite), 
      0
    )
    return piecesTotal + formData.coutTotal
  }, [selectedPieces, formData.coutTotal])
  
  return {
    formData,
    selectedPieces,
    isLoading,
    error,
    validationErrors,
    handleChange,
    handleSubmit,
    resetForm,
    addPiece,
    removePiece,
    updatePieceQuantite,
    calculateTotalCost
  }
}

/**
 * Hook pour la gestion des pièces et du stock
 * @param fetchAction - Server Action pour récupérer les pièces
 * @param adjustStockAction - Server Action pour ajuster le stock
 * @returns - État et fonctions pour gérer les pièces
 */
export function usePieceStock(
  fetchAction: (params: any) => Promise<ServerActionResult<any>>,
  adjustStockAction: (params: any) => Promise<ServerActionResult<any>>
) {
  const { page, limit, updateTotal, pagination } = usePagination()
  const { filters, resetFilters, ...filterProps } = usePieceFilters()
  
  const [pieces, setPieces] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)
  
  const { execute: executeAdjustStock, isLoading: isAdjusting } = useServerAction(adjustStockAction, {
    successMessage: 'Stock ajusté avec succès',
    revalidatePaths: ['/dashboard/pieces']
  })
  
  const fetchPieces = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)
    
    try {
      const result = await fetchAction({
        ...pagination,
        ...filters
      })
      
      if (result.success) {
        setPieces(result.data.data || [])
        updateTotal(result.data.pagination.total)
      } else {
        setError(result.error || 'Erreur lors de la récupération des pièces')
      }
    } catch (error) {
      setError('Erreur lors de la récupération des pièces')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchAction, pagination, filters, updateTotal])
  
  useEffect(() => {
    fetchPieces()
  }, [fetchPieces])
  
  const adjustStock = useCallback(async (id: string, quantite: number, notes?: string) => {
    return executeAdjustStock({ id, quantite, notes })
  }, [executeAdjustStock])
  
  const refresh = useCallback(() => {
    fetchPieces()
  }, [fetchPieces])
  
  const piecesStockBas = useMemo(() => {
    return pieces.filter(piece => piece.quantiteStock <= piece.quantiteMinimale)
  }, [pieces])
  
  const piecesEnRupture = useMemo(() => {
    return pieces.filter(piece => piece.quantiteStock === 0)
  }, [pieces])
  
  const getPiecesByType = useCallback((type: TypePiece) => {
    return pieces.filter(piece => piece.type === type)
  }, [pieces])
  
  const totalStock = useMemo(() => {
    return pieces.reduce((sum, piece) => 
      sum + (piece.quantiteStock * piece.prixUnitaire), 0)
  }, [pieces])
  
  // Memoiser les statistiques de stock par type
  const stockStatsByType = useMemo(() => {
    const stats: Record<TypePiece, { count: number, value: number }> = {} as any
    
    // Initialiser toutes les catégories
    Object.values(TypePiece).forEach(type => {
      stats[type] = { count: 0, value: 0 }
    })
    
    // Calculer les statistiques
    pieces.forEach(piece => {
      const pieceType = piece.type as TypePiece;
      if (pieceType in stats) {
        stats[pieceType].count += piece.quantiteStock;
        stats[pieceType].value += piece.quantiteStock * piece.prixUnitaire;
      }
    })
    
    return stats
  }, [pieces])
  
  return {
    pieces,
    isLoading,
    isAdjusting,
    error,
    page,
    limit,
    piecesStockBas,
    piecesEnRupture,
    adjustStock,
    refresh,
    getPiecesByType,
    totalStock,
    stockStatsByType,
    ...filterProps
  }
}