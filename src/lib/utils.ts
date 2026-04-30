import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, toZonedTime } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'

// Utilitário padrão do shadcn — mescla classes Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================
// FUSO HORÁRIO
// Toda data exibida ou filtrada deve usar Brasília (UTC-3)
// Sem isso, pedidos das 23h aparecem no dia seguinte na Vercel
// ============================================================
export const TZ = 'America/Recife'

export function toBrasilia(date: Date | string): Date {
  return toZonedTime(new Date(date), TZ)
}

export function formatDate(date: Date | string, pattern = 'dd/MM/yyyy'): string {
  return format(toBrasilia(date), pattern, { locale: ptBR })
}

export function formatDateTime(date: Date | string): string {
  return format(toBrasilia(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatTime(date: Date | string): string {
  return format(toBrasilia(date), 'HH:mm', { locale: ptBR })
}

// Retorna o início e fim do dia em UTC para filtros no banco
export function getDayRange(date: Date): { start: string; end: string } {
  const zoned = toZonedTime(date, TZ)
  zoned.setHours(0, 0, 0, 0)
  const start = new Date(zoned.getTime() + 3 * 60 * 60 * 1000)
  zoned.setHours(23, 59, 59, 999)
  const end = new Date(zoned.getTime() + 3 * 60 * 60 * 1000)
  return {
    start: start.toISOString(),
    end:   end.toISOString(),
  }
}

// ============================================================
// FORMATAÇÃO MONETÁRIA
// ============================================================
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style:    'currency',
    currency: 'BRL',
  }).format(value)
}

// ============================================================
// GERADOR DE CÓDIGO DE PEDIDO
// Formato: #A1B2 — 4 caracteres alfanuméricos
// ============================================================
export function generateOrderCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = '#'
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// ============================================================
// CÁLCULO DE TOTAL DO PEDIDO
// Sempre chamado no servidor — nunca confie no frontend
// ============================================================
export function calcItemTotal(
  unitPrice: number,
  quantity: number,
  optionPrices: number[]
): number {
  const optionsTotal = optionPrices.reduce((sum, p) => sum + p, 0)
  return (unitPrice + optionsTotal) * quantity
}