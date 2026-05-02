// Ações relacionadas a produtos e categorias — upload de imagem, CRUD, toggle disponibilidade
'use server'

import { revalidatePath }    from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

// ============================================================
// UPLOAD DE IMAGEM
// Arquivo enviado como FormData — processado no servidor
// ============================================================
export async function uploadProductImage(formData: FormData): Promise<string> {
  const supabase = createAdminClient()
  const file     = formData.get('file') as File

  if (!file) throw new Error('Arquivo não encontrado')

  // Nome único para evitar colisões no Storage
  const ext      = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('products')
    .upload(filename, file, { contentType: file.type, upsert: false })

  if (error) throw error

  // Retorna URL pública da imagem
  const { data } = supabase.storage.from('products').getPublicUrl(filename)
  return data.publicUrl
}

// ============================================================
// CRIAR CATEGORIA
// ============================================================
export async function createCategory(name: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('categories')
    .insert({ name: name.trim() })

  if (error) throw error
  revalidatePath('/admin/products')
}

// ============================================================
// CRIAR PRODUTO
// ============================================================
export async function createProduct(data: {
  name:        string
  description: string | null
  price:       number
  category_id: string
  image_url:   string | null
  available:   boolean
  option_groups: {
    name:       string
    type:       'radio' | 'checkbox'
    max_select: number
    options: {
      name:      string
      price:     number
      available: boolean
    }[]
  }[]
}) {
  const supabase = createAdminClient()

  // Insere produto
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      name:        data.name.trim(),
      description: data.description?.trim() || null,
      price:       data.price,
      category_id: data.category_id,
      image_url:   data.image_url,
      available:   data.available,
    })
    .select()
    .single()

  if (productError) throw productError

  // Insere grupos de opções e suas opções
  for (const group of data.option_groups) {
    const { data: createdGroup, error: groupError } = await supabase
      .from('product_option_groups')
      .insert({
        product_id: product.id,
        name:       group.name.trim(),
        type:       group.type,
        max_select: group.max_select,
      })
      .select()
      .single()

    if (groupError) throw groupError

    if (group.options.length) {
      await supabase.from('product_options').insert(
        group.options.map(o => ({
          group_id:  createdGroup.id,
          name:      o.name.trim(),
          price:     o.price,
          available: o.available,
        }))
      )
    }
  }

  revalidatePath('/admin/products')
  return { success: true }
}

// ============================================================
// EDITAR PRODUTO
// Recria grupos de opções inteiros — mais simples que diff
// ============================================================
export async function updateProduct(
  productId: string,
  data: Parameters<typeof createProduct>[0]
) {
  const supabase = createAdminClient()

  await supabase
    .from('products')
    .update({
      name:        data.name.trim(),
      description: data.description?.trim() || null,
      price:       data.price,
      category_id: data.category_id,
      image_url:   data.image_url,
      available:   data.available,
    })
    .eq('id', productId)

  // Deleta grupos antigos — cascade deleta as opções também
  await supabase
    .from('product_option_groups')
    .delete()
    .eq('product_id', productId)

  // Reinsere grupos atualizados
  for (const group of data.option_groups) {
    const { data: createdGroup } = await supabase
      .from('product_option_groups')
      .insert({
        product_id: productId,
        name:       group.name.trim(),
        type:       group.type,
        max_select: group.max_select,
      })
      .select()
      .single()

    if (createdGroup && group.options.length) {
      await supabase.from('product_options').insert(
        group.options.map(o => ({
          group_id:  createdGroup.id,
          name:      o.name.trim(),
          price:     o.price,
          available: o.available,
        }))
      )
    }
  }

  revalidatePath('/admin/products')
  return { success: true }
}

// ============================================================
// SOFT DELETE — mantém integridade histórica dos pedidos
// ============================================================
export async function deleteProduct(productId: string) {
  const supabase = createAdminClient()

  await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', productId)

  revalidatePath('/admin/products')
}

export async function deleteCategory(categoryId: string) {
  const supabase = createAdminClient()

  await supabase
    .from('categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', categoryId)

  revalidatePath('/admin/products')
}

// ============================================================
// TOGGLE DISPONIBILIDADE
// ============================================================
export async function toggleProductAvailability(
  productId: string,
  available: boolean
) {
  const supabase = createAdminClient()

  await supabase
    .from('products')
    .update({ available })
    .eq('id', productId)

  revalidatePath('/admin/products')
}