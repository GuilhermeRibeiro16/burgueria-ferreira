import { getDashboardData } from '@/lib/supabase/queries/dashboard'
import { DashboardClient }  from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const data = await getDashboardData('daily')
  return <DashboardClient initialData={data} initialPeriod="daily" />
}