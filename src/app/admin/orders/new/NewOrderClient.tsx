'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Plus, Minus } from 'lucide-react'
import { Product, Settings } from '@/types'
import { ProductPicker }  from '@/components/admin/ProductPicker'
import { useOrderCart }   from '@/hooks/useOrderCart'
import { createOrder }    from '@/lib/actions/orders'
import { Input }          from '@/components/ui/input'
import { Label }          from '@/components/ui/label'
import { Button }         from '@/components/ui/button'
import { Separator }      from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { toast }          from 'sonner'

interface Props {
  products: Product[]
  settings: Settings
}

export function NewOrderClient({ products, settings }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const cart = useOrderCart()

  // Dados do cliente
  const [customerName,   setCustomerName]   = useState('')
  const [phone,          setPhone]          = useState('')
  const [type,           setType]           = useState<'delivery' | 'pickup'>('pickup')
  const [address,        setAddress]        = useState('')
  const [deliveryZone,   setDeliveryZone]   = useState<'city' | 'outside'>('city')
  const [paymentMethod,  setPaymentMethod]  = useState<'cash' | 'pix' | 'credit' | 'debit'>('cash')
  const [changeFor,      setChangeFor]      = useState('')  // valor que o cliente vai pagar
  const [notes,          setNotes]          = useState('')
const cardFee = paymentMethod === 'credit'
  ? settings.card_fee_credit
  : paymentMethod === 'debit'
  ? settings.card_fee_debit
  : 0

  const deliveryFee = type === 'delivery'
    ? (deliveryZone === 'city' ? settings.delivery_fee_city : settings.delivery_fee_outside)
    : 0

const subtotal    = cart.getTotal(deliveryFee)
const cardFeeAmt  = cardFee > 0 ? Math.round(subtotal * cardFee) / 100 : 0
const total       = subtotal + cardFeeAmt

  // Calcula troco
  const changeAmount = paymentMethod === 'cash' && changeFor
    ? parseFloat(changeFor.replace(',', '.')) - total
    : null

  async function handleSubmit() {
    if (!customerName.trim()) return toast.error('Informe o nome do cliente')
     {/* telefone é opcional, então não valida
      if (!phone.trim())         return toast.error('Informe o telefone')
      */}
    if (type === 'delivery' && !address.trim()) return toast.error('Informe o endereço')
    if (cart.items.length === 0) return toast.error('Adicione pelo menos um produto')

    startTransition(async () => {
      try {
        const result = await createOrder({
          customer_name:  customerName.trim(),
          phone:          '',
          type,
          address:        type === 'delivery' ? address.trim() : undefined,
          delivery_fee:   deliveryFee,
          payment_method: paymentMethod,
          change_info:    changeAmount !== null && changeAmount >= 0
            ? `Troco: ${formatCurrency(changeAmount)}`
            : undefined,
          notes: notes.trim() || undefined,
items: cart.items.map(item => ({
  product_id: item.product.id,
  quantity:   item.quantity,
  options:    item.selectedOptions.map(o => ({
    option_id: o.id,
    quantity:  o.quantity,  // ← adicionar
  })),
  split_with: item.splitWith?.name ?? null,
})),
          card_fee: cardFeeAmt,
        })

        toast.success(`Pedido ${result.code} criado!`)
        router.push('/admin/orders')
        router.refresh()
      } catch {
        toast.error('Erro ao criar pedido')
      }
    })
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Novo pedido
        </h1>
      </div>

      {/* Dados do cliente */}
      <div
        className="rounded-xl border p-4 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Cliente
        </p>

        <div className="flex flex-col gap-1.5">

            <Label style={{ color: 'var(--text-muted)' }}>Nome do Cliente</Label>
            <Input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="João Silva"
            />

          {/* 
          <div className="flex flex-col gap-1.5">
            <Label style={{ color: 'var(--text-muted)' }}>Telefone</Label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(82) 99999-9999"
            />
          </div>
          */}
        </div>

        {/* Tipo */}
        <div className="flex gap-2">
          {(['pickup', 'delivery'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: type === t ? 'var(--brand)' : 'var(--bg-muted)',
                color:           type === t ? 'white' : 'var(--text-muted)',
              }}
            >
              {t === 'pickup' ? 'Retirada' : 'Entrega'}
            </button>
          ))}
        </div>

        {/* Entrega */}
        {type === 'delivery' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label style={{ color: 'var(--text-muted)' }}>Endereço</Label>
              <Input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Rua, número, bairro..."
              />
            </div>

            <div className="flex gap-2">
              {([
                { value: 'city',    label: `Cidade ${formatCurrency(settings.delivery_fee_city)}`    },
                { value: 'outside', label: `Fora ${formatCurrency(settings.delivery_fee_outside)}`   },
              ] as const).map(zone => (
                <button
                  key={zone.value}
                  onClick={() => setDeliveryZone(zone.value)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: deliveryZone === zone.value ? 'var(--brand)' : 'var(--bg-muted)',
                    color:           deliveryZone === zone.value ? 'white' : 'var(--text-muted)',
                  }}
                >
                  {zone.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Produtos */}
      <div
        className="rounded-xl border p-4 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Produtos
        </p>

        <ProductPicker
  products={products}
  onAdd={(product, options, splitWith) =>
    cart.addItem(product, options, splitWith)
  }
/>

        {/* Itens no carrinho */}
        {cart.items.length > 0 && (
          <>
            <Separator style={{ backgroundColor: 'var(--border)' }} />
            <div className="flex flex-col gap-3">
            {cart.items.map(item => {
              const basePrice    = item.splitWith
                ? Math.max(item.product.price, item.splitWith.price)
                : item.product.price
              const optionsTotal = item.selectedOptions.reduce((s, o) => s + o.price, 0)
              const itemTotal    = (basePrice + optionsTotal) * item.quantity

  return (
    <div key={item.key} className="flex items-start justify-between gap-2">
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {item.product.name}
          {item.splitWith && (
            <span style={{ color: 'var(--text-muted)' }}>
              {' '}/ {item.splitWith.name}
            </span>
          )}
        </p>
{item.selectedOptions.map(o => (
  <p key={o.id} className="text-xs" style={{ color: 'var(--text-subtle)' }}>
    + {o.quantity > 1 ? `${o.quantity}x ` : ''}{o.name}{' '}
    {o.price > 0 ? formatCurrency(o.price * o.quantity) : ''}
  </p>
))}

        <p className="text-xs mt-0.5" style={{ color: 'var(--brand)' }}>
          {formatCurrency(itemTotal)}
        </p>
      </div>

                    {/* Controle de quantidade */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => cart.updateQuantity(item.key, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-sm w-4 text-center" style={{ color: 'var(--text-primary)' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => cart.updateQuantity(item.key, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => cart.removeItem(item.key)}
                        style={{ color: 'var(--error)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagamento */}
      <div
        className="rounded-xl border p-4 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          Pagamento
        </p>

        <Select
          value={paymentMethod}
          onValueChange={v => setPaymentMethod(v as typeof paymentMethod)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">Dinheiro</SelectItem>
            <SelectItem value="pix">PIX</SelectItem>
            <SelectItem value="credit">Cartão de Crédito</SelectItem>
            <SelectItem value="debit">Cartão de Débito</SelectItem>
          </SelectContent>
        </Select>

        {/* Troco — só aparece para dinheiro */}
        {paymentMethod === 'cash' && (
          <div className="flex flex-col gap-1.5">
            <Label style={{ color: 'var(--text-muted)' }}>
              Cliente vai pagar com quanto? (opcional)
            </Label>
            <Input
              type="number"
              value={changeFor}
              onChange={e => setChangeFor(e.target.value)}
              placeholder="50.00"
            />
            {changeAmount !== null && changeAmount >= 0 && (
              <p className="text-sm" style={{ color: 'var(--success)' }}>
                Troco: {formatCurrency(changeAmount)}
              </p>
            )}
            {changeAmount !== null && changeAmount < 0 && (
              <p className="text-sm" style={{ color: 'var(--error)' }}>
                Valor insuficiente
              </p>
            )}
          </div>
        )}
        {/* Taxa do cartão — só aparece para crédito e débito */}
        {cardFee > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Taxa {paymentMethod === 'credit' ? 'crédito' : 'débito'} ({cardFee}%)
            </span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {formatCurrency(cardFeeAmt)}
            </span>
          </div>
        )}

        {/* Observação */}
        <div className="flex flex-col gap-1.5">
          <Label style={{ color: 'var(--text-muted)' }}>Observação (opcional)</Label>
          <Input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Sem cebola, ponto da carne..."
          />
        </div>
      </div>

      {/* Total e confirmar */}
      <div
        className="rounded-xl border p-4 flex flex-col gap-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Subtotal
          </span>
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(cart.getTotal(0))}
          </span>
        </div>

        {type === 'delivery' && (
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Taxa de entrega
            </span>
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {formatCurrency(deliveryFee)}
            </span>
          </div>
        )}

        <Separator style={{ backgroundColor: 'var(--border)' }} />

        <div className="flex justify-between items-center">
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Total
          </span>
          <span className="text-lg font-bold" style={{ color: 'var(--brand)' }}>
            {formatCurrency(total)}
          </span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full font-semibold h-11"
          style={{ backgroundColor: 'var(--brand)', color: 'white' }}
        >
          {isPending ? 'Criando pedido...' : 'Confirmar pedido'}
        </Button>
      </div>

    </div>
  )
}