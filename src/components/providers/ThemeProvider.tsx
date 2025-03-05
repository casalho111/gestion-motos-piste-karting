'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useUIStore } from '@/store/store'

type Theme = 'light' | 'dark' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  attribute?: string
  enableSystem?: boolean
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  attribute = 'class',
  enableSystem = true,
}: ThemeProviderProps) {
  const { theme, setTheme } = useUIStore()
  
  // Synchroniser le thème avec le store
  useEffect(() => {
    const root = window.document.documentElement
    
    if (theme.theme === 'system' && enableSystem) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      
      root.classList.remove('light', 'dark')
      root.classList.add(systemTheme)
      root.style.colorScheme = systemTheme
    } else {
      root.classList.remove('light', 'dark')
      root.classList.add(theme.theme)
      root.style.colorScheme = theme.theme
    }
  }, [theme.theme, enableSystem])
  
  // Surveiller les changements de préférence système
  useEffect(() => {
    if (!enableSystem) return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (theme.theme === 'system') {
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.add(
          mediaQuery.matches ? 'dark' : 'light'
        )
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme.theme, enableSystem])
  
  return <>{children}</>
}