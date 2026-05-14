// ============================================================
// TIPOS GLOBAIS DO SISTEMA
// Espelham exatamente as tabelas do banco — nunca confie
// em dados do frontend, sempre valide contra esses tipos
// ============================================================

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type OrderType = 'delivery' | 'pickup'
export type PaymentMethod = 'cash' | 'pix' | 'credit' | 'debit'
export type OptionGroupType = 'radio' | 'checkbox'

// ---------- Produtos ----------
export interface Category {
  id: string
  name: string
  deleted_at: string | null
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category_id: string
  available: boolean
  deleted_at: string | null
  category?: Category
  option_groups?: ProductOptionGroup[]
}

export interface ProductOptionGroup {
  id: string
  product_id: string
  name: string
  type: OptionGroupType
  max_select: number
  extra_price: number     // valor por adicional além do limite
  options?: ProductOption[]
}

export interface ProductOption {
  id: string
  group_id: string
  name: string
  price: number
  available: boolean
}

// ---------- Pedidos ----------
export interface Order {
  id: string
  code: string
  customer_name: string
  phone: string
  type: OrderType
  address: string | null
  delivery_fee: number
  status: OrderStatus
  total: number
  notes: string | null
  payment_method: PaymentMethod | null
  change_info: string | null
  created_at: string
  items?: OrderItem[]
   card_fee:        number  // percentual ex: 3
  card_fee_amount: number  // valor ex: 1.14

}

export interface OrderItem {
  id:           string
  order_id:     string
  product_id:   string | null
  product_name: string
  quantity:     number
  unit_price:   number
  split_with?:  string | null    
  product?:     { description: string | null }
  options?:     OrderItemOption[]
}

export interface OrderItemOption {
  id: string
  order_item_id: string
  option_name: string    // salvo no momento do pedido
  option_price: number   // salvo no momento do pedido
  quantity:     number  // ← adicionar
}

// ---------- Configurações ----------
export interface Settings {
  store_name: string
  delivery_fee_city: number
  delivery_fee_outside: number
  opening_hours: string
  instagram: string | null
  whatsapp: string | null
  pix_key: string | null
  receipt_footer: string
  receipt_footer_secondary: string | null
  card_fee_credit:          number  
  card_fee_debit:           number 
  logo_url: string | null
}