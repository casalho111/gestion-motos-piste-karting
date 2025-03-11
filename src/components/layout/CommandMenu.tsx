'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator
} from '@/components/ui/command'
import { 
  LayoutDashboard, 
  Bike, 
  Cog, 
  Wrench, 
  Package, 
  FileCheck, 
  Clock,
  Settings,
  BarChart3,
  Bell,
  PlusCircle,
  Home,
  Search
} from 'lucide-react'

interface CommandMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter()
  
  // Raccourcis clavier pour ouvrir le menu
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])
  
  // Définition des options de navigation principales
  const navigationCommands = [
    {
      label: "Tableau de bord",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      href: "/dashboard",
      keywords: "accueil, dashboard, tableau, apercu"
    },
    {
      label: "Motos",
      icon: <Bike className="mr-2 h-4 w-4" />,
      href: "/dashboard/motos",
      keywords: "moto, partie cycle, cycle"
    },
    {
      label: "Moteurs",
      icon: <Cog className="mr-2 h-4 w-4" />,
      href: "/dashboard/moteurs",
      keywords: "moteur, engine, cog"
    },
    {
      label: "Maintenance",
      icon: <Wrench className="mr-2 h-4 w-4" />,
      href: "/dashboard/maintenances",
      keywords: "maintenance, réparation, entretien, reparation"
    },
    {
      label: "Pièces",
      icon: <Package className="mr-2 h-4 w-4" />,
      href: "/dashboard/pieces",
      keywords: "pieces, pièces, piece, pièce, stock, inventaire"
    },
    {
      label: "Contrôles",
      icon: <FileCheck className="mr-2 h-4 w-4" />,
      href: "/dashboard/controles",
      keywords: "controle, contrôle, vérification, verification, check"
    },
    {
      label: "Utilisations",
      icon: <Clock className="mr-2 h-4 w-4" />,
      href: "/dashboard/utilisations",
      keywords: "utilisation, session, circuit, tour"
    },
    {
      label: "Alertes",
      icon: <Bell className="mr-2 h-4 w-4" />,
      href: "/dashboard/alertes",
      keywords: "alerte, notification, warning"
    },
    {
      label: "Statistiques",
      icon: <BarChart3 className="mr-2 h-4 w-4" />,
      href: "/dashboard/statistiques",
      keywords: "statistique, analyse, graphique, chart"
    },
    {
      label: "Paramètres",
      icon: <Settings className="mr-2 h-4 w-4" />,
      href: "/dashboard/parametres",
      keywords: "parametre, paramètre, setting, configuration"
    }
  ]
  
  // Définition des commandes d'actions
  const actionCommands = [
    {
      label: "Nouvelle moto",
      icon: <PlusCircle className="mr-2 h-4 w-4" />,
      href: "/dashboard/motos/new",
      keywords: "ajouter, créer, creer, nouveau, nouvelle, moto"
    },
    {
      label: "Nouveau moteur",
      icon: <PlusCircle className="mr-2 h-4 w-4" />,
      href: "/dashboard/moteurs/new",
      keywords: "ajouter, créer, creer, nouveau, nouvelle, moteur"
    },
    {
      label: "Nouvelle maintenance",
      icon: <PlusCircle className="mr-2 h-4 w-4" />,
      href: "/dashboard/maintenances/new",
      keywords: "ajouter, créer, creer, nouveau, nouvelle, maintenance, entretien"
    },
    {
      label: "Nouvelle pièce",
      icon: <PlusCircle className="mr-2 h-4 w-4" />,
      href: "/dashboard/pieces/new",
      keywords: "ajouter, créer, creer, nouveau, nouvelle, piece, pièce"
    },
    {
      label: "Nouveau contrôle",
      icon: <PlusCircle className="mr-2 h-4 w-4" />,
      href: "/dashboard/controles/new",
      keywords: "ajouter, créer, creer, nouveau, nouvelle, controle, contrôle"
    },
    {
      label: "Nouvelle utilisation",
      icon: <PlusCircle className="mr-2 h-4 w-4" />,
      href: "/dashboard/utilisations/new",
      keywords: "ajouter, créer, creer, nouveau, nouvelle, utilisation, session"
    }
  ]
  
  // Gérer la navigation
  const handleSelect = (href: string) => {
    router.push(href)
    onOpenChange(false)
  }
  
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher..." />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          {navigationCommands.map((command) => (
            <CommandItem
              key={command.href}
              value={`${command.label} ${command.keywords}`}
              onSelect={() => handleSelect(command.href)}
            >
              {command.icon}
              <span>{command.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Actions">
          {actionCommands.map((command) => (
            <CommandItem
              key={command.href}
              value={`${command.label} ${command.keywords}`}
              onSelect={() => handleSelect(command.href)}
            >
              {command.icon}
              <span>{command.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}