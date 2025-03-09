"use client"

import Link from "next/link"
import { Bell, Sun, Moon, Search, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { useAlerteStore } from "@/store/store"

interface Alerte {
  id: string
  titre: string
  date: Date
  read: boolean
  criticite: "FAIBLE" | "MOYENNE" | "ELEVEE" | "CRITIQUE"
}

export function TopBar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { alertes } = useAlerteStore()
  
  // Déterminer le nombre d'alertes non lues
  const nonLues = alertes.data?.filter((a) => !(a as unknown as Alerte).read) || []
  const nombreAlertesNonLues = nonLues.length
  
  // Mock user data (à remplacer par un vrai système d'authentification)
  const user = {
    name: "Technicien",
    initials: "TC",
    role: "Responsable technique",
  }

  // Prévenir les problèmes d'hydration avec next-themes
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Link href="/dashboard" className="text-lg font-semibold">
          Gestion Motos
        </Link>
      </div>
      
      {/* Recherche globale */}
      <div className="hidden md:flex md:max-w-xs lg:max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="w-full bg-background pl-8 md:w-[250px] lg:w-[300px]"
          />
        </div>
      </div>

      {/* Actions rapides et profil */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Popover>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {nombreAlertesNonLues > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center p-0 text-[10px]"
                      >
                        {nombreAlertesNonLues}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <PopoverContent className="w-80" align="end">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Notifications</h4>
              <Button variant="ghost" size="sm" className="h-auto px-2 text-xs">
                Tout marquer comme lu
              </Button>
            </div>
            <div className="mt-2 max-h-[300px] overflow-auto">
              {nombreAlertesNonLues === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Aucune notification non lue
                </p>
              ) : (
                nonLues.slice(0, 5).map((alerte) => (
                  <div
                    key={alerte.id}
                    className="mb-2 rounded-lg border p-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          alerte.criticite === "CRITIQUE" ? "destructive" : 
                          alerte.criticite === "ELEVEE" ? "destructive" : 
                          alerte.criticite === "MOYENNE" ? "default" : 
                          "outline"
                        }
                        className="h-2 w-2 rounded-full p-0"
                      />
                      <p className="font-medium">{alerte.titre}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date((alerte as unknown as Alerte).date).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-2 border-t pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-center text-xs"
                asChild
              >
                <Link href="/dashboard/alertes">Voir toutes les alertes</Link>
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Thème (soleil/lune) */}
        {mounted && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setTheme(theme === "dark" ? "light" : "dark")
                  }
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                  <span className="sr-only">Changer de thème</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {theme === "dark" ? "Mode clair" : "Mode sombre"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Menu utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm md:inline-block">
                {user.name}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {user.role}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Préférences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Déconnexion</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}