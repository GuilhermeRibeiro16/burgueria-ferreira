import { createAdminClient } from '@/lib/supabase/admin'
import { getDayRange }       from '@/lib/utils'

export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface ChartPoint {
  period:  string
  revenue: number
  orders:  number
}

export interface DashboardData {
  revenue:       number
  ordersCount:   number
  deliveredCount: number
  avgTicket:     number
  chartData:     ChartPoint[]
  topProducts:   { name: string; quantity: number }[]
  peakHours:     { hour: string; orders: number }[]
}

// Retorna start e end date baseado no período
function getPeriodRange(period: Period): { start: Date; end: Date } {
  const now   = new Date()
  const start = new Date(now)

  if (period === 'daily') {
    start.setHours(0, 0, 0, 0)
    return { start, end: now }
  }
  if (period === 'weekly') {
    start.setDate(now.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    return { start, end: now }
  }
  if (period === 'monthly') {
    start.setDate(now.getDate() - 29)
    start.setHours(0, 0, 0, 0)
    return { start, end: now }
  }
  // yearly
  start.setFullYear(now.getFullYear() - 1)
  start.setHours(0, 0, 0, 0)
  return { start, end: now }
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function getDashboardData(period: Period): Promise<DashboardData> {
  const supabase       = createAdminClient()
  const { start, end } = getPeriodRange(period)

  const startStr = toDateString(start)
  const endStr   = toDateString(end)

  // Busca gráfico via função SQL
  const { data: chartRaw } = period === 'daily'
    ? await supabase.rpc('get_dashboard_by_hour', { target_date: startStr })
    : await supabase.rpc('get_dashboard_by_day',  { start_date: startStr, end_date: endStr })

  // Busca pedidos entregues para métricas
  const { start: rangeStart, end: rangeEnd } = getDayRange(start)
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id, total, status, created_at,
      items:order_items ( product_name, quantity )
    `)
    .eq('status', 'delivered')
    .gte('created_at', period === 'daily' ? rangeStart : start.toISOString())
    .lte('created_at', end.toISOString())

  const delivered = orders ?? []

  // Métricas gerais
  const revenue       = delivered.reduce((s, o) => s + o.total, 0)
  const deliveredCount = delivered.length
  const avgTicket     = deliveredCount > 0 ? revenue / deliveredCount : 0

  // Produtos mais vendidos
  const productMap: Record<string, number> = {}
  delivered.forEach(order => {
    order.items?.forEach((item: any) => {
      productMap[item.product_name] = (productMap[item.product_name] ?? 0) + item.quantity
    })
  })
  const topProducts = Object.entries(productMap)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  // Horários de pico — agrupa por hora
  const hourMap: Record<string, number> = {}
  delivered.forEach(order => {
    const hour = new Date(order.created_at)
      .toLocaleTimeString('pt-BR', {
        hour:     '2-digit',
        timeZone: 'America/Recife',
      })
      .slice(0, 2) + 'h'
    hourMap[hour] = (hourMap[hour] ?? 0) + 1
  })
  const peakHours = Object.entries(hourMap)
    .map(([hour, orders]) => ({ hour, orders }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5)

  // Formata dados do gráfico
  const chartData: ChartPoint[] = (chartRaw ?? []).map((row: any) => ({
    period:  period === 'daily'
      ? new Date(row.period).toLocaleTimeString('pt-BR', {
          hour: '2-digit', minute: '2-digit', timeZone: 'America/Recife'
        })
      : new Date(row.period).toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', timeZone: 'America/Recife'
        }),
    revenue: Number(row.revenue),
    orders:  Number(row.orders),
  }))

  return {
    revenue,
    ordersCount:    delivered.length,
    deliveredCount,
    avgTicket,
    chartData,
    topProducts,
    peakHours,
  }
}