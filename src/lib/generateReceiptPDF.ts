import jsPDF from 'jspdf'
import { Order, Settings, Product } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ORDER_TYPE_LABEL, PAYMENT_METHOD_LABEL } from '@/constants'

// Largura da impressora 58mm em pontos (1mm = 2.834 pts)
const PAGE_WIDTH = 58
const MARGIN     = 4
const LINE_WIDTH = PAGE_WIDTH - MARGIN * 2  // 50mm

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
    size = 8,
    bold = false
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

  function row(left: string, right: string, size = 8, bold = false) {
    doc.setFontSize(size)
    doc.setFont('courier', bold ? 'bold' : 'normal')
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
      // Se falhar carrega o nome como texto
      text(settings.store_name, 0, 'center', 11, true)
      newLine(5)
    }
  } else {
    text(settings.store_name, 0, 'center', 11, true)
    newLine(5)
  }

  if (settings.instagram) {
    text(`@${settings.instagram}`, 0, 'center', 7)
    newLine(3)
  }
  if (settings.whatsapp) {
    text(settings.whatsapp, 0, 'center', 7)
    newLine(3)
  }

  divider()

  // ── Código e data ─────────────────────────────────────────
  text(order.code, 0, 'center', 16, true)
  newLine(5)
  text(formatDateTime(order.created_at), 0, 'center', 7)
  newLine(4)

  divider()

  // ── Tipo ──────────────────────────────────────────────────
  text(ORDER_TYPE_LABEL[order.type], 0, 'center', 10, true)
  newLine(5)

  // ── Cliente ───────────────────────────────────────────────
  text('CLIENTE', MARGIN, 'left', 7)
  newLine(3)
  text(order.customer_name, MARGIN, 'left', 9, true)
  newLine(4)
  if (order.phone) {
    text(order.phone, MARGIN, 'left', 7)
    newLine(3)
  }
  if (order.address) {
    // Quebra endereço longo em múltiplas linhas
    const lines = doc.splitTextToSize(order.address, LINE_WIDTH)
    doc.setFontSize(7)
    doc.setFont('courier', 'normal')
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

    const itemTotal = item.unit_price * item.quantity

    // Nome do produto — quebra se necessário
    const nameLines = doc.splitTextToSize(
      `${item.quantity}x ${productLabel}`,
      LINE_WIDTH - 15
    )
    doc.setFontSize(8)
    doc.setFont('courier', 'bold')
    nameLines.forEach((line: string, i: number) => {
      if (i === 0) {
        doc.text(line, MARGIN, y)
        doc.setFont('courier', 'normal')
        doc.text(formatCurrency(itemTotal), PAGE_WIDTH - MARGIN, y, { align: 'right' })
      } else {
        doc.text(line, MARGIN, y)
      }
      y += 3.5
    })

    // Descrição do primeiro sabor
    const desc1 = (item as any).product?.description
    if (desc1) {
      const descLines = doc.splitTextToSize(desc1, LINE_WIDTH - 4)
      doc.setFontSize(7)
      doc.setFont('courier', 'normal')
      descLines.forEach((line: string) => {
        doc.text(line, MARGIN + 2, y)
        y += 3
      })
    }

    // Descrição do segundo sabor
    const desc2 = splitProductData?.description
    if (desc2) {
      const descLines = doc.splitTextToSize(desc2, LINE_WIDTH - 4)
      doc.setFontSize(7)
      doc.setFont('courier', 'normal')
      descLines.forEach((line: string) => {
        doc.text(line, MARGIN + 2, y)
        y += 3
      })
    }

    // Adicionais
    item.options?.forEach(opt => {
      doc.setFontSize(7)
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
    text('OBS:', MARGIN, 'left', 7, true)
    newLine(3)
    const notesLines = doc.splitTextToSize(order.notes, LINE_WIDTH)
    doc.setFontSize(7)
    doc.setFont('courier', 'normal')
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
    text(`${pmLabel}${changeLabel}`, MARGIN, 'left', 7)
    newLine(4)
  }

  divider()

  // ── QR Code PIX ───────────────────────────────────────────
  if (settings.pix_key) {
    text('PIX', 0, 'center', 8, true)
    newLine(3)
    try {
      const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(settings.pix_key)}`
      const qrImg  = await loadImage(qrUrl)
      const qrSize = 24
      doc.addImage(qrImg.data, 'PNG', (PAGE_WIDTH - qrSize) / 2, y, qrSize, qrSize)
      y += qrSize + 2
    } catch {
      text(settings.pix_key, 0, 'center', 6)
      newLine(4)
    }
    divider()
  }

  // ── Rodapé ────────────────────────────────────────────────
  if (settings.receipt_footer) {
    text(settings.receipt_footer, 0, 'center', 7, true)
    newLine(3)
  }
  if (settings.receipt_footer_secondary) {
    text(settings.receipt_footer_secondary, 0, 'center', 7)
    newLine(3)
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