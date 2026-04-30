'use client'

import { useState } from 'react'
import { generateReceiptHTML } from './OrderReceipt'
import { printReceipt }        from '@/lib/print'
import { ChevronDown, ChevronUp, Phone, MapPin, Printer, X, ArrowRight, Pencil } from 'lucide-react'
import { Order, OrderStatus, Settings, Product } from '@/types'
import { StatusBadge } from './StatusBadge'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { updateOrderStatus, cancelOrder } from '@/lib/actions/orders'
import { ORDER_TYPE_LABEL, PAYMENT_METHOD_LABEL } from '@/constants'
import { toast } from 'sonner'
import { EditOrderSheet } from './EditOrderSheet'


const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  received:  'preparing',
  preparing: 'ready',
  ready:     'delivered',
}

const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  received:  'Iniciar preparo',
  preparing: 'Marcar como pronto',
  ready:     'Confirmar entrega',
}
interface OrderCardProps {
  order:     Order
  settings:  Settings
  products:  Product[]
  onRefresh: () => void
}

export function OrderCard({ order, settings, products, onRefresh }: OrderCardProps) {
  const [expanded,  setExpanded]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [editOpen, setEditOpen] = useState(false)


  const nextStatus = NEXT_STATUS[order.status]

  async function handleAdvance() {
    if (!nextStatus) return
    setLoading(true)
    try {
      await updateOrderStatus(order.id, nextStatus)
      onRefresh()
      toast.success('Status atualizado')
    } catch {
      toast.error('Erro ao atualizar status')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!confirm('Cancelar este pedido?')) return
    setLoading(true)
    try {
      await cancelOrder(order.id)
      onRefresh()
      toast.success('Pedido cancelado')
    } catch {
      toast.error('Erro ao cancelar')
    } finally {
      setLoading(false)
    }
  }

  // Gera e imprime o recibo
function handlePrint() {
  const html = generateReceiptHTML({ order, settings })
  printReceipt(html)
}

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor:     'var(--border)',
      }}
    >
      {/* Header do card */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-sm" style={{ color: 'var(--brand)' }}>
            {order.code}
          </span>
          <StatusBadge status={order.status as OrderStatus} />
          <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
            {formatDateTime(order.created_at)}
          </span>
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          style={{ color: 'var(--text-muted)' }}
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Linha de info rápida */}
      <div
        className="flex items-center justify-between px-4 pb-3 gap-2"
      >
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {order.customer_name}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {ORDER_TYPE_LABEL[order.type]} · {formatCurrency(order.total)}
          </p>
        </div>

        {/* Ações rápidas */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditOpen(true)}
              className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >
              <Pencil size={16} />
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >
              <Printer size={16} />
            </button>

            <button
              onClick={handleCancel}
              disabled={loading}
              className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: 'var(--error)' }}
            >
              <X size={16} />
            </button>

            {nextStatus && (
              <Button
                size="sm"
                disabled={loading}
                onClick={handleAdvance}
                className="text-xs h-8 font-medium"
                style={{ backgroundColor: 'var(--brand)', color: 'white' }}
              >
                {NEXT_STATUS_LABEL[order.status as OrderStatus]}
                <ArrowRight size={14} className="ml-1" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Detalhes expandidos */}
      {expanded && (
        <div
          className="px-4 pb-4 flex flex-col gap-3 border-t pt-3"
          style={{ borderColor: 'var(--border)' }}
        >
          {/* Contato e entrega */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Phone size={13} />
              {order.phone}
            </div>
            {order.address && (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <MapPin size={13} />
                {order.address}
              </div>
            )}
          </div>

          {/* Itens */}
          <div className="flex flex-col gap-2">
            {order.items?.map(item => (
              <div key={item.id}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-primary)' }}>
                    {item.quantity}x {item.product_name}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {formatCurrency(item.unit_price * item.quantity)}
                  </span>
                </div>
                {item.options?.map(opt => (
                  <div key={opt.id} className="flex justify-between text-xs pl-3" style={{ color: 'var(--text-subtle)' }}>
                    <span>+ {opt.option_name}</span>
                    {opt.option_price > 0 && (
                      <span>{formatCurrency(opt.option_price)}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Observação */}
          {order.notes && (
            <div
              className="text-xs rounded-lg px-3 py-2"
              style={{
                backgroundColor: 'var(--bg-muted)',
                color:           'var(--text-muted)',
              }}
            >
              📝 {order.notes}
            </div>
          )}

          {/* Pagamento */}
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>
              {order.payment_method ? PAYMENT_METHOD_LABEL[order.payment_method] : '—'}
              {order.change_info && ` · ${order.change_info}`}
            </span>
            {order.delivery_fee > 0 && (
              <span>Taxa: {formatCurrency(order.delivery_fee)}</span>
            )}
          </div>
        </div>
      )}
      <EditOrderSheet
  order={order}
  products={products}
  settings={settings}
  open={editOpen}
  onClose={() => setEditOpen(false)}
  onRefresh={onRefresh}
/>
    </div>
  )
}