'use client'

import { useTheme } from '@/store/hooks'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface UtilisationChartProps {
  data: any[]
  isLoading: boolean
}

/**
 * Composant d'affichage de graphique pour l'utilisation hebdomadaire
 */
export function UtilisationChart({ data, isLoading }: UtilisationChartProps) {
  const { isDark } = useTheme()
  
  // Couleurs pour le thème clair/sombre
  const colors = {
    text: isDark ? '#A1A1AA' : '#71717A',
    grid: isDark ? '#27272A' : '#E4E4E7',
    bar: isDark ? '#3B82F6' : '#2563EB',
    background: isDark ? '#18181B' : '#FFFFFF',
  }
  
  // Si les données sont en cours de chargement, afficher un squelette
  if (isLoading) {
    return <Skeleton className="h-full w-full" />
  }
  
  // Si aucune donnée n'est disponible
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-muted-foreground">Aucune donnée d'utilisation disponible</p>
      </div>
    )
  }
  
  // Formatage des données pour le graphique
  const formattedData = data.map(item => ({
    ...item,
    jour: typeof item.jour === 'string' 
      ? format(new Date(item.jour), 'EEE dd/MM', { locale: fr }) 
      : format(item.jour, 'EEE dd/MM', { locale: fr }),
    distanceTotale: Number(item.distanceTotale) || 0,
  }))
  
  // Composant personnalisé pour le tooltip
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const value = payload[0].value as number
      
      return (
        <div className="bg-background border border-border p-2 rounded-md shadow-md text-xs">
          <p className="font-medium">{label}</p>
          <p>Distance: {value.toFixed(1)} km</p>
          {payload[0].payload.nbTours && (
            <p>Tours: {payload[0].payload.nbTours}</p>
          )}
        </div>
      )
    }
    
    return null
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={formattedData}
        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis 
          dataKey="jour" 
          tickLine={false}
          tick={{ fontSize: 12, fill: colors.text }}
          dy={10}
        />
        <YAxis 
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: colors.text }}
          tickFormatter={(value) => `${value} km`}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="distanceTotale" 
          name="Distance" 
          fill={colors.bar} 
          radius={[4, 4, 0, 0]}
          barSize={30}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}