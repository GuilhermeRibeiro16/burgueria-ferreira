// Ações relacionadas a configurações do sistema — CRUD, toggle, etc
'use server'

import { revalidatePath }    from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export async function updateSettings(settings: Record<string, string>) {
  const supabase = createAdminClient()

  // Upsert — atualiza se existe, insere se não existe
  const entries = Object.entries(settings).map(([key, value]) => ({ key, value }))

  const { error } = await supabase
    .from('settings')
    .upsert(entries, { onConflict: 'key' })

  if (error) throw error
  revalidatePath('/admin/settings')
  return { success: true }
}

// Upload de logo da loja
export async function uploadStoreLogo(formData: FormData): Promise<string> {
  const supabase = createAdminClient()
  const file     = formData.get('file') as File

  if (!file) throw new Error('Arquivo não encontrado')

  const ext      = file.name.split('.').pop()
  const filename = `logo-${Date.now()}.${ext}`

  // Remove logo antiga se existir
  await supabase.storage.from('store').remove([filename])

  const { error } = await supabase.storage
    .from('store')
    .upload(filename, file, { contentType: file.type, upsert: true })

  if (error) throw error

  const { data } = supabase.storage.from('store').getPublicUrl(filename)

  // Salva URL no banco
  await supabase
    .from('settings')
    .upsert({ key: 'logo_url', value: data.publicUrl }, { onConflict: 'key' })

  revalidatePath('/admin/settings')
  return data.publicUrl
}