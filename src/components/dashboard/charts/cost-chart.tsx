"use client";

import React from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  TooltipProps,
  ReferenceLine
} from "recharts";
import { ChartContainer } from "../chart-container";
import { useTheme } from "next-themes";
import { 
  NameType, 
  ValueType
} from "recharts/types/component/DefaultTooltipContent";

// Type pour les données de coûts
export interface CostData {
  date: string;
  maintenance: number;
  pieces: number;
  total: number;
  budget?: number;
}

interface CostChartProps {
  data: CostData[];
  isLoading?: boolean;
  onRefresh?: () => void;
  title?: string;
  description?: string;
  showBudgetLine?: boolean;
  height?: number;
  className?: string;
}

/**
 * CostChart - Graphique des coûts de maintenance au fil du temps
 */
export function CostChart({
  data,
  isLoading = false,
  onRefresh,
  title = "Coûts de maintenance",
  description = "Évolution des coûts au fil du temps",
  showBudgetLine = true,
  height = 350,
  className,
}: CostChartProps) {
  const { theme } = useTheme();
  
  // Formater les valeurs monétaires
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Formater les dates
  const formatDate = (date: string) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  };

  // Personnaliser le contenu du tooltip
  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      const dataPoint = data.find(d => d.date === label);
      
      return (
        <div className="bg-background border rounded-md shadow-sm p-3 text-xs">
          <p className="font-semibold mb-2">{formatDate(label)}</p>
          <div className="space-y-1">
            {payload
              .filter(entry => entry.dataKey !== "total" && entry.dataKey !== "budget")
              .map((entry, index) => (
                <div key={`item-${index}`} className="flex items-center justify-between gap-4">
                  <div className="flex items-center">
                    <div 
                      className="w-2 h-2 rounded-full mr-2" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(entry.value as number)}</span>
                </div>
              ))}
            <div className="pt-1 mt-1 border-t flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(dataPoint?.total || 0)}</span>
            </div>
            {showBudgetLine && dataPoint?.budget && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Budget</span>
                <span>{formatCurrency(dataPoint.budget)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Obtenir le budget maximal pour dimensionner l'axe Y
  const maxBudget = Math.max(...data.filter(d => d.budget).map(d => d.budget || 0));
  const maxValue = Math.max(
    maxBudget,
    Math.max(...data.map(d => Math.max(d.total, d.maintenance + d.pieces)))
  );

  // Calculer le domaine de l'axe Y
  const yDomain: [number, number] = [0, maxValue * 1.1]; // Ajouter 10% en plus pour la lisibilité

  return (
    <ChartContainer
      title={title}
      description={description}
      isLoading={isLoading}
      onRefresh={onRefresh}
      height={height}
      helpText="Ce graphique montre l'évolution des coûts de maintenance et des pièces détachées au fil du temps."
      className={className}
    >
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={false} 
          stroke={theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
        />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate} 
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
        />
        <YAxis 
          tickFormatter={(value) => `${value}€`} 
          domain={yDomain}
          tick={{ fontSize: 12 }}
          axisLine={{ stroke: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="top" 
          height={36} 
          iconType="circle" 
          iconSize={8} 
          wrapperStyle={{ fontSize: '12px' }}
        />
        
        {/* Ligne de budget si activée */}
        {showBudgetLine && (
          <Line 
            type="monotone" 
            dataKey="budget" 
            name="Budget" 
            stroke="#94a3b8" 
            strokeDasharray="5 5" 
            strokeWidth={2}
            dot={false}
          />
        )}
        
        {/* Courbes de coûts */}
        <Line 
          type="monotone" 
          dataKey="maintenance" 
          name="Maintenance" 
          stroke="#4f46e5" 
          strokeWidth={2}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="pieces" 
          name="Pièces détachées" 
          stroke="#f97316" 
          strokeWidth={2}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="total" 
          name="Total" 
          stroke="#16a34a" 
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}