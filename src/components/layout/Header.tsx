'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, ChevronLeft, ChevronRight, Bell, Search, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserButton } from '@/components/layout/UserButton'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { cn } from '@/lib/utils'
import { CommandMenu } from '@/components/layout/CommandMenu'
import { useAlertStore } from '@/store/alertStore'

interface HeaderProps {
  onMenuClick: () => void
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
}

export function Header({ onMenuClick, onToggleSidebar, sidebarCollapsed }: HeaderProps) {
  // État pour le menu de commandes
  const [isCommandMenuOpen, setCommandMenuOpen] = useState(false)
  
  // Récupérer les alertes non lues
  const unreadCount = useAlertStore(state => state.unreadCount)
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-4">
        {/* Bouton menu mobile */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden" 
          onClick={onMenuClick}
          aria-label="Menu principal"
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        {/* Bouton toggle sidebar sur desktop */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="hidden lg:flex" 
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? "Déplier le menu" : "Replier le menu"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
        
        {/* Titre de l'application visible sur mobile */}
        <Link href="/dashboard" className="lg:hidden">
          <h1 className="text-lg font-bold">Gestion Motos</h1>
        </Link>
      </div>
      
      <div className="flex items-center gap-3">
        {/* Raccourci de recherche */}
        <Button 
          variant="outline" 
          size="sm" 
          className="hidden md:flex items-center gap-2" 
          onClick={() => setCommandMenuOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span>Recherche</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        
        {/* Bouton recherche sur mobile */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden" 
          onClick={() => setCommandMenuOpen(true)}
          aria-label="Recherche"
        >
          <Search className="h-5 w-5" />
        </Button>
        
        {/* Bouton d'alertes */}
        <Button 
          variant="ghost" 
          size="icon" 
          asChild
          aria-label="Alertes"
          className="relative"
        >
          <Link href="/dashboard/alertes">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-xs text-white flex items-center justify-center translate-x-1 -translate-y-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </Button>
        
        {/* Sélecteur de thème */}
        <ThemeToggle />
        
        {/* Bouton utilisateur */}
        <UserButton />
      </div>
      
      {/* Menu de commandes (caché par défaut) */}
      <CommandMenu open={isCommandMenuOpen} onOpenChange={setCommandMenuOpen} />
    </header>
  )
}
