import { getProducts, getCategories } from '@/lib/supabase/queries/products'
import { ProductsClient } from './ProductsClient'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ])

  return (
    <ProductsClient
      products={products   ?? []}
      categories={categories ?? []}
    />
  )
}