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