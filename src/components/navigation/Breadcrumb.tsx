"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  title: string
  href: string
  isCurrent: boolean
}

export function Breadcrumb() {
  const pathname = usePathname()
  
  const getItems = (): BreadcrumbItem[] => {
    // Si on est sur la page dashboard, on ne montre pas de fil d'Ariane
    if (pathname === "/dashboard") {
      return []
    }
    
    // Début du fil d'Ariane avec "Accueil"
    const items: BreadcrumbItem[] = [
      {
        title: "Accueil",
        href: "/dashboard",
        isCurrent: false,
      },
    ]
    
    // Segment correspond aux parties de l'URL après /dashboard/
    const segments = pathname.split("/").filter(Boolean)
    
    // Ne pas traiter "dashboard" comme un segment pour le fil d'Ariane
    const relevantSegments = segments.slice(1)
    
    // Tableau de correspondance pour les titres personnalisés
    const titles: Record<string, string> = {
      'motos': 'Motos',
      'moteurs': 'Moteurs',
      'maintenance': 'Maintenance',
      'pieces': 'Pièces',
      'controles': 'Contrôles',
      'statistiques': 'Statistiques',
      'alertes': 'Alertes',
      'utilisations': 'Utilisations',
      'nouvelle': 'Nouvelle',
      'nouveau': 'Nouveau',
    }
    
    // Construire chaque élément du fil d'Ariane
    let currentPath = "/dashboard"
    
    relevantSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Pour les IDs (dernier segment qui ne correspond pas à un titre connu),
      // tenter d'obtenir un titre plus descriptif
      const isLastSegment = index === relevantSegments.length - 1
      const isId = isLastSegment && !titles[segment] && segment !== "nouvelle" && segment !== "nouveau"
      
      const title = isId 
        ? "Détail" 
        : titles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      
      items.push({
        title,
        href: currentPath,
        isCurrent: isLastSegment,
      })
    })
    
    return items
  }
  
  const items = getItems()
  
  // Ne pas afficher le fil d'Ariane sur la page d'accueil
  if (items.length === 0) {
    return null
  }
  
  return (
    <nav className="mb-6 flex" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center text-sm">
            {index > 0 && (
              <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />
            )}
            
            {item.isCurrent ? (
              <span className="font-medium" aria-current="page">
                {item.title}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {index === 0 ? (
                  <span className="flex items-center">
                    <Home className="mr-1 h-4 w-4" />
                    <span className="sr-only">{item.title}</span>
                  </span>
                ) : (
                  item.title
                )}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}