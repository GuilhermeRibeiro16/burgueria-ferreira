import jsPDF from 'jspdf'
import { Order, Settings, Product } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ORDER_TYPE_LABEL, PAYMENT_METHOD_LABEL } from '@/constants'

// Largura da impressora 58mm em pontos (1mm = 2.834 pts)
const PAGE_WIDTH = 58
const MARGIN     = 6    // ← era 4, agora 6
const LINE_WIDTH = PAGE_WIDTH - MARGIN * 2  // 46mm

export async function generateReceiptPDF({
  order,
  settings,
  products,
}: {
  order:    Order
  settings: Settings
  products: Product[]
}) {
  const doc = new jsPDF({
    unit:   'mm',
    format: [PAGE_WIDTH, 297], // altura dinâmica — vamos cortar depois
  })

  let y = MARGIN  // cursor vertical

  // ── Helpers ──────────────────────────────────────────────

function text(
  content: string,
  x: number,
  align: 'left' | 'center' | 'right' = 'left',
  size = 9,           // ← era 8, agora 9
  bold = true         // ← era false, agora true por padrão
) {
  doc.setFontSize(size)
  doc.setFont('courier', bold ? 'bold' : 'normal')
  const xPos = align === 'center'
    ? PAGE_WIDTH / 2
    : align === 'right'
    ? PAGE_WIDTH - MARGIN
    : x
  doc.text(content, xPos, y, { align })
}

function row(left: string, right: string, size = 9, bold = true) {
  doc.setFontSize(size)
  doc.setFont('courier', 'bold')   // ← sempre negrito
  doc.text(left,  MARGIN, y)
  doc.text(right, PAGE_WIDTH - MARGIN, y, { align: 'right' })
}

  function divider(dashed = true) {
    y += 1
    doc.setFontSize(7)
    doc.setFont('courier', 'normal')
    doc.text(dashed ? '-'.repeat(38) : '='.repeat(38), MARGIN, y)
    y += 3
  }

  function newLine(gap = 4) { y += gap }

  // ── Logo ou nome ──────────────────────────────────────────
  if (settings.logo_url) {
    try {
      // Carrega imagem como base64
      const img   = await loadImage(settings.logo_url)
      const ratio = img.width / img.height
      const imgW  = 30
      const imgH  = imgW / ratio
      doc.addImage(img.data, 'PNG', (PAGE_WIDTH - imgW) / 2, y, imgW, imgH)
      y += imgH + 2
    } catch {
      // Nome da loja
    text(settings.store_name, 0, 'center', 12, true)  // era 11
      newLine(5)
    }
  } else {
    text(settings.store_name, 0, 'center', 12, true)
    newLine(5)
  }

  if (settings.instagram) {
    text(`@${settings.instagram}`, 0, 'center', 8)    // era 7
    newLine(3)
  }
  if (settings.whatsapp) {
    text(settings.whatsapp, 0, 'center', 8)
    newLine(3)
  }

  divider()

  // ── Código e data ─────────────────────────────────────────
  text(order.code, 0, 'center', 14, true)
  newLine(5)
  text(formatDateTime(order.created_at), 0, 'center', 8)
  newLine(4)

  divider()

  // ── Tipo ──────────────────────────────────────────────────
  text(ORDER_TYPE_LABEL[order.type], 0, 'center', 11, true)
  newLine(5)

  // ── Cliente ───────────────────────────────────────────────
  text('CLIENTE', MARGIN, 'left', 8, true)
  newLine(3)
  text(order.customer_name, MARGIN, 'left', 10, true)
  newLine(4)
  if (order.phone) {
    text(order.phone, MARGIN, 'left', 8)
    newLine(3)
  }
  if (order.address) {
    // Quebra endereço longo em múltiplas linhas
    const lines = doc.splitTextToSize(order.address, LINE_WIDTH)
    doc.setFontSize(8)
    doc.setFont('courier', 'bold')
    lines.forEach((line: string) => {
      doc.text(line, MARGIN, y)
      y += 3
    })
  }

  divider()

  // ── Itens ─────────────────────────────────────────────────
  order.items?.forEach(item => {
    const splitProductData = (item as any).split_with
      ? products.find(p => p.name === (item as any).split_with)
      : null

const productLabel = (item as any).split_with
  ? `${item.product_name}/${(item as any).split_with}`
  : item.product_name

  const itemTotal    = item.unit_price * item.quantity
  const totalStr     = formatCurrency(itemTotal)
  // Calcula largura disponível para o nome (descontando o preço)
const priceWidth   = 18  // mm reservados para o preço
const nameMaxWidth = LINE_WIDTH - priceWidth

    // Nome do produto — quebra se necessário
const nameLines = doc.splitTextToSize(
  `${item.quantity}x ${productLabel}`,
  nameMaxWidth
)
doc.setFontSize(9)
doc.setFont('courier', 'bold')
nameLines.forEach((line: string, i: number) => {
  doc.text(line, MARGIN, y)
  // Preço só na primeira linha, alinhado à direita
  if (i === 0) {
    doc.text(totalStr, PAGE_WIDTH - MARGIN, y, { align: 'right' })
  }
  y += 4
})

    // Descrição do primeiro sabor
    const desc1 = (item as any).product?.description
    if (desc1) {
      const descLines = doc.splitTextToSize(desc1, LINE_WIDTH - 4)
      doc.setFontSize(8)
      doc.setFont('courier', 'bold')
      descLines.forEach((line: string) => {
        doc.text(line, MARGIN + 2, y)
        y += 3
      })
    }

    // Descrição do segundo sabor
    const desc2 = splitProductData?.description
    if (desc2) {
      const descLines = doc.splitTextToSize(desc2, LINE_WIDTH - 4)
      doc.setFontSize(8)
      doc.setFont('courier', 'normal')
      descLines.forEach((line: string) => {
        doc.text(line, MARGIN + 2, y)
        y += 3
      })
    }

    // Adicionais
    item.options?.forEach(opt => {
      doc.setFontSize(8)
      doc.setFont('courier', 'normal')
      const optLine = `+ ${opt.option_name}`
      doc.text(optLine, MARGIN + 2, y)
      if (opt.option_price > 0) {
        doc.text(formatCurrency(opt.option_price), PAGE_WIDTH - MARGIN, y, { align: 'right' })
      }
      y += 3
    })

    y += 1
  })

  divider()

  // ── Observação ────────────────────────────────────────────
  if (order.notes) {
    text('OBS:', MARGIN, 'left', 8, true)
    newLine(3)
    const notesLines = doc.splitTextToSize(order.notes, LINE_WIDTH)
    doc.setFontSize(8)
    doc.setFont('courier', 'bold')
    notesLines.forEach((line: string) => {
      doc.text(line, MARGIN, y)
      y += 3
    })
    newLine(1)
    divider()
  }

  // ── Totais ────────────────────────────────────────────────
  if (order.delivery_fee > 0) {
    row('Taxa de entrega', formatCurrency(order.delivery_fee))
    newLine(4)
  }

  if ((order as any).card_fee_amount > 0) {
    const label = order.payment_method === 'credit' ? 'Taxa crédito' : 'Taxa débito'
    row(`${label} (${(order as any).card_fee}%)`, formatCurrency((order as any).card_fee_amount))
    newLine(4)
  }

  row('TOTAL', formatCurrency(order.total), 10, true)
  newLine(5)

  if (order.payment_method) {
    const pmLabel = PAYMENT_METHOD_LABEL[order.payment_method]
    const changeLabel = order.change_info ? ` · ${order.change_info}` : ''
    text(`${pmLabel}${changeLabel}`, MARGIN, 'left', 8)
    newLine(4)
  }

  divider()

  // ── QR Code PIX ───────────────────────────────────────────
if (settings.pix_key) {
  text('PIX', 0, 'center', 8, true)
  newLine(3.5)
  const pixLines = doc.splitTextToSize(settings.pix_key, LINE_WIDTH)
  doc.setFontSize(8)
  doc.setFont('courier', 'bold')
  pixLines.forEach((line: string) => {
    doc.text(line, PAGE_WIDTH / 2, y, { align: 'center' })
    y += 3.5
  })
  newLine(1)
  divider()
}
  // ── Rodapé ────────────────────────────────────────────────
if (settings.receipt_footer) {
  const footerLines = doc.splitTextToSize(settings.receipt_footer, LINE_WIDTH)
  doc.setFontSize(8)
  doc.setFont('courier', 'bold')
  footerLines.forEach((line: string) => {
    doc.text(line, PAGE_WIDTH / 2, y, { align: 'center' })
    y += 3.5
  })
  newLine(1)
}
if (settings.receipt_footer_secondary) {
  const footer2Lines = doc.splitTextToSize(settings.receipt_footer_secondary, LINE_WIDTH)
  doc.setFontSize(8)
  doc.setFont('courier', 'bold')
  footer2Lines.forEach((line: string) => {
    doc.text(line, PAGE_WIDTH / 2, y, { align: 'center' })
    y += 3.5
  })
  newLine(1)
}

  // ── Corta o PDF na altura exata ───────────────────────────
  const finalHeight = y + MARGIN
  const finalDoc    = new jsPDF({
    unit:   'mm',
    format: [PAGE_WIDTH, finalHeight],
  })

  // Copia o conteúdo para o doc com altura correta
  const pageData = doc.output('arraybuffer')
  return new Uint8Array(pageData)
}

// ── Helper: carrega imagem como base64 ───────────────────────
async function loadImage(url: string): Promise<{ data: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas  = document.createElement('canvas')
      canvas.width  = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      resolve({
        data:   canvas.toDataURL('image/png'),
        width:  img.width,
        height: img.height,
      })
    }
    img.onerror = reject
    img.src = url
  })
}