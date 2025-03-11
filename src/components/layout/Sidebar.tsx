'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
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
  Bell
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

interface SidebarProps {
  className?: string
  collapsed?: boolean
}

export function Sidebar({ className, collapsed = false }: SidebarProps) {
  const pathname = usePathname()
  
  // Navigation principale
  const mainNavItems = [
    {
      title: "Tableau de bord",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      title: "Motos",
      href: "/dashboard/motos",
      icon: <Bike className="h-5 w-5" />
    },
    {
      title: "Moteurs",
      href: "/dashboard/moteurs",
      icon: <Cog className="h-5 w-5" />
    },
    {
      title: "Maintenance",
      href: "/dashboard/maintenances",
      icon: <Wrench className="h-5 w-5" />
    },
    {
      title: "Pièces",
      href: "/dashboard/pieces",
      icon: <Package className="h-5 w-5" />
    }
  ]
  
  // Navigation secondaire
  const secondaryNavItems = [
    {
      title: "Contrôles",
      href: "/dashboard/controles",
      icon: <FileCheck className="h-5 w-5" />
    },
    {
      title: "Utilisations",
      href: "/dashboard/utilisations",
      icon: <Clock className="h-5 w-5" />
    },
    {
      title: "Alertes",
      href: "/dashboard/alertes",
      icon: <Bell className="h-5 w-5" />
    },
    {
      title: "Statistiques",
      href: "/dashboard/statistiques",
      icon: <BarChart3 className="h-5 w-5" />
    }
  ]
  
  // Navigation de configuration
  const configNavItems = [
    {
      title: "Paramètres",
      href: "/dashboard/parametres",
      icon: <Settings className="h-5 w-5" />
    }
  ]
  
  // Vérifier si un lien est actif
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`)
  }
  
  // Fonction pour rendre un élément de navigation
  const renderNavItem = (item: typeof mainNavItems[0]) => {
    const active = isActive(item.href)
    
    return (
      <TooltipProvider key={item.href} delayDuration={collapsed ? 100 : 1000}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={active ? "secondary" : "ghost"}
              size={collapsed ? "icon" : "default"}
              className={cn(
                "w-full justify-start",
                collapsed ? "h-10 w-10 p-0" : "px-2",
                active && "bg-muted font-medium"
              )}
              asChild
            >
              <Link href={item.href}>
                {item.icon}
                {!collapsed && <span className="ml-2">{item.title}</span>}
              </Link>
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">
              {item.title}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    )
  }
  
  return (
    <aside className={cn(
      "flex flex-col border-r bg-background",
      className
    )}>
      {/* Logo et branding */}
      <div className={cn(
        "flex h-16 items-center border-b px-4",
        collapsed ? "justify-center" : "justify-start"
      )}>
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Bike className="h-6 w-6" />
          {!collapsed && <span className="font-bold">Gestion Motos</span>}
        </Link>
      </div>
      
      {/* Menu de navigation */}
      <ScrollArea className="flex-1">
        <div className={cn(
          "flex flex-col gap-1 p-2",
          collapsed ? "items-center" : ""
        )}>
          {/* Navigation principale */}
          <div className="w-full">
            {mainNavItems.map(renderNavItem)}
          </div>
          
          {/* Séparateur */}
          <Separator className="my-2" />
          
          {/* Navigation secondaire */}
          <div className="w-full">
            {secondaryNavItems.map(renderNavItem)}
          </div>
          
          {/* Séparateur */}
          <Separator className="my-2" />
          
          {/* Navigation de configuration */}
          <div className="w-full mt-auto">
            {configNavItems.map(renderNavItem)}
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}