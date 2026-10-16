export interface TrendPoint {
  label: string;
  value: number;
}

export type KpiId = 'attendance' | 'avgHours' | 'overtime' | 'punctuality';

export interface Kpi {
  id: KpiId;
  label: string;
  description: string;
  value: string;
  unit?: string;
  /** Variation vs période précédente, en % (positif = hausse) */
  delta: number;
  /** Une hausse est-elle une bonne chose ? */
  positiveIsGood: boolean;
  trend: TrendPoint[];
}
