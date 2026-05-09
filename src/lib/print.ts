import { Order, Settings, Product } from '@/types'
import { generateReceiptPDF } from './generateReceiptPDF'
import { generateReceiptTXT } from './generateReceiptTXT'


export async function printReceipt({
  order,
  settings,
  products,
  mode = 'pdf',
}: {
  order:    Order
  settings: Settings
  products: Product[]
  mode: 'pdf' | 'txt'
}) {
  if (mode === 'txt') {
        printTXT({ order, settings, products })
    return
  }
  try {
    const pdfBytes = await generateReceiptPDF({ order, settings, products })
    const blob     = new Blob([pdfBytes], { type: 'application/pdf' })
    const url      = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    console.error('Erro ao gerar PDF:', err)
    alert('Erro ao gerar comanda')
  }
}

function printTXT({
  order,
  settings,
  products,
}: {
  order:    Order
  settings: Settings
  products: Product[]
}) {
  const txt  = generateReceiptTXT({ order, settings, products })
  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
  const url  = URL.createObjectURL(blob)

  // Abre em nova janela e imprime direto
  const win = window.open(url, '_blank', 'width=400,height=600')
  if (!win) {
    // Fallback — baixa o arquivo
    const a    = document.createElement('a')
    a.href     = url
    a.download = `comanda-${order.code}.txt`
    a.click()
    return
  }

  win.onload = () => {
    win.print()
    setTimeout(() => {
      win.close()
      URL.revokeObjectURL(url)
    }, 1000)
  }
}