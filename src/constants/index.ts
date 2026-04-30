// Constantes do domínio — evita magic strings espalhadas pelo código

export const ORDER_STATUS_LABEL: Record<string, string> = {
  received:  'Recebido',
  preparing: 'Preparando',
  ready:     'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
}

export const ORDER_STATUS_COLOR: Record<string, string> = {
  received:  'bg-blue-500',
  preparing: 'bg-yellow-500',
  ready:     'bg-green-500',
  delivered: 'bg-gray-500',
  cancelled: 'bg-red-500',
}

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash:   'Dinheiro',
  pix:    'PIX',
  credit: 'Cartão de Crédito',
  debit:  'Cartão de Débito',
}

export const ORDER_TYPE_LABEL: Record<string, string> = {
  delivery: 'Entrega',
  pickup:   'Retirada',
}

export const CATEGORIES = ['Hambúrgueres', 'Pizzas', 'Bebidas', 'Fritas'] as const

// Fallback — sobrescrito pelas configurações do banco
export const DEFAULT_SETTINGS = {
  delivery_fee_city: 1.00,
  delivery_fee_outside: 2.00,
  receipt_footer: 'Deus é fiel, qualidade que faz rei',
}

import {
  ShoppingBag,
  History,
  LayoutDashboard,
  Package,
  Settings,
} from 'lucide-react'
import { NavItem } from '@/types/nav'

export const NAV_ITEMS: NavItem[] = [
  { label: 'Pedidos',    href: '/admin/orders',    icon: ShoppingBag     },
  { label: 'Histórico',  href: '/admin/history',   icon: History         },
  { label: 'Dashboard',  href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Produtos',   href: '/admin/products',  icon: Package         },
  { label: 'Ajustes',    href: '/admin/settings',  icon: Settings        },
]