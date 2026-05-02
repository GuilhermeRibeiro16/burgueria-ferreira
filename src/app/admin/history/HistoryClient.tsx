/// Componente cliente para a página de histórico
'use client'

import { useState, useTransition } from 'react'
import { Search, CalendarDays, Loader2 } from 'lucide-react'
import { Order, Product, Settings } from '@/types'
import { OrderCard }    from '@/components/admin/OrderCard'
import { Input }        from '@/components/ui/input'
import { Button }       from '@/components/ui/button'
import { formatCurrency, formatDate, getDayRange } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast }        from 'sonner'

interface Props {
  settings: Settings
  products: Product[]
}

export function HistoryClient({ settings, products }: Props) {
  // Data selecionada — padrão: hoje
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  )
  const [orders,    setOrders]    = useState<Order[]>([])
  const [search,    setSearch]    = useState('')
  const [loading,   setLoading]   = useState(false)
  const [searched,  setSearched]  = useState(false)
  const [, startTransition] = useTransition()

  const supabase = createClient()

  // Busca pedidos pela data selecionada direto do cliente
  // Histórico não precisa de Realtime — dados do passado não mudam
 async function handleSearch() {
  setLoading(true)
  setSearched(true)

  try {
    const date = new Date(selectedDate + 'T12:00:00-03:00')
    const { start, end } = getDayRange(date)

    console.log('Buscando entre:', start, 'e', end)

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          *,
          product:products ( description ),
          options:order_item_options (*)
        )
      `)
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false })

    console.log('Resultado:', data, 'Erro:', error)

    if (error) throw error
    setOrders(data ?? [])
  } catch (err) {
    console.error('Erro completo:', err)
    toast.error('Erro ao buscar pedidos')
  } finally {
    setLoading(false)
  }
}
  // Filtra por código localmente
  const filtered = orders.filter(o =>
    search ? o.code.toLowerCase().includes(search.toLowerCase()) : true
  )

  // Métricas do dia
  const delivered = filtered.filter(o => o.status === 'delivered')
  const revenue   = delivered.reduce((sum, o) => sum + o.total, 0)
  const cancelled = filtered.filter(o => o.status === 'cancelled').length

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Histórico
      </h1>

      {/* Seletor de data */}
      <div
        className="rounded-xl border p-4 flex flex-col gap-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <CalendarDays size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Selecionar data
          </span>
        </div>

        <div className="flex gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={loading}
            style={{ backgroundColor: 'var(--brand)', color: 'white' }}
          >
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : 'Buscar'
            }
          </Button>
        </div>
      </div>

      {/* Métricas do dia */}
      {searched && !loading && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Faturamento', value: formatCurrency(revenue) },
            { label: 'Entregues',   value: delivered.length.toString() },
            { label: 'Cancelados',  value: cancelled.toString() },
          ].map(metric => (
            <div
              key={metric.label}
              className="rounded-xl border p-3 text-center"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <p className="text-lg font-bold" style={{ color: 'var(--brand)' }}>
                {metric.value}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Busca por código */}
      {searched && orders.length > 0 && (
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-subtle)' }}
          />
          <Input
            placeholder="Buscar por código (#A1B2)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Lista de pedidos */}
      {searched && !loading && (
        <section className="flex flex-col gap-2">
          <h2
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--text-subtle)' }}
          >
            {selectedDate.split('-').reverse().join('/')} · {filtered.length} pedido{filtered.length !== 1 ? 's' : ''}
          </h2>

          {filtered.length === 0 ? (
            <div
              className="text-center py-12 rounded-xl border"
              style={{ color: 'var(--text-subtle)', borderColor: 'var(--border)' }}
            >
              Nenhum pedido encontrado nesta data
            </div>
          ) : (
            filtered.map(order => (
              <OrderCard
                key={order.id}
                order={order as Order}
                settings={settings}
                products={products}
                onRefresh={handleSearch}
                readonly
              />
            ))
          )}
        </section>
      )}

      {/* Estado inicial */}
      {!searched && (
        <div
          className="text-center py-16 rounded-xl border"
          style={{ color: 'var(--text-subtle)', borderColor: 'var(--border)' }}
        >
          Selecione uma data para ver os pedidos
        </div>
      )}

    </div>
  )
}