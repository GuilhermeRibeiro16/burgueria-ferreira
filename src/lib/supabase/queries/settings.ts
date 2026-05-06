import { createAdminClient } from '@/lib/supabase/admin'
import { Settings } from '@/types'

// Converte array chave-valor em objeto tipado
export async function getSettings(): Promise<Settings> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('settings')
    .select('key, value')

  if (error) throw error

  // Transforma [{key, value}] em {key: value}
  const map = Object.fromEntries(data.map(({ key, value }) => [key, value]))

  return {
    store_name:               map.store_name               ?? 'Burgueria Ferreira',
    delivery_fee_city:        parseFloat(map.delivery_fee_city        ?? '1.00'),
    delivery_fee_outside:     parseFloat(map.delivery_fee_outside     ?? '2.00'),
    opening_hours:            map.opening_hours            ?? '',
    instagram:                map.instagram                ?? null,
    whatsapp:                 map.whatsapp                 ?? null,
    pix_key:                  map.pix_key                  ?? null,
    receipt_footer:           map.receipt_footer           ?? 'Deus é fiel, qualidade que faz rei',
    receipt_footer_secondary: map.receipt_footer_secondary ?? null,
    card_fee_credit:          parseFloat(map.card_fee_credit ?? '0'), 
    card_fee_debit:           parseFloat(map.card_fee_debit  ?? '0'),
    logo_url: map.logo_url || null,
  }
}