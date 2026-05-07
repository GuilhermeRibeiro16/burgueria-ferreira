import { Order, Settings, Product } from '@/types'
import { generateReceiptPDF } from './generateReceiptPDF'

export async function printReceipt({
  order,
  settings,
  products,
}: {
  order:    Order
  settings: Settings
  products: Product[]
}) {
  try {
    const pdfBytes = await generateReceiptPDF({ order, settings, products })

    // Cria blob e abre em nova aba para impressão
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const url  = URL.createObjectURL(blob)

    // Abre o PDF — no desktop abre no visualizador, no mobile baixa
    window.open(url, '_blank')

    // Libera memória após 1 minuto
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    console.error('Erro ao gerar PDF:', err)
    alert('Erro ao gerar comanda')
  }
}