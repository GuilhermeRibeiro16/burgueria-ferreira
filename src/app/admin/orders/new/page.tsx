//server que busca os produtos e as configurações para a página de novo pedido
import { getProducts }  from '@/lib/supabase/queries/products'
import { getSettings }  from '@/lib/supabase/queries/settings'
import { NewOrderClient } from './NewOrderClient'

export const dynamic = 'force-dynamic'

export default async function NewOrderPage() {
  const [products, settings] = await Promise.all([
    getProducts(),
    getSettings(),
  ])

  return (
    <NewOrderClient
      products={products ?? []}
      settings={settings}
    />
  )
}