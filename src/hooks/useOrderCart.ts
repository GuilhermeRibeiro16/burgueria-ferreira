// hook para gerenciar o carrinho de pedidos no frontend
'use client'

import { useState } from 'react'
import { Product, ProductOption } from '@/types'

export interface CartItem {
  key:             string
  product:         Product
  quantity:        number
  selectedOptions: ProductOption[]
  splitWith:       Product | null   
}

//adiciona item ao carrinho, agora com suporte para dividir o pedido com outro produto
export function useOrderCart() {
  const [items, setItems] = useState<CartItem[]>([])

  function addItem(
    product:   Product,
    options:   ProductOption[],
    splitWith: Product | null  // ← adicionar
  ) {
    const key = `${product.id}-${Date.now()}`
    setItems(prev => [...prev, {
      key,
      product,
      quantity: 1,
      selectedOptions: options,
      splitWith,                // ← adicionar
    }])
  }


  // Remove item do carrinho
  function removeItem(key: string) {
    setItems(prev => prev.filter(i => i.key !== key))
  }

  // Atualiza quantidade
  function updateQuantity(key: string, quantity: number) {
    if (quantity < 1) return
    setItems(prev => prev.map(i => i.key === key ? { ...i, quantity } : i))
  }

  // Calcula total do carrinho
  function getTotal(deliveryFee: number): number {
    const itemsTotal = items.reduce((sum, item) => {
      const optionsTotal = item.selectedOptions.reduce((s, o) => s + o.price, 0)
      // Preço = maior valor entre os dois sabores
      const basePrice = item.splitWith
        ? Math.max(item.product.price, item.splitWith.price)
        : item.product.price
      return sum + (basePrice + optionsTotal) * item.quantity
    }, 0)
    return itemsTotal + deliveryFee
  }

  // resto permanece igual...
  return { items, addItem, removeItem, updateQuantity, getTotal }
}