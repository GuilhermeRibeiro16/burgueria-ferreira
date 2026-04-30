'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Order, OrderStatus, Settings, Product } from '@/types'
import { OrderCard }          from '@/components/admin/OrderCard'
import { useOrdersRealtime }  from '@/hooks/useOrdersRealtime'
import { Input }              from '@/components/ui/input'
import { Button }             from '@/components/ui/button'
import { formatCurrency }     from '@/lib/utils'

const ACTIVE_STATUSES:    OrderStatus[] = ['received', 'preparing', 'ready']
const DELIVERED_STATUSES: OrderStatus[] = ['delivered']

interface Props {
  initialOrders: Order[]
  settings:      Settings
  products:      Product[]  
}

export function OrdersClient({ initialOrders, settings, products }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')

  // Revalida dados via router.refresh() — busca novos dados do servidor
  const handleRefresh = useCallback(() => {
    startTransition(() => router.refresh())
  }, [router])

  // Realtime + fallback 30s
  useOrdersRealtime(handleRefresh)

  // Filtra por código de pedido
  const filtered = initialOrders.filter(o =>
    search ? o.code.toLowerCase().includes(search.toLowerCase()) : true
  )

  const activeOrders    = filtered
    .filter(o => ACTIVE_STATUSES.includes(o.status as OrderStatus))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const deliveredOrders = filtered
    .filter(o => DELIVERED_STATUSES.includes(o.status as OrderStatus))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Faturamento do dia (apenas entregues)
  const revenue = initialOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Pedidos de hoje
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Faturamento: {formatCurrency(revenue)}
            {isPending && ' · atualizando...'}
          </p>
        </div>

        <Button
          onClick={() => router.push('/admin/orders/new')}
          style={{ backgroundColor: 'var(--brand)', color: 'white' }}
        >
          <Plus size={16} className="mr-1" />
          Novo pedido
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search
          size={16}
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

      {/* Pedidos ativos */}
      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-subtle)' }}>
          Ativos ({activeOrders.length})
        </h2>

        {activeOrders.length === 0 ? (
          <div
            className="text-center py-10 rounded-xl border"
            style={{ color: 'var(--text-subtle)', borderColor: 'var(--border)' }}
          >
            Nenhum pedido ativo no momento
          </div>
        ) : (
          activeOrders.map(order => (
            <OrderCard key={order.id} order={order as Order} settings={settings} products={products} onRefresh={handleRefresh} />
          ))
        )}
      </section>

      {/* Pedidos entregues */}
      {deliveredOrders.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-subtle)' }}>
            Entregues ({deliveredOrders.length})
          </h2>
          {deliveredOrders.map(order => (
            <OrderCard key={order.id} order={order as Order} settings={settings} products={products} onRefresh={handleRefresh} />
          ))}
        </section>
      )}

    </div>
  )
}