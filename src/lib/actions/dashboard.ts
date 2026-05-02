'use server'

import { getDashboardData, Period } from '@/lib/supabase/queries/dashboard'

export async function fetchDashboardData(period: Period) {
  return getDashboardData(period)
}