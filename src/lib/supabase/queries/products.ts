import { createAdminClient } from '@/lib/supabase/admin'


// Busca produtos ativos com suas categorias e grupos de opções
export async function getProducts() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories (*),
      option_groups:product_option_groups (
        *,
        options:product_options (*)
      )
    `)
    .is('deleted_at', null)
    .order('name')

  if (error) throw error
  return data
}

// Busca categorias ativas
export async function getCategories() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('name')

  if (error) throw error
  return data
}