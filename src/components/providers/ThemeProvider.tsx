'use client'

import { useState, useEffect } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type Attribute } from 'next-themes'

// Supprimer la dépendance au store global pour le ThemeProvider
// pour éviter les erreurs d'hydratation et les problèmes d'initialisation

type Theme = 'light' | 'dark' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  attribute?: Attribute
  enableSystem?: boolean
}

export function ThemeProvider({ 
  children,
  defaultTheme = 'system',
  attribute = 'class',
  enableSystem = true
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)
  
  // N'utilisez pas le store directement dans ce composant
  // Cela évite les problèmes de cycle de vie et d'hydratation

  useEffect(() => {
    setMounted(true)
  }, [])

  // Ce rendu fonctionne en SSR et CSR
  return (
    <NextThemesProvider 
      attribute={attribute} 
      defaultTheme={defaultTheme} 
      enableSystem={enableSystem}
    >
      {children}
    </NextThemesProvider>
  )
}