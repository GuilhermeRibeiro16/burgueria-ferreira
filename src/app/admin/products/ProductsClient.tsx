'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Product, Category } from '@/types'
import { ProductForm } from '@/components/admin/ProductForm'
import { Button }      from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,
} from '@/lib/actions/products'
import { formatCurrency } from '@/lib/utils'
import { toast }          from 'sonner'
import Image              from 'next/image'

interface Props {
  products:   Product[]
  categories: Category[]
}

export function ProductsClient({ products, categories }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [sheetOpen,      setSheetOpen]      = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formLoading,    setFormLoading]    = useState(false)

  // Agrupa produtos por categoria
  const grouped = categories.map(cat => ({
    category: cat,
    products: products.filter(p => p.category_id === cat.id),
  })).filter(g => g.products.length > 0)

  // Produtos sem categoria
  const uncategorized = products.filter(
    p => !categories.some(c => c.id === p.category_id)
  )

  function openCreate() {
    setEditingProduct(null)
    setSheetOpen(true)
  }

  function openEdit(product: Product) {
    setEditingProduct(product)
    setSheetOpen(true)
  }

  async function handleSave(data: any) {
    setFormLoading(true)
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data)
        toast.success('Produto atualizado!')
      } else {
        await createProduct(data)
        toast.success('Produto criado!')
      }
      setSheetOpen(false)
      startTransition(() => router.refresh())
    } catch {
      toast.error('Erro ao salvar produto')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm('Remover este produto?')) return
    try {
      await deleteProduct(productId)
      toast.success('Produto removido')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Erro ao remover produto')
    }
  }

  async function handleToggle(productId: string, current: boolean) {
    try {
      await toggleProductAvailability(productId, !current)
      startTransition(() => router.refresh())
    } catch {
      toast.error('Erro ao atualizar disponibilidade')
    }
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Produtos
        </h1>
        <Button
          onClick={openCreate}
          style={{ backgroundColor: 'var(--brand)', color: 'white' }}
        >
          <Plus size={16} className="mr-1" />
          Novo produto
        </Button>
      </div>

      {/* Lista por categoria */}
      {grouped.map(({ category, products: catProducts }) => (
        <section key={category.id} className="flex flex-col gap-2">
          <h2
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--text-subtle)' }}
          >
            {category.name} ({catProducts.length})
          </h2>

          <div className="flex flex-col gap-2">
            {catProducts.map(product => (
              <div
                key={product.id}
                className="rounded-xl border flex items-center gap-3 p-3"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor:     'var(--border)',
                  opacity:         product.available ? 1 : 0.6,
                }}
              >
                {/* Imagem */}
                {product.image_url ? (
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl"
                    style={{ backgroundColor: 'var(--bg-muted)' }}
                  >
                    🍔
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {product.name}
                  </p>
                  {product.description && (
                    <p className="text-xs truncate" style={{ color: 'var(--text-subtle)' }}>
                      {product.description}
                    </p>
                  )}
                  <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--brand)' }}>
                    {formatCurrency(product.price)}
                  </p>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(product.id, product.available)}
                    style={{ color: product.available ? 'var(--success)' : 'var(--text-subtle)' }}
                  >
                    {product.available
                      ? <ToggleRight size={22} />
                      : <ToggleLeft  size={22} />
                    }
                  </button>
                  <button
                    onClick={() => openEdit(product)}
                    className="p-1.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-1.5"
                    style={{ color: 'var(--error)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {products.length === 0 && (
        <div
          className="text-center py-16 rounded-xl border"
          style={{ color: 'var(--text-subtle)', borderColor: 'var(--border)' }}
        >
          Nenhum produto cadastrado ainda
        </div>
      )}

      {/* Sheet de criar/editar */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <SheetHeader>
            <SheetTitle style={{ color: 'var(--text-primary)' }}>
              {editingProduct ? 'Editar produto' : 'Novo produto'}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6">
            <ProductForm
              product={editingProduct ?? undefined}
              categories={categories}
              onSave={handleSave}
              onCancel={() => setSheetOpen(false)}
              loading={formLoading}
            />
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}