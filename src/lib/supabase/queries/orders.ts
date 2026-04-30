// Queries de pedidos — usadas em Server Components e Actions
import { createAdminClient } from '@/lib/supabase/admin'
import { getDayRange }  from '@/lib/utils'

// Busca todos os pedidos do dia atual
export async function getOrdersToday() {
  const supabase = createAdminClient()
  const { start, end } = getDayRange(new Date())

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items (
        *,
        options:order_item_options (*)
      )
    `)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Busca pedidos por data específica (histórico)
export async function getOrdersByDate(date: Date) {
  const supabase = createAdminClient()
  const { start, end } = getDayRange(date)

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items (
        *,
        options:order_item_options (*)
      )
    `)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Busca pedido por código
export async function getOrderByCode(code: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items (
        *,
        options:order_item_options (*)
      )
    `)
    .eq('code', code.toUpperCase())
    .single()

  if (error) throw error
  return data
}