# Guide des composants de tableau de bord

Ce document présente les différents composants de tableau de bord disponibles pour le système de gestion des motos de piste, ainsi que les meilleures pratiques pour les utiliser.

## Table des matières

1. [Introduction](#introduction)
2. [Composants disponibles](#composants-disponibles)
3. [Intégration avec Zustand](#intégration-avec-zustand)
4. [Optimisation des performances](#optimisation-des-performances)
5. [Accessibilité](#accessibilité)
6. [Responsive design](#responsive-design)
7. [Thème clair/sombre](#thème-clairdombre)
8. [Personnalisation](#personnalisation)
9. [Exemples d'utilisation](#exemples-dutilisation)

## Introduction

Les composants de tableau de bord sont conçus pour présenter les données de manière claire et interactive. Ils s'intègrent parfaitement avec les stores Zustand et sont basés sur shadcn/UI et Recharts.

## Composants disponibles

### Composants de base

- **StatCard** : Affiche une statistique clé avec variation et icône.
- **ChartContainer** : Conteneur pour les graphiques Recharts avec fonctionnalités comme le téléchargement et l'aide.
- **AlertsList** : Liste des alertes avec différents niveaux de criticité.
- **ActivitiesList** : Liste des activités récentes avec timeline.
- **AvailabilityGrid** : Grille de disponibilité des motos.
- **MaintenanceSchedule** : Planning des maintenances à venir.

### Composants de graphiques spécifiques

- **UsageChart** : Graphique d'utilisation des motos par modèle.
- **CostChart** : Graphique d'évolution des coûts de maintenance.

## Intégration avec Zustand

Les composants sont conçus pour s'intégrer facilement avec les stores Zustand. Voici comment les utiliser avec vos stores existants :

```tsx
import { useStatsStore } from '@/store/hooks';
import { StatCard } from '@/components/dashboard';

function Dashboard() {
  const { stats, isLoading, error, refetch } = useStatsStore();
  
  return (
    <StatCard
      title="Motos disponibles"
      value={`${stats?.cycles.disponibles || 0} / ${stats?.cycles.total || 0}`}
      isLoading={isLoading}
      onRefresh={refetch}
    />
  );
}
```

## Optimisation des performances

### Memoïsation des composants

Pour éviter les rendus inutiles, utilisez `React.memo` et `useMemo` pour les composants et les propriétés qui ne changent pas souvent :

```tsx
import React, { useMemo } from 'react';
import { UsageChart } from '@/components/dashboard';

const MemoizedUsageChart = React.memo(UsageChart);

function Dashboard({ data }) {
  // Memoïser les données de graphique qui ne changent pas à chaque rendu
  const usageData = useMemo(() => transformData(data), [data]);
  
  return <MemoizedUsageChart data={usageData} />;
}
```

### Chargement différé

Pour les tableaux de bord complexes, vous pouvez utiliser le chargement différé pour améliorer les performances :

```tsx
import dynamic from 'next/dynamic';

const DynamicCostChart = dynamic(
  () => import('@/components/dashboard').then(mod => mod.CostChart),
  { loading: () => <p>Chargement...</p>, ssr: false }
);
```

## Accessibilité

Tous les composants sont conçus pour être accessibles selon les normes WCAG. Ils incluent :

- Attributs ARIA appropriés
- Navigation au clavier
- Contrastes suffisants
- Textes alternatifs pour les graphiques

### Bonnes pratiques d'accessibilité

- Toujours fournir un texte alternatif descriptif pour les graphiques via la propriété `description`.
- Utiliser des noms significatifs pour les actions.
- S'assurer que les indicateurs d'état ne dépendent pas uniquement de la couleur.

## Responsive design

Les composants sont conçus avec une approche mobile-first et s'adaptent à différentes tailles d'écran :

- Sur mobile, les composants s'empilent verticalement.
- Sur tablette, certains composants s'affichent côte à côte.
- Sur desktop, tous les composants s'affichent selon une grille optimisée.

Exemple d'utilisation avec une grille responsive :

```tsx
<div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  <StatCard title="Motos disponibles" value="4 / 6" />
  <StatCard title="Moteurs disponibles" value="3 / 8" />
  <StatCard title="Maintenances du mois" value="12" />
  <StatCard title="Coût total" value="1 250 €" />
</div>
```

## Thème clair/sombre

Les composants prennent en charge automatiquement les thèmes clair et sombre grâce à shadcn/UI et à Tailwind CSS. Les graphiques Recharts sont également adaptés au thème actif.

## Personnalisation

### Personnalisation des couleurs

Vous pouvez personnaliser les couleurs des composants en utilisant les propriétés dédiées ou en ajoutant des classes CSS :

```tsx
<StatCard
  title="Motos disponibles"
  value="4 / 6"
  iconColor="text-green-500/20"
  valueClassName="text-green-600 dark:text-green-400"
/>
```

### Personnalisation des graphiques

Pour les graphiques, vous pouvez personnaliser les couleurs, les axes, les tooltips, etc. :

```tsx
<UsageChart
  data={usageData}
  height={400}
  showLegend={true}
  // Autres propriétés de personnalisation
/>
```

## Exemples d'utilisation

### Tableau de bord complet

```tsx
import {
  StatCard, 
  AlertsList, 
  ActivitiesList,
  UsageChart,
  CostChart
} from '@/components/dashboard';
import { useDashboardStats } from '@/store/hooks';

export default function Dashboard() {
  const { stats, alerts, activities, usageData, costData, isLoading, refetch } = useDashboardStats();
  
  return (
    <div className="space-y-6">
      {/* Statistiques clés */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Motos disponibles" value={`${stats?.cycles.disponibles} / ${stats?.cycles.total}`} isLoading={isLoading} />
        {/* Autres statistiques */}
      </div>
      
      {/* Graphiques */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <UsageChart data={usageData} isLoading={isLoading} onRefresh={refetch} />
        <CostChart data={costData} isLoading={isLoading} onRefresh={refetch} />
      </div>
      
      {/* Alertes et activités */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <AlertsList alerts={alerts} isLoading={isLoading} />
        <ActivitiesList activities={activities} isLoading={isLoading} />
      </div>
    </div>
  );
}
```

### Utilisation avancée avec des données en temps réel

Pour les données qui changent fréquemment, vous pouvez utiliser des techniques de polling ou des WebSockets :

```tsx
import { useState, useEffect } from 'react';
import { AlertsList } from '@/components/dashboard';

export default function RealtimeAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Polling toutes les 30 secondes
  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/alerts');
        const data = await response.json();
        setAlerts(data);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAlerts();
    
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <AlertsList 
      alerts={alerts} 
      isLoading={isLoading} 
      title="Alertes en temps réel" 
    />
  );
}
```

---

Ce guide devrait vous aider à utiliser efficacement les composants de tableau de bord dans votre application. Pour plus d'informations, consultez les fichiers source individuels des composants.