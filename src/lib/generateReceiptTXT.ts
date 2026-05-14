import { Order, Settings, Product } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ORDER_TYPE_LABEL, PAYMENT_METHOD_LABEL } from '@/constants'

// Impressora 58mm com Generic Text — 32 caracteres por linha
const COLS = 32

// ── Helpers ──────────────────────────────────────────────────

// Centraliza texto
function center(text: string): string {
  const pad = Math.max(0, Math.floor((COLS - text.length) / 2))
  return ' '.repeat(pad) + text
}

// Linha com texto à esquerda e direita
function cols(left: string, right: string): string {
  const space = COLS - left.length - right.length
  if (space <= 0) return left + ' ' + right
  return left + ' '.repeat(space) + right
}

// Quebra texto longo em múltiplas linhas
function wrap(text: string, indent = 0): string[] {
  const max   = COLS - indent
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  words.forEach(word => {
    if ((current + ' ' + word).trim().length <= max) {
      current = (current + ' ' + word).trim()
    } else {
      if (current) lines.push(' '.repeat(indent) + current)
      current = word
    }
  })
  if (current) lines.push(' '.repeat(indent) + current)
  return lines
}

// Linha divisória
function divider(): string {
  return '-'.repeat(COLS)
}

// ── Gerador principal ─────────────────────────────────────────

export function generateReceiptTXT({
  order,
  settings,
  products,
}: {
  order:    Order
  settings: Settings
  products: Product[]
}): string {
  const lines: string[] = []

  const add  = (line = '')  => lines.push(line)
  const sep  = ()           => lines.push(divider())

  // ── Header ──
  add(center(settings.store_name.toUpperCase()))
  if (settings.instagram) add(center(`@${settings.instagram}`))
  if (settings.whatsapp)  add(center(settings.whatsapp))
  sep()

  // ── Código e data ──
  add(center(order.code))
  add(center(formatDateTime(order.created_at)))
  sep()

  // ── Tipo ──
  add(center(`*** ${ORDER_TYPE_LABEL[order.type].toUpperCase()} ***`))
  sep()

  // ── Cliente ──
  add('CLIENTE')
  add(order.customer_name.toUpperCase())
  if (order.address) {
    wrap(order.address).forEach(l => add(l))
  }
  sep()

  // ── Itens ──
  order.items?.forEach(item => {
    const splitWith    = (item as any).split_with ?? ''
    const productLabel = splitWith
      ? `${item.product_name}/${splitWith}`
      : item.product_name

    const itemTotal  = item.unit_price * item.quantity
    const totalStr   = formatCurrency(itemTotal)
    const namePrefix = `${item.quantity}x `
    const maxName    = COLS - namePrefix.length - totalStr.length - 1

    // Nome do produto — quebra se necessário
    const fullName  = `${namePrefix}${productLabel}`
    const nameLines = wrap(fullName, 0)

    nameLines.forEach((line, i) => {
      if (i === 0) {
        add(cols(line, totalStr))
      } else {
        add(line)
      }
    })

    // Descrição primeiro sabor
    const desc1 = (item as any).product?.description
    if (desc1) {
      wrap(desc1, 2).forEach(l => add(l))
    }

    // Descrição segundo sabor
    const splitProductData = splitWith
      ? products.find(p => p.name === splitWith)
      : null
    if (splitProductData?.description) {
      wrap(splitProductData.description, 2).forEach(l => add(l))
    }

    // Adicionais
item.options?.forEach(opt => {
  const qty      = (opt as any).quantity ?? 1
  const prefix   = qty > 1 ? `${qty}x ` : ''
  const optLine  = `  + ${prefix}${opt.option_name}`
  const optPrice = opt.option_price > 0
    ? formatCurrency(opt.option_price * qty)
    : ''
  add(optPrice ? cols(optLine, optPrice) : optLine)
})

    add() // linha em branco entre itens
  })

  sep()

  // ── Observação ──
  if (order.notes) {
    add('OBS:')
    wrap(order.notes).forEach(l => add(l))
    sep()
  }

  // ── Totais ──
  if (order.delivery_fee > 0) {
    add(cols('Taxa de entrega', formatCurrency(order.delivery_fee)))
  }

  if ((order as any).card_fee_amount > 0) {
    const label = order.payment_method === 'credit' ? 'Taxa credito' : 'Taxa debito'
    add(cols(`${label} (${(order as any).card_fee}%)`, formatCurrency((order as any).card_fee_amount)))
  }

  add(cols('TOTAL', formatCurrency(order.total)))

  if (order.payment_method) {
    const pmLabel    = PAYMENT_METHOD_LABEL[order.payment_method]
    const changeInfo = order.change_info ? ` · ${order.change_info}` : ''
    add(`${pmLabel}${changeInfo}`)
  }

  sep()

  // ── PIX ──
  if (settings.pix_key) {
    add(center('PIX'))
    wrap(settings.pix_key).forEach(l => add(center(l)))
    sep()
  }

  // ── Rodapé ──
  if (settings.receipt_footer) {
    wrap(settings.receipt_footer).forEach(l => add(center(l)))
  }
  if (settings.receipt_footer_secondary) {
    wrap(settings.receipt_footer_secondary).forEach(l => add(center(l)))
  }

  // Linhas em branco no final para a impressora cortar
  add()
  add()
  add()

  return lines.join('\n')
}