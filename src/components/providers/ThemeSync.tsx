'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useUIStore } from '@/store/uiStore'

export function ThemeSync() {
  const { theme } = useTheme()
  const setTheme = useUIStore(state => state.setTheme)
  
  // Synchroniser le thème avec le store quand il change
  useEffect(() => {
    if (theme) {
      setTheme(theme as 'light' | 'dark' | 'system')
    }
  }, [theme, setTheme])
  
  return null // Composant invisible
}