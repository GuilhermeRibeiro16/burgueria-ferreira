//server component para buscar os dados necessários e passar para o client component
import { getSettings } from '@/lib/supabase/queries/settings'
import { getProducts } from '@/lib/supabase/queries/products'
import { HistoryClient } from './HistoryClient'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const [settings, products] = await Promise.all([
    getSettings(),
    getProducts(),
  ])

  return (
    <HistoryClient
      settings={settings}
      products={products ?? []}
    />
  )
}