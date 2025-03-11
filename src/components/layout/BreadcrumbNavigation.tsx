'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BreadcrumbNavigation() {
  const pathname = usePathname()
  
  // Ignorer l'affichage sur la page d'accueil du dashboard
  if (pathname === '/dashboard') {
    return null
  }
  
  // Découper le chemin en segments
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, array) => {
      // Construire le chemin cumulatif
      const path = `/${array.slice(0, index + 1).join('/')}`
      
      // Obtenir le libellé à afficher
      let label = segment.charAt(0).toUpperCase() + segment.slice(1)
      
      // Gérer les cas particuliers (singulier/pluriel, etc.)
      if (label === 'Motos' && index === array.length - 1) label = 'Motos'
      if (label === 'Moteurs' && index === array.length - 1) label = 'Moteurs'
      if (label === 'Maintenances' && index === array.length - 1) label = 'Maintenance'
      if (label === 'Pieces' && index === array.length - 1) label = 'Pièces'
      if (label === 'Utilisations' && index === array.length - 1) label = 'Utilisations'
      if (label === 'Controles' && index === array.length - 1) label = 'Contrôles'
      if (label === 'Alertes' && index === array.length - 1) label = 'Alertes'
      if (label === 'Statistiques' && index === array.length - 1) label = 'Statistiques'
      if (label === 'Parametres' && index === array.length - 1) label = 'Paramètres'
      
      // Si le segment est un ID (dernière partie du chemin), essayer de déterminer le type d'entité
      if (
        index === array.length - 1 && 
        /^[a-f0-9]{24}$/.test(segment) && // Format typique d'ID MongoDB
        array.length > 1
      ) {
        const entityType = array[index - 1]
        if (entityType === 'motos') label = 'Détail moto'
        if (entityType === 'moteurs') label = 'Détail moteur'
        if (entityType === 'maintenances') label = 'Détail maintenance'
        if (entityType === 'pieces') label = 'Détail pièce'
        if (entityType === 'utilisations') label = 'Détail utilisation'
        if (entityType === 'controles') label = 'Détail contrôle'
      }
      
      // Cas d'un sous-chemin "new"
      if (segment === 'new' && index === array.length - 1) {
        const entityType = array[index - 1]
        if (entityType === 'motos') label = 'Nouvelle moto'
        if (entityType === 'moteurs') label = 'Nouveau moteur'
        if (entityType === 'maintenances') label = 'Nouvelle maintenance'
        if (entityType === 'pieces') label = 'Nouvelle pièce'
        if (entityType === 'utilisations') label = 'Nouvelle utilisation'
        if (entityType === 'controles') label = 'Nouveau contrôle'
      }
      
      // Cas d'un sous-chemin "edit"
      if (segment === 'edit' && index === array.length - 1) {
        const entityType = array[index - 2] // L'élément parent du parent est le type d'entité
        if (entityType === 'motos') label = 'Modifier moto'
        if (entityType === 'moteurs') label = 'Modifier moteur'
        if (entityType === 'maintenances') label = 'Modifier maintenance'
        if (entityType === 'pieces') label = 'Modifier pièce'
        if (entityType === 'utilisations') label = 'Modifier utilisation'
        if (entityType === 'controles') label = 'Modifier contrôle'
      }
      
      return { path, label }
    })
  
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center text-sm">
      <ol className="flex items-center space-x-1.5">
        {/* Lien vers le dashboard */}
        <li>
          <Link 
            href="/dashboard" 
            className="text-muted-foreground hover:text-foreground flex items-center"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Accueil</span>
          </Link>
        </li>
        
        <li>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </li>
        
        {/* Segments du chemin */}
        {segments.map((segment, index) => (
          <li key={segment.path} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" aria-hidden="true" />
            )}
            
            {/* Lien ou texte pour le segment */}
            {index === segments.length - 1 ? (
              <span className="font-medium" aria-current="page">
                {segment.label}
              </span>
            ) : (
              <Link 
                href={segment.path} 
                className="text-muted-foreground hover:text-foreground"
              >
                {segment.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}