'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PiEngineBold } from "react-icons/pi";
import { LiaMotorcycleSolid } from "react-icons/lia";
import { 
  WrenchIcon, 
  PackageIcon, 
  BarChartIcon, 
  BellIcon 
} from 'lucide-react'

const navItems = [
  {
    title: "Tableau de bord",
    href: "/dashboard",
    icon: <BarChartIcon className="h-4 w-4 mr-2" />
  },
  {
    title: "Motos",
    href: "/dashboard/motos",
    icon: <LiaMotorcycleSolid className="h-4 w-4 mr-2" />
  },
  {
    title: "Moteurs",
    href: "/dashboard/moteurs",
    icon: <PiEngineBold className="h-4 w-4 mr-2" />
  },
  {
    title: "Maintenance",
    href: "/dashboard/maintenance",
    icon: <WrenchIcon className="h-4 w-4 mr-2" />
  },
  {
    title: "Pièces",
    href: "/dashboard/pieces",
    icon: <PackageIcon className="h-4 w-4 mr-2" />
  },
  {
    title: "Alertes",
    href: "/dashboard/alertes",
    icon: <BellIcon className="h-4 w-4 mr-2" />
  }
]

export function MainNav() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  
  return (
    <nav className="flex items-center space-x-1">
      {navItems.map((item) => (
        <Button
          key={item.href}
          asChild
          variant={isActive(item.href) ? "secondary" : "ghost"}
          size="sm"
          className={cn(
            "justify-start",
            isActive(item.href) && "bg-muted font-medium"
          )}
        >
          <Link href={item.href}>
            {item.icon}
            {item.title}
          </Link>
        </Button>
      ))}
    </nav>
  )
}