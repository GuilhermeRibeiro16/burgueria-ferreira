import { getOrdersToday } from '@/lib/supabase/queries/orders'
import { getSettings }    from '@/lib/supabase/queries/settings'
import { getProducts }    from '@/lib/supabase/queries/products'
import { OrdersClient }   from './OrdersClient'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const [orders, settings, products] = await Promise.all([
    getOrdersToday(),
    getSettings(),
    getProducts(),
  ])

  return (
    <OrdersClient
      initialOrders={orders ?? []}
      settings={settings}
      products={products ?? []}
    />
  )
}