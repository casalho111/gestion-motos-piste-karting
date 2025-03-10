"use client";

import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

/**
 * PaginationControl - Composant de pagination réutilisable
 * 
 * @param currentPage - La page actuelle
 * @param totalPages - Le nombre total de pages
 * @param onPageChange - La fonction appelée lors du changement de page
 * @param siblingCount - Le nombre de pages à afficher avant et après la page actuelle (défaut: 1)
 */
export function PaginationControl({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: PaginationControlProps) {
  // Fonction pour générer un tableau de pages à afficher
  const generatePaginationItems = () => {
    // Toujours afficher la première page
    const firstPageIndex = 1;
    // Toujours afficher la dernière page
    const lastPageIndex = totalPages;
    
    // Pages autour de la page actuelle (en fonction de siblingCount)
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
    
    // Déterminer si on doit montrer des ellipsis
    const shouldShowLeftEllipsis = leftSiblingIndex > 2;
    const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;
    
    // Construction du tableau de pages
    const items = [];
    
    // Première page
    if (totalPages > 0) {
      items.push(firstPageIndex);
    }
    
    // Ellipsis à gauche si nécessaire
    if (shouldShowLeftEllipsis) {
      items.push('ellipsis-left');
    }
    
    // Pages entre les ellipsis
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== firstPageIndex && i !== lastPageIndex) {
        items.push(i);
      }
    }
    
    // Ellipsis à droite si nécessaire
    if (shouldShowRightEllipsis) {
      items.push('ellipsis-right');
    }
    
    // Dernière page (seulement si différente de la première)
    if (totalPages > 1) {
      items.push(lastPageIndex);
    }
    
    return items;
  };
  
  // Si une seule page, ne pas afficher la pagination
  if (totalPages <= 1) {
    return null;
  }
  
  const paginationItems = generatePaginationItems();
  
  return (
    <Pagination className="my-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) {
                onPageChange(currentPage - 1);
              }
            }}
            disabled={currentPage === 1}
          />
        </PaginationItem>
        
        {paginationItems.map((item, index) => {
          if (item === 'ellipsis-left' || item === 'ellipsis-right') {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          
          const page = item as number;
          return (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(page);
                }}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage < totalPages) {
                onPageChange(currentPage + 1);
              }
            }}
            disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}