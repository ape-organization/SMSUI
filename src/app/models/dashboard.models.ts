/** Colour tones defined in styles/tokens.css; applied with the `data-tone` attribute. */
export type Tone = 'navy' | 'blue' | 'green' | 'red';

export interface StatMetric {
  label: string;
  value: number;
  /** Percentage change versus the previous period. */
  trend: number;
  icon: string;
  tone: Tone;
  /** True when a decrease is the desired outcome (e.g. failures). */
  lowerIsBetter?: boolean;
}

export type ActivityStatus = 'success' | 'info' | 'error';

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: ActivityStatus;
}

export interface SecurityOverview {
  twoFactorEnabled: boolean;
  passwordUpdatedAt: string | null;
  lastLoginAt: string | null;
}

export interface DashboardSummary {
  stats: StatMetric[];
  activity: ActivityItem[];
  security: SecurityOverview;
}
