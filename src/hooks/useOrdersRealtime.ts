'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// Escuta mudanças na tabela orders em tempo real
// onUpdate é chamado tanto pelo Realtime quanto pelo fallback de 30s
export function useOrdersRealtime(onUpdate: () => void) {
  const supabase = createClient()

  const refresh = useCallback(() => {
    onUpdate()
  }, [onUpdate])

  useEffect(() => {
    // Canal Realtime — conecta direto do browser ao Supabase
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => refresh()
      )
      .subscribe()

    // Fallback: atualiza a cada 30s caso o WebSocket caia
    const interval = setInterval(refresh, 30_000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [refresh, supabase])
}