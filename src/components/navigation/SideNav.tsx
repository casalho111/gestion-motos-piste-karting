"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUIStore } from "@/store/uiStore"
import { cn } from "@/lib/utils"

export function SideNav() {
  // Gestion sécurisée de l'état Zustand
  const isSidebarOpen = useUIStore(state => state.sidebarCollapsed)

  // État local pour gérer le montage client
  const [mounted, setMounted] = useState(false)
  
  // Effet sécurisé pour éviter les mises à jour d'état sur un composant démonté
  useEffect(() => {
    setMounted(true)
    return () => {
      // Pas besoin de mise à jour d'état ici
    }
  }, [])

  // Si pas encore monté, retourner un fallback simple
  if (!mounted) {
    return <div className="w-[240px] h-screen border-r" />
  }

  // Le reste de votre SideNav
  return (
    <div className={cn(
      "fixed top-0 left-0 z-40 h-screen border-r bg-background transition-all duration-300",
      isSidebarOpen ? "w-[240px]" : "w-[60px]"
    )}>
      <ScrollArea className="h-full py-6">
        {/* Le contenu de votre SideNav */}
      </ScrollArea>
    </div>
  )
}