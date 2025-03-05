'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  siblingsCount?: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  siblingsCount = 1,
  onPageChange
}: PaginationProps) {
  // Fonction pour générer la plage de pages
  const generatePagesArray = () => {
    const pages = []
    
    // Afficher toujours la première page
    if (currentPage > 1 + siblingsCount) {
      pages.push(1)
      
      // Ajouter des points de suspension si nécessaire
      if (currentPage > 2 + siblingsCount) {
        pages.push('...')
      }
    }
    
    // Générer la plage autour de la page courante
    const startPage = Math.max(2, currentPage - siblingsCount)
    const endPage = Math.min(totalPages - 1, currentPage + siblingsCount)
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    // Afficher toujours la dernière page si elle existe
    if (currentPage < totalPages - siblingsCount) {
      // Ajouter des points de suspension si nécessaire
      if (currentPage < totalPages - 1 - siblingsCount) {
        pages.push('...')
      }
      
      pages.push(totalPages)
    }
    
    return pages
  }
  
  // Ne pas afficher la pagination s'il n'y a qu'une seule page
  if (totalPages <= 1) return null
  
  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      >
        <ChevronsLeft className="h-4 w-4" />
        <span className="sr-only">Première page</span>
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Page précédente</span>
      </Button>
      
      {generatePagesArray().map((page, i) => (
        page === '...' ? (
          <div key={`ellipsis-${i}`} className="px-2">...</div>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="icon"
            onClick={() => typeof page === 'number' && onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Button>
        )
      ))}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Page suivante</span>
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        <ChevronsRight className="h-4 w-4" />
        <span className="sr-only">Dernière page</span>
      </Button>
    </div>
  )
}