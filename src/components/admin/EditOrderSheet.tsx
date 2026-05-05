'use client'

import { useState, useTransition } from 'react'
import { Order, Product, Settings } from '@/types'
import { updateOrder } from '@/lib/actions/orders'
import { ProductPicker } from './ProductPicker'
import { useOrderCart }  from '@/hooks/useOrderCart'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input }     from '@/components/ui/input'
import { Label }     from '@/components/ui/label'
import { Button }    from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Trash2, Plus, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  order:     Order
  products:  Product[]
  settings:  Settings
  open:      boolean
  onClose:   () => void
  onRefresh: () => void
}

export function EditOrderSheet({
  order, products, settings, open, onClose, onRefresh
}: Props) {
  const [isPending, startTransition] = useTransition()
  const cart = useOrderCart()

  // Dados do cliente
  const [customerName,  setCustomerName]  = useState(order.customer_name)
  const [phone,         setPhone]         = useState(order.phone)
  const [type,          setType]          = useState<'delivery' | 'pickup'>(order.type)
  const [address,       setAddress]       = useState(order.address ?? '')
  const [deliveryZone,  setDeliveryZone]  = useState<'city' | 'outside'>(
    order.delivery_fee === settings.delivery_fee_outside ? 'outside' : 'city'
  )
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'credit' | 'debit'>(
    order.payment_method ?? 'cash'
  )
  const [changeFor,     setChangeFor]     = useState('')
  const [notes,         setNotes]         = useState(order.notes ?? '')

  // Inicializa carrinho com itens atuais do pedido
  // Usamos estado local para não conflitar com o hook
  const [cartItems, setCartItems] = useState(() =>
    order.items?.map(item => ({
      key:      item.id,
      productId: item.product_id ?? '',
      name:     item.product_name,
      price:    item.unit_price,
      quantity: item.quantity,
      options:  item.options?.map(o => ({
        id:    o.id,
        name:  o.option_name,
        price: o.option_price,
      })) ?? [],
    })) ?? []
  )

  const deliveryFee = type === 'delivery'
    ? (deliveryZone === 'city' ? settings.delivery_fee_city : settings.delivery_fee_outside)
    : 0

    const cardFee = paymentMethod === 'credit'
  ? settings.card_fee_credit
  : paymentMethod === 'debit'
  ? settings.card_fee_debit
  : 0

const subtotal   = cartItems.reduce((sum, item) => {
  const optTotal = item.options.reduce((s, o) => s + o.price, 0)
  return sum + (item.price + optTotal) * item.quantity
}, 0) + deliveryFee

const cardFeeAmt = cardFee > 0 ? Math.round(subtotal * cardFee) / 100 : 0
const total      = subtotal + cardFeeAmt

  const changeAmount = paymentMethod === 'cash' && changeFor
    ? parseFloat(changeFor.replace(',', '.')) - total
    : null

  function handleAddProduct(product: Product, options: any[]) {
    setCartItems(prev => [...prev, {
      key:       `new-${Date.now()}`,
      productId: product.id,
      name:      product.name,
      price:     product.price,
      quantity:  1,
      options:   options.map(o => ({ id: o.id, name: o.name, price: o.price })),
    }])
  }
  

  function removeItem(key: string) {
    setCartItems(prev => prev.filter(i => i.key !== key))
  }

  function updateQty(key: string, qty: number) {
    if (qty < 1) return
    setCartItems(prev => prev.map(i => i.key === key ? { ...i, quantity: qty } : i))
  }

  async function handleSave() {
    if (!customerName.trim()) return toast.error('Informe o nome do cliente')
    if (!phone.trim())         return toast.error('Informe o telefone')
    if (type === 'delivery' && !address.trim()) return toast.error('Informe o endereço')
    if (cartItems.length === 0) return toast.error('Adicione pelo menos um produto')

    startTransition(async () => {
      try {
        await updateOrder(order.id, {
          customer_name:  customerName.trim(),
          phone:          phone.trim(),
            card_fee: cardFee,  
          type,
          address:        type === 'delivery' ? address.trim() : undefined,
          delivery_fee:   deliveryFee,
          payment_method: paymentMethod,
          change_info:    changeAmount !== null && changeAmount >= 0
            ? `Troco: ${formatCurrency(changeAmount)}`
            : undefined,
          notes: notes.trim() || undefined,
          items: cartItems.map(item => ({
            product_id: item.productId,
            quantity:   item.quantity,
            // Para itens novos temos option.id real
            // Para itens existentes precisamos do option_id original
            options: item.options.map(o => ({ option_id: o.id })),
          })),
        })

        toast.success('Pedido atualizado!')
        onRefresh()
        onClose()
      } catch {
        toast.error('Erro ao atualizar pedido')
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <SheetHeader>
          <SheetTitle style={{ color: 'var(--text-primary)' }}>
            Editar pedido {order.code}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 mt-6">

          {/* Cliente */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Cliente
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label style={{ color: 'var(--text-muted)' }}>Nome</Label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label style={{ color: 'var(--text-muted)' }}>Telefone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
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

            {/* Endereço */}
            {type === 'delivery' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label style={{ color: 'var(--text-muted)' }}>Endereço</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  {([
                    { value: 'city',    label: `Cidade ${formatCurrency(settings.delivery_fee_city)}`  },
                    { value: 'outside', label: `Fora ${formatCurrency(settings.delivery_fee_outside)}` },
                  ] as const).map(zone => (
                    <button
                      key={zone.value}
                      onClick={() => setDeliveryZone(zone.value)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium"
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

          <Separator style={{ backgroundColor: 'var(--border)' }} />

          {/* Produtos */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Produtos
            </p>

            {/* Itens atuais */}
            {cartItems.map(item => {
              const optTotal  = item.options.reduce((s, o) => s + o.price, 0)
              const itemTotal = (item.price + optTotal) * item.quantity
              return (
                <div key={item.key} className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.name}
                    </p>
                    {item.options.map((o, i) => (
                      <p key={i} className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                        + {o.name} {o.price > 0 ? formatCurrency(o.price) : ''}
                      </p>
                    ))}
                    <p className="text-xs mt-0.5" style={{ color: 'var(--brand)' }}>
                      {formatCurrency(itemTotal)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.key, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm w-4 text-center" style={{ color: 'var(--text-primary)' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.key, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}
                    >
                      <Plus size={12} />
                    </button>
                    <button onClick={() => removeItem(item.key)} style={{ color: 'var(--error)' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}

            <Separator style={{ backgroundColor: 'var(--border)' }} />

            {/* Adicionar produto */}
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Adicionar produto
            </p>
            <ProductPicker products={products} onAdd={handleAddProduct} />
          </div>

          <Separator style={{ backgroundColor: 'var(--border)' }} />

          {/* Pagamento */}
          <div className="flex flex-col gap-3">
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
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label style={{ color: 'var(--text-muted)' }}>Observação</Label>
              <Input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Sem cebola..."
              />
            </div>
          </div>

          <Separator style={{ backgroundColor: 'var(--border)' }} />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              Total
            </span>
            <span className="text-lg font-bold" style={{ color: 'var(--brand)' }}>
              {formatCurrency(total)}
            </span>
          </div>

          <Button
            onClick={handleSave}
            disabled={isPending}
            className="w-full font-semibold h-11"
            style={{ backgroundColor: 'var(--brand)', color: 'white' }}
          >
            {isPending ? 'Salvando...' : 'Salvar alterações'}
          </Button>

        </div>
      </SheetContent>
    </Sheet>
  )
}