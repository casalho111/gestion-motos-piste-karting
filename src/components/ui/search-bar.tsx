'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { debounce } from 'lodash'

interface SearchBarProps {
  placeholder?: string
  initialValue?: string
  onSearch: (value: string) => void
  className?: string
  debounceTime?: number
}

export function SearchBar({
  placeholder = "Rechercher...",
  initialValue = "",
  onSearch,
  className = "",
  debounceTime = 300
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue)
  
  // Debounce la fonction de recherche
  const debouncedSearch = useMemo(
    () => debounce((searchTerm: string) => {
      onSearch(searchTerm)
    }, debounceTime),
    [onSearch, debounceTime]
  )
  
  // Mettre à jour la valeur et déclencher la recherche
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue)
      debouncedSearch(newValue)
    },
    [debouncedSearch]
  )
  
  // Effacer la recherche
  const handleClear = useCallback(() => {
    setValue("")
    onSearch("")
  }, [onSearch])
  
  // Nettoyer le debounce lors du démontage
  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])
  
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="pl-8 pr-8"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-9 w-9"
          onClick={handleClear}
        >
          <X className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Effacer</span>
        </Button>
      )}
    </div>
  )
}