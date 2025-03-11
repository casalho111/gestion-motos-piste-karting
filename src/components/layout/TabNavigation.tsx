'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type TabItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
};

interface TabNavigationProps {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'underline' | 'pills';
  fullWidth?: boolean;
  scrollable?: boolean;
  queryParam?: string;
  preserveState?: boolean;
  className?: string;
  tabsClassName?: string;
  align?: 'start' | 'center' | 'end';
}

/**
 * TabNavigation - Composant de navigation par onglets amélioré
 * 
 * @param items - Tableau d'éléments d'onglet
 * @param defaultTab - ID de l'onglet par défaut
 * @param onChange - Fonction appelée lors du changement d'onglet
 * @param variant - Variante d'affichage des onglets
 * @param fullWidth - Si les onglets doivent occuper toute la largeur
 * @param scrollable - Si les onglets doivent être défilables
 * @param queryParam - Nom du paramètre de requête pour synchroniser l'onglet actif
 * @param preserveState - Conserver l'état entre les navigations
 * @param className - Classes CSS pour le conteneur
 * @param tabsClassName - Classes CSS pour les onglets
 * @param align - Alignement des onglets
 */
export function TabNavigation({
  items,
  defaultTab,
  onChange,
  variant = 'default',
  fullWidth = false,
  scrollable = false,
  queryParam,
  preserveState = false,
  className,
  tabsClassName,
  align = 'start',
}: TabNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Déterminer l'onglet actif à partir des paramètres de recherche si nécessaire
  const initialTab = queryParam 
    ? searchParams.get(queryParam) || defaultTab || items[0]?.id 
    : defaultTab || items[0]?.id;
  
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Synchroniser avec les paramètres de recherche
  useEffect(() => {
    if (queryParam) {
      const tabFromQuery = searchParams.get(queryParam);
      if (tabFromQuery && items.some(item => item.id === tabFromQuery)) {
        setActiveTab(tabFromQuery);
      }
    }
  }, [searchParams, queryParam, items]);
  
  // Gérer le changement d'onglet
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // Mettre à jour les paramètres de recherche si nécessaire
    if (queryParam) {
      const params = new URLSearchParams(searchParams.toString());
      params.set(queryParam, tabId);
      
      // Naviguer avec les nouveaux paramètres
      router.push(`${pathname}?${params.toString()}`, {
        scroll: false, // Ne pas défiler vers le haut
      });
    }
    
    // Appeler le gestionnaire externe si fourni
    if (onChange) {
      onChange(tabId);
    }
    
    // Exécuter onClick du tab si présent
    const currentTab = items.find(item => item.id === tabId);
    if (currentTab && currentTab.onClick) {
      currentTab.onClick();
    }
  };
  
  // Déterminer la classe CSS en fonction de la variante
  const getTabsClassName = () => {
    const baseClass = cn(
      "mb-4",
      fullWidth && "w-full",
      tabsClassName
    );
    
    switch (variant) {
      case 'underline':
        return cn(
          baseClass,
          "border-b border-muted",
          "data-[state=active]:border-b-2 data-[state=active]:border-primary"
        );
      case 'pills':
        return cn(
          baseClass,
          "p-1 bg-muted/30 rounded-lg",
          "data-[state=active]:bg-background data-[state=active]:shadow-sm"
        );
      default:
        return baseClass;
    }
  };
  
  // Déterminer la classe CSS pour l'alignement
  const getAlignmentClass = () => {
    switch (align) {
      case 'center':
        return "justify-center";
      case 'end':
        return "justify-end";
      default:
        return "justify-start";
    }
  };
  
  // Rendu du contenu de l'onglet actif
  const renderActiveContent = () => {
    const activeItem = items.find(item => item.id === activeTab);
    return activeItem?.content;
  };
  
  // Rendu des onglets avec défilement si nécessaire
  const renderTabs = () => {
    const tabsList = (
      <TabsList 
        className={cn(
          getTabsClassName(),
          fullWidth && "w-full",
          getAlignmentClass()
        )}
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.id}
            value={item.id}
            disabled={item.disabled}
            className={fullWidth ? "flex-1" : ""}
            onClick={() => handleTabChange(item.id)}
          >
            {item.icon && (
              <span className="mr-2">{item.icon}</span>
            )}
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    );
    
    // Si défilable, envelopper dans un ScrollArea
    if (scrollable) {
      return (
        <div className="relative">
          <ScrollArea className="w-full" type="scroll" dir="ltr">
            {tabsList}
          </ScrollArea>
          <div className="absolute inset-y-0 left-0 w-8 pointer-events-none bg-gradient-to-r from-background to-transparent z-10"></div>
          <div className="absolute inset-y-0 right-0 w-8 pointer-events-none bg-gradient-to-l from-background to-transparent z-10"></div>
        </div>
      );
    }
    
    return tabsList;
  };
  
  return (
    <div className={cn("w-full", className)}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {renderTabs()}
        <div className="mt-4">
          {renderActiveContent()}
        </div>
      </Tabs>
    </div>
  );
}

/**
 * TabNavigationWithLinks - Version de TabNavigation qui utilise des liens pour la navigation
 * Utile pour les onglets qui changent de page
 */
export function TabNavigationWithLinks({
  items,
  activeId,
  variant = 'default',
  fullWidth = false,
  scrollable = false,
  className,
  tabsClassName,
  align = 'start',
}: Omit<TabNavigationProps, 'defaultTab' | 'onChange' | 'queryParam' | 'preserveState'> & {
  activeId: string;
}) {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Vérifier si le défilement est possible
  useEffect(() => {
    if (scrollable && scrollContainerRef.current) {
      const checkScroll = () => {
        const container = scrollContainerRef.current;
        if (container) {
          setCanScrollLeft(container.scrollLeft > 0);
          setCanScrollRight(
            container.scrollLeft < container.scrollWidth - container.clientWidth - 1
          );
        }
      };

      checkScroll();
      
      const container = scrollContainerRef.current;
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [scrollable, items]);

  // Fonctions de défilement
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };
  
  // Déterminer la classe CSS en fonction de la variante
  const getTabsClassName = () => {
    switch (variant) {
      case 'underline':
        return cn(
          "flex border-b border-muted",
          fullWidth && "w-full",
          getAlignmentClass(),
          tabsClassName
        );
      case 'pills':
        return cn(
          "flex p-1 bg-muted/30 rounded-lg",
          fullWidth && "w-full",
          getAlignmentClass(),
          tabsClassName
        );
      default:
        return cn(
          "flex bg-muted/30 p-1 rounded-lg",
          fullWidth && "w-full",
          getAlignmentClass(),
          tabsClassName
        );
    }
  };
  
  // Déterminer la classe CSS pour l'alignement
  const getAlignmentClass = () => {
    switch (align) {
      case 'center':
        return "justify-center";
      case 'end':
        return "justify-end";
      default:
        return "justify-start";
    }
  };
  
  const renderTabs = () => {
    const tabs = (
      <div 
        className={getTabsClassName()}
        ref={scrollContainerRef}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          
          return (
            <Link 
              key={item.id}
              href={item.onClick ? '#' : `?tab=${item.id}`}
              onClick={(e) => {
                if (item.onClick) {
                  e.preventDefault();
                  item.onClick();
                }
              }}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
                item.disabled && "opacity-50 pointer-events-none",
                fullWidth && "flex-1 text-center"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="flex items-center justify-center gap-2">
                {item.icon}
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    );
    
    if (scrollable) {
      return (
        <div className="relative">
          {canScrollLeft && (
            <Button
              size="icon"
              variant="outline"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
              onClick={scrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          <div className="overflow-x-auto hide-scrollbar px-8">
            {tabs}
          </div>
          
          {canScrollRight && (
            <Button
              size="icon"
              variant="outline"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
              onClick={scrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    }
    
    return tabs;
  };
  
  // Trouver le contenu de l'onglet actif
  const activeItem = items.find(item => item.id === activeId);
  
  return (
    <div className={cn("w-full", className)}>
      {renderTabs()}
      {activeItem?.content && (
        <div className="mt-4">
          {activeItem.content}
        </div>
      )}
    </div>
  );
}