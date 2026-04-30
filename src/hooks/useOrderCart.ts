// hook para gerenciar o carrinho de pedidos no frontend
'use client'

import { useState } from 'react'
import { Product, ProductOption } from '@/types'

export interface CartItem {
  key:          string   // id único no carrinho
  product:      Product
  quantity:     number
  selectedOptions: ProductOption[]
}

export function useOrderCart() {
  const [items, setItems] = useState<CartItem[]>([])

  // Adiciona produto ao carrinho
  function addItem(product: Product, options: ProductOption[]) {
    const key = `${product.id}-${Date.now()}`
    setItems(prev => [...prev, { key, product, quantity: 1, selectedOptions: options }])
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
      return sum + (item.product.price + optionsTotal) * item.quantity
    }, 0)
    return itemsTotal + deliveryFee
  }

  return { items, addItem, removeItem, updateQuantity, getTotal }
}