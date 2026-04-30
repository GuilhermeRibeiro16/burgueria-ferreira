'use server'

import { revalidatePath }    from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateOrderCode, calcItemTotal } from '@/lib/utils'
import { OrderStatus } from '@/types'

// ============================================================
// CRIAR PEDIDO
// Total calculado aqui no servidor — nunca no frontend
// ============================================================
export async function createOrder(formData: {
  customer_name:  string
  phone:          string
  type:           'delivery' | 'pickup'
  address?:       string
  delivery_fee:   number
  payment_method: 'cash' | 'pix' | 'credit' | 'debit'
  change_info?:   string
  notes?:         string
  items: {
    product_id:  string
    quantity:    number
    options:     { option_id: string }[]
  }[]
}) {
  const supabase = createAdminClient()

  // Busca preços dos produtos no banco — nunca confia no frontend
  const productIds = formData.items.map(i => i.product_id)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price')
    .in('id', productIds)

  if (!products?.length) throw new Error('Produtos não encontrados')

  // Busca preços das opções no banco
  const optionIds = formData.items.flatMap(i => i.options.map(o => o.option_id))
  const { data: options } = optionIds.length
    ? await supabase.from('product_options').select('id, name, price').in('id', optionIds)
    : { data: [] }

  // Mapa para lookup rápido
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const optionMap  = Object.fromEntries((options ?? []).map(o => [o.id, o]))

  // Calcula total no servidor
  let total = formData.delivery_fee
  const itemsPayload = formData.items.map(item => {
    const product     = productMap[item.product_id]
    const itemOptions = item.options.map(o => optionMap[o.option_id]).filter(Boolean)
    const itemTotal   = calcItemTotal(
      product.price,
      item.quantity,
      itemOptions.map(o => o.price)
    )
    total += itemTotal
    return { product, quantity: item.quantity, options: itemOptions, unit_price: product.price }
  })

  // Gera código único
  let code = generateOrderCode()
  let attempts = 0
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from('orders').select('id').eq('code', code).single()
    if (!existing) break
    code = generateOrderCode()
    attempts++
  }

  // Insere pedido
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      code,
      customer_name:  formData.customer_name,
      phone:          formData.phone,
      type:           formData.type,
      address:        formData.address ?? null,
      delivery_fee:   formData.delivery_fee,
      payment_method: formData.payment_method,
      change_info:    formData.change_info ?? null,
      notes:          formData.notes ?? null,
      status:         'received',
      total,
    })
    .select()
    .single()

  if (orderError) throw orderError

  // Insere itens e opções
  for (const item of itemsPayload) {
    const { data: orderItem } = await supabase
      .from('order_items')
      .insert({
        order_id:     order.id,
        product_id:   item.product.id,
        product_name: item.product.name,
        quantity:     item.quantity,
        unit_price:   item.unit_price,
      })
      .select()
      .single()

    if (item.options.length && orderItem) {
      await supabase.from('order_item_options').insert(
        item.options.map(o => ({
          order_item_id: orderItem.id,
          option_name:   o.name,
          option_price:  o.price,
        }))
      )
    }
  }

  revalidatePath('/admin/orders')
  return { success: true, code }
}

// ============================================================
// ATUALIZAR STATUS
// ============================================================
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) throw error
  revalidatePath('/admin/orders')
}

// ============================================================
// CANCELAR PEDIDO (soft delete via status)
// ============================================================
export async function cancelOrder(orderId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)

  if (error) throw error
  revalidatePath('/admin/orders')
}

// ============================================================
// EDITAR PEDIDO
// Recalcula total no servidor — deleta itens antigos e reinsere
// ============================================================
export async function updateOrder(
  orderId: string,
  formData: {
    customer_name:  string
    phone:          string
    type:           'delivery' | 'pickup'
    address?:       string
    delivery_fee:   number
    payment_method: 'cash' | 'pix' | 'credit' | 'debit'
    change_info?:   string
    notes?:         string
    items: {
      product_id: string
      quantity:   number
      options:    { option_id: string }[]
    }[]
  }
) {
  const supabase = createAdminClient()

  // Busca preços no banco — nunca confia no frontend
  const productIds = formData.items.map(i => i.product_id)
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price')
    .in('id', productIds)

  if (!products?.length) throw new Error('Produtos não encontrados')

  const optionIds = formData.items.flatMap(i => i.options.map(o => o.option_id))
  const { data: options } = optionIds.length
    ? await supabase.from('product_options').select('id, name, price').in('id', optionIds)
    : { data: [] }

  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const optionMap  = Object.fromEntries((options ?? []).map(o => [o.id, o]))

  // Recalcula total
  let total = formData.delivery_fee
  const itemsPayload = formData.items.map(item => {
    const product     = productMap[item.product_id]
    const itemOptions = item.options.map(o => optionMap[o.option_id]).filter(Boolean)
    const itemTotal   = calcItemTotal(
      product.price,
      item.quantity,
      itemOptions.map(o => o.price)
    )
    total += itemTotal
    return { product, quantity: item.quantity, options: itemOptions, unit_price: product.price }
  })

  // Atualiza dados do pedido
  const { error: orderError } = await supabase
    .from('orders')
    .update({
      customer_name:  formData.customer_name,
      phone:          formData.phone,
      type:           formData.type,
      address:        formData.address ?? null,
      delivery_fee:   formData.delivery_fee,
      payment_method: formData.payment_method,
      change_info:    formData.change_info ?? null,
      notes:          formData.notes ?? null,
      total,
    })
    .eq('id', orderId)

  if (orderError) throw orderError

  // Deleta itens antigos — mais simples que fazer diff
  await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId)

  // Reinsere itens atualizados
  for (const item of itemsPayload) {
    const { data: orderItem } = await supabase
      .from('order_items')
      .insert({
        order_id:     orderId,
        product_id:   item.product.id,
        product_name: item.product.name,
        quantity:     item.quantity,
        unit_price:   item.unit_price,
      })
      .select()
      .single()

    if (item.options.length && orderItem) {
      await supabase.from('order_item_options').insert(
        item.options.map(o => ({
          order_item_id: orderItem.id,
          option_name:   o.name,
          option_price:  o.price,
        }))
      )
    }
  }

  revalidatePath('/admin/orders')
  return { success: true }
}