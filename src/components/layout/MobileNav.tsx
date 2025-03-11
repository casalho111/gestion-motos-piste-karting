'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  X
} from 'lucide-react'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()
  
  // Fermer le mobile nav quand le chemin change
  useEffect(() => {
    onClose()
  }, [pathname, onClose])
  
  // Bloquer le scroll du body quand le menu est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])
  
  // Navigation principale
  const navItems = [
    {
      section: "Principal",
      items: [
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
    },
    {
      section: "Opérations",
      items: [
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
    },
    {
      section: "Configuration",
      items: [
        {
          title: "Paramètres",
          href: "/dashboard/parametres",
          icon: <Settings className="h-5 w-5" />
        }
      ]
    }
  ]
  
  // Vérifier si un lien est actif
  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`)
  }
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="p-0 w-[280px] sm:w-[320px]">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bike className="h-5 w-5" />
              <span>Gestion Motos</span>
            </SheetTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Fermer</span>
            </Button>
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
          <div className="p-4 pb-8">
            {navItems.map((section, i) => (
              <div key={section.section} className={cn(i > 0 && "mt-6")}>
                <h3 className="text-sm font-medium text-muted-foreground px-2 mb-2">
                  {section.section}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Button
                      key={item.href}
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive(item.href) && "bg-muted font-medium"
                      )}
                      asChild
                    >
                      <Link href={item.href} onClick={onClose}>
                        {item.icon}
                        <span className="ml-2">{item.title}</span>
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <p>Version 1.0.0</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}