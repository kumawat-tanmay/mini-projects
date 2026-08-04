import { apiFetch } from '@/utils/api';
import type { DashboardStats } from './types';

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  return await apiFetch('/dashboard/stats');
};
