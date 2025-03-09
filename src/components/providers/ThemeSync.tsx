// src/components/providers/ThemeSync.tsx
'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useStore } from '@/store/store'

export function ThemeSync() {
  const { theme } = useTheme()
  const setTheme = useStore(state => state.setTheme)
  
  // Synchroniser le thème avec le store quand il change
  useEffect(() => {
    if (theme) {
      setTheme({ theme: theme as 'light' | 'dark' | 'system' })
    }
  }, [theme, setTheme])
  
  return null // Composant invisible
}