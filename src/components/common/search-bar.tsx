"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react"; 
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
  autoFocus?: boolean;
  debounceMs?: number;
  showClearButton?: boolean;
}

/**
 * Composant SearchBar - Barre de recherche réutilisable
 * 
 * @param placeholder - Texte d'aide (placeholder)
 * @param value - Valeur contrôlée (si utilisé de manière contrôlée)
 * @param onChange - Fonction appelée lors du changement de valeur
 * @param onSearch - Fonction appelée lors de la soumission (optionnel)
 * @param className - Classes CSS additionnelles
 * @param autoFocus - Focus automatique au chargement
 * @param debounceMs - Délai en ms avant que onChange soit appelé (0 = pas de debounce)
 * @param showClearButton - Afficher un bouton pour effacer la recherche
 */
export function SearchBar({
  placeholder = "Rechercher...",
  value: propValue,
  onChange,
  onSearch,
  className,
  autoFocus = false,
  debounceMs = 300,
  showClearButton = true,
}: SearchBarProps) {
  // État local si le composant est non contrôlé
  const [internalValue, setInternalValue] = useState<string>(propValue || "");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Synchroniser l'état local avec les props
  useEffect(() => {
    if (propValue !== undefined && propValue !== internalValue) {
      setInternalValue(propValue);
    }
  }, [propValue]);

  // Gérer le changement de valeur avec debounce
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    
    // Si le debounce est actif, annuler le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Si debounceMs est 0, appeler onChange immédiatement
    if (debounceMs === 0) {
      onChange(newValue);
      return;
    }
    
    // Sinon, configurer un nouveau timer
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  };

  // Gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si debounceTimerRef.current existe, annuler le timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      onChange(internalValue);
    }
    
    if (onSearch) {
      onSearch(internalValue);
    }
  };

  // Effacer la recherche
  const handleClear = () => {
    setInternalValue("");
    onChange("");
    
    // Focus sur l'input après effacement
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn("relative flex w-full max-w-sm items-center", className)}
    >
      <div className="relative w-full">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={internalValue}
          onChange={handleChange}
          className="w-full pl-9 pr-10"
          autoFocus={autoFocus}
        />
        {showClearButton && internalValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0.5 top-0.5 h-8 w-8 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Effacer la recherche</span>
          </Button>
        )}
      </div>
    </form>
  );
}