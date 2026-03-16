import { CampusEvent } from './event.model';

export interface CategoryBreakdown {
  name: string;
  count: number;
}

export interface ActivityItem {
  title: string;
  detail: string;
  time: string;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface DashboardSummary {
  totalEvents: number;
  totalRegistrations: number;
  upcomingEvents: number;
  avgOccupancy: number;
  checkInRate: number;
  completionRate: number;
  topCategories: CategoryBreakdown[];
  featuredEvents: CampusEvent[];
  recentActivity: ActivityItem[];
  registrationTrend: TrendPoint[];
  attendanceTrend: TrendPoint[];
  modeBreakdown: TrendPoint[];
}
