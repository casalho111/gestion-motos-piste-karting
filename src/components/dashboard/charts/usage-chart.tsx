"use client";

import React, { useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  TooltipProps
} from "recharts";
import { ChartContainer } from "../chart-container";
import { useTheme } from "next-themes";
import { 
  NameType, 
  ValueType
} from "recharts/types/component/DefaultTooltipContent";

// Type pour les données d'utilisation
export interface UsageData {
  date: string;
  total: number;
  models: Record<string, number>;
}

// Type de période d'agrégation
export type AggregationPeriod = 'day' | 'week' | 'month';

interface UsageChartProps {
  data: UsageData[];
  period?: AggregationPeriod;
  isLoading?: boolean;
  onRefresh?: () => void;
  title?: string;
  description?: string;
  showLegend?: boolean;
  height?: number;
  className?: string;
}

/**
 * UsageChart - Graphique d'utilisation des motos au fil du temps
 */
export function UsageChart({
  data,
  period = 'day',
  isLoading = false,
  onRefresh,
  title = "Utilisation des motos",
  description = "Distance parcourue par modèle",
  showLegend = true,
  height = 350,
  className,
}: UsageChartProps) {
  const { theme } = useTheme();
  
  // Calculer la liste des modèles à partir des données
  const models = useMemo(() => {
    const modelSet = new Set<string>();
    
    data.forEach(item => {
      Object.keys(item.models).forEach(model => {
        modelSet.add(model);
      });
    });
    
    return Array.from(modelSet);
  }, [data]);

  // Couleurs pour les différents modèles
  const modelColors = [
    "#4f46e5", // indigo-600
    "#ec4899", // pink-500
    "#14b8a6", // teal-500
    "#f97316", // orange-500
    "#8b5cf6", // violet-500
    "#06b6d4", // cyan-500
  ];

  // Formater les dates selon la période
  const formatXAxis = (date: string) => {
    const dateObj = new Date(date);
    
    switch (period) {
      case 'day':
        return dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      case 'week':
        return `Sem. ${dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
      case 'month':
        return dateObj.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      default:
        return date;
    }
  };

  // Personnaliser le contenu du tooltip
  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      // Trouver l'entrée de données pour cette date
      const dataPoint = data.find(d => d.date === label);
      
      return (
        <div className="bg-background border rounded-md shadow-sm p-3 text-xs">
          <p className="font-semibold mb-2">{formatXAxis(label)}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                <div className="flex items-center">
                  <div 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}</span>
                </div>
                <span className="font-medium">{entry.value} km</span>
              </div>
            ))}
            <div className="pt-1 mt-1 border-t flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>{dataPoint?.total} km</span>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <ChartContainer
      title={title}
      description={description}
      isLoading={isLoading}
      onRefresh={onRefresh}
      height={height}
      helpText="Ce graphique montre la distance parcourue par les motos au fil du temps, regroupée par modèle."
      className={className}
    >
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 5, bottom: 5 }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={false} 
          stroke={theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
        />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatXAxis} 
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
        />
        <YAxis 
          unit=" km" 
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle" 
            iconSize={8} 
            wrapperStyle={{ fontSize: '12px' }}
          />
        )}
        {models.map((model, index) => (
          <Bar 
            key={model}
            dataKey={`models.${model}`}
            name={model}
            stackId="a"
            fill={modelColors[index % modelColors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}