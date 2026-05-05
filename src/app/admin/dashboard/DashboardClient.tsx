'use client'

import { useState, useTransition } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { TrendingUp, ShoppingBag, CheckCircle, Receipt, Loader2 } from 'lucide-react'
import { DashboardData, Period } from '@/lib/supabase/queries/dashboard'
import { formatCurrency } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchDashboardData } from '@/lib/actions/dashboard'
import { toast } from 'sonner'

const PERIOD_LABELS: Record<Period, string> = {
  daily:   'Hoje',
  weekly:  '7 dias',
  monthly: '30 dias',
  yearly:  '1 ano',
}

interface Props {
  initialData:   DashboardData
  initialPeriod: Period
}

// Card de métrica reutilizável
function MetricCard({
  label, value, icon: Icon
}: {
  label: string
  value: string
  icon:  React.ElementType
}) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-2"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <Icon size={16} style={{ color: 'var(--brand)' }} />
      </div>
      <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  )
}

export function DashboardClient({ initialData, initialPeriod }: Props) {
  const [data,      setData]      = useState<DashboardData>(initialData)
  const [period,    setPeriod]    = useState<Period>(initialPeriod)
  const [isPending, startTransition] = useTransition()

  async function handlePeriodChange(newPeriod: Period) {
    setPeriod(newPeriod)
    startTransition(async () => {
      try {
        const newData = await fetchDashboardData(newPeriod)
        setData(newData)
      } catch {
        toast.error('Erro ao carregar dados')
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        {isPending && (
          <Loader2 size={18} className="animate-spin" style={{ color: 'var(--brand)' }} />
        )}
      </div>

      {/* Seletor de período */}
      <div
        className="flex rounded-xl p-1 gap-1"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button
            key={p}
            onClick={() => handlePeriodChange(p)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: period === p ? 'var(--brand)' : 'transparent',
              color:           period === p ? 'white' : 'var(--text-muted)',
            }}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Faturamento"
          value={formatCurrency(data.revenue)}
          icon={TrendingUp}
        />
        <MetricCard
          label="Pedidos"
          value={data.ordersCount.toString()}
          icon={ShoppingBag}
        />
        <MetricCard
          label="Entregues"
          value={data.deliveredCount.toString()}
          icon={CheckCircle}
        />
        <MetricCard
          label="Ticket médio"
          value={formatCurrency(data.avgTicket)}
          icon={Receipt}
        />
      </div>

      {/* Gráfico */}
      <div
        className="rounded-xl border p-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Faturamento {period === 'daily' ? 'por hora' : 'por dia'}
        </p>

        {data.chartData.length === 0 ? (
          <div
            className="flex items-center justify-center h-40 text-sm"
            style={{ color: 'var(--text-subtle)' }}
          >
            Sem dados neste período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="oklch(65% 0.18 40)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(65% 0.18 40)" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(25% 0.005 240)"
                vertical={false}
              />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 10, fill: 'oklch(50% 0.01 240)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'oklch(50% 0.01 240)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `R$${v}`}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'oklch(14% 0.005 240)',
                  border:          '1px solid oklch(25% 0.005 240)',
                  borderRadius:    '8px',
                  fontSize:        '12px',
                  color:           'oklch(95% 0.005 240)',
                }}
                  formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Faturamento']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="oklch(65% 0.18 40)"
                strokeWidth={2}
                fill="url(#brandGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Produtos mais vendidos */}
      {data.topProducts.length > 0 && (
        <div
          className="rounded-xl border p-4 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Produtos mais vendidos
          </p>

          {data.topProducts.map((product, index) => {
            const max = data.topProducts[0].quantity
            const pct = Math.round((product.quantity / max) * 100)
            return (
              <div key={product.name} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-primary)' }}>
                    {index + 1}. {product.name}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {product.quantity} un.
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-muted)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width:           `${pct}%`,
                      backgroundColor: 'var(--brand)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Horários de pico */}
      {data.peakHours.length > 0 && (
        <div
          className="rounded-xl border p-4 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Horários de pico
          </p>

          <div className="grid grid-cols-5 gap-2">
            {data.peakHours.map(({ hour, orders }) => (
              <div
                key={hour}
                className="flex flex-col items-center gap-1 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--bg-muted)' }}
              >
                <span className="text-sm font-bold" style={{ color: 'var(--brand)' }}>
                  {orders}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                  {hour}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}