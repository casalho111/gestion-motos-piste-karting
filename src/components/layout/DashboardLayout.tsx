'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { BreadcrumbNavigation } from '@/components/layout/BreadcrumbNavigation'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  
  // Utiliser le store UI existant
  const { 
    sidebarCollapsed, 
    toggleSidebar,
    mobileSidebarOpen,
    toggleMobileSidebar
  } = useUIStore(state => ({
    sidebarCollapsed: state.sidebarCollapsed,
    toggleSidebar: state.toggleSidebar,
    mobileSidebarOpen: state.mobileSidebarOpen,
    toggleMobileSidebar: state.toggleMobileSidebar
  }))
  
  // Fermer le menu mobile quand le chemin change
  useEffect(() => {
    if (mobileSidebarOpen) {
      toggleMobileSidebar()
    }
  }, [pathname, mobileSidebarOpen, toggleMobileSidebar])
  
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header - toujours visible */}
      <Header 
        onMenuClick={toggleMobileSidebar} 
        onToggleSidebar={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />
      
      {/* Navigation mobile - visible uniquement sur mobile quand activée */}
      <MobileNav isOpen={mobileSidebarOpen} onClose={toggleMobileSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - visible sur desktop, caché sur mobile */}
        <Sidebar 
          className={cn(
            "hidden lg:block transition-all duration-300",
            sidebarCollapsed ? "lg:w-20" : "lg:w-64"
          )} 
          collapsed={sidebarCollapsed}
        />
        
        {/* Contenu principal */}
        <div className={cn(
          "flex-1 overflow-auto",
          "transition-all duration-300",
          "pt-4 px-4 pb-8 md:px-6 md:pb-10"
        )}>
          {/* Fil d'Ariane */}
          <BreadcrumbNavigation />
          
          {/* Contenu de la page */}
          <main className="mt-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}