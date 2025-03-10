// Export des composants principaux du tableau de bord
export { StatCard } from './stat-card';
export { ChartContainer } from './chart-container';
export { AlertsList } from './alerts-list';
export { ActivitiesList } from './activities-list';
export { AvailabilityGrid } from './availability-grid';
import { MaintenanceSchedule } from '@/components/dashboard/maintenance-schedule';

// Export des types d'alertes et d'activités
export type { Alert, AlertType } from './alerts-list';
export type { Activity, ActivityType } from './activities-list';
export type { MotoBay } from './availability-grid';
export type { MaintenanceScheduleItem } from '@/components/dashboard/maintenance-schedule';

// Export des composants de graphiques spécifiques
export { UsageChart } from './charts/usage-chart';
export { CostChart } from './charts/cost-chart';

// Export des types de graphiques
export type { UsageData } from './charts/usage-chart';
export type { CostData } from './charts/cost-chart';