// Página de configurações do sistema — acesso a dados, formulários, etc
import { getSettings }    from '@/lib/supabase/queries/settings'
import { SettingsClient } from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const settings = await getSettings()
  return <SettingsClient settings={settings} />
}