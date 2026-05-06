import { Order, Settings, Product } from '@/types'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { ORDER_TYPE_LABEL, PAYMENT_METHOD_LABEL } from '@/constants'

interface Props {
  order:    Order
  settings: Settings
  products: Product[]
}

// Gera HTML completo da comanda para impressão térmica 58mm
// Retorna string — não renderiza no DOM do sistema
export function generateReceiptHTML({ order, settings, products }: Props): string {
  // Monta lista de itens
// Monta lista de itens
const itemsHTML = (order.items && order.items.length > 0)
  ? order.items.map(item => {
      const itemTotal = item.unit_price * item.quantity

      // Descrição do primeiro sabor
      const description = (item as any).product?.description ?? ''

      // Segundo sabor e sua descrição
      const splitWith        = (item as any).split_with ?? ''
      const splitProductData = splitWith
        ? products.find(p => p.name === splitWith)
        : null
      const splitDescription = splitProductData?.description ?? ''

      // Nome do produto na comanda
      const productLabel = splitWith
        ? `${item.product_name} / ${splitWith}`
        : item.product_name

      // Linha de detalhes — descrições dos dois sabores
      const descriptionLine = [description, splitDescription]
        .filter(Boolean)
        .join(' | ')

      // Adicionais escolhidos
      const optionsList = item.options && item.options.length > 0
        ? item.options.map(o => o.option_name).join(' + ')
        : ''

      const detailLine = [descriptionLine, optionsList]
        .filter(Boolean)
        .join(' • ')

      return `
        <div class="item">
          <div class="item-row">
            <span>${item.quantity}x ${productLabel}</span>
            <span>${formatCurrency(itemTotal)}</span>
          </div>
          ${detailLine
            ? `<div class="item-options">${detailLine}</div>`
            : ''
          }
        </div>
      `
    }).join('')
  : '<div class="item"><div class="item-row"><span>Sem itens</span></div></div>'
  // QR Code PIX via API pública
  const pixQR = settings.pix_key
    ? `<div class="center">
        <p class="label">PIX</p>
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(settings.pix_key)}"
          width="100"
          height="100"
          alt="QR Code PIX"
        />
        <p class="pix-key">${settings.pix_key}</p>
      </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Comanda ${order.code}</title>
  <style>
    /* ── Reset ── */
    * { margin: 0; padding: 0; box-sizing: border-box; }

    /* ── Página térmica 58mm ── */
    @page {
      width: 58mm;
      margin: 4mm 3mm;
    }

    body {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      width: 58mm;
      color: #000;
      background: #fff;
    }

    /* ── Utilitários ── */
    .center  { text-align: center; }
    .bold    { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 4px 0; }
    .label   { font-size: 9px; text-transform: uppercase; color: #555; margin-bottom: 2px; }

    /* ── Header ── */
    .store-name {
      font-size: 13px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 2px;
    }
    .store-info {
      font-size: 9px;
      text-align: center;
      color: #444;
      margin-bottom: 2px;
    }

    /* ── Código e data ── */
    .order-code {
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      letter-spacing: 2px;
      margin: 4px 0 2px;
    }
    .order-date {
      font-size: 9px;
      text-align: center;
      color: #555;
    }

    /* ── Cliente ── */
    .section { margin: 4px 0; }
    .section-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1px;
    }
    .type-badge {
      font-size: 11px;
      font-weight: bold;
      text-align: center;
      border: 1px solid #000;
      padding: 2px 0;
      margin: 3px 0;
    }

    /* ── Itens ── */
.item {
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px dotted #ccc;
}
  .item-options {
  font-size: 9px;
  color: #333;
  padding-left: 4px;
  margin-top: 2px;
  font-weight: normal;
  word-break: break-word;
}

    .item-row {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  font-size: 10px;
}

  .item:last-child {
  border-bottom: none;
}

.option {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #444;
  padding-left: 8px;
  margin-top: 1px;
}

    /* ── Totais ── */
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .total-final {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: bold;
      margin-top: 2px;
    }

    /* ── Observação ── */
    .notes {
      font-size: 9px;
      border: 1px dashed #000;
      padding: 3px;
      margin: 3px 0;
    }

    /* ── PIX ── */
    .pix-key {
      font-size: 8px;
      word-break: break-all;
      color: #444;
      margin-top: 2px;
    }

    /* ── Rodapé ── */
    .footer {
      text-align: center;
      font-size: 9px;
      color: #555;
      margin-top: 4px;
    }
    .footer-primary {
      font-weight: bold;
      font-size: 10px;
      color: #000;
    }

    /* ── Esconde na tela, mostra só na impressão ── */
    @media screen {
      body { padding: 8px; background: #f5f5f5; }
    }
      
  </style>
</head>
<body>

 <!-- Logo ou nome da loja -->
${settings.logo_url
  ? `<div class="center" style="margin-bottom: 4px;">
      <img
        src="${settings.logo_url}"
        alt="${settings.store_name}"
        style="max-width: 120px; max-height: 60px; object-fit: contain;"
      />
    </div>`
  : `<p class="store-name">${settings.store_name}</p>`
}
  ${settings.instagram
    ? `<p class="store-info">@${settings.instagram}</p>`
    : ''}
  ${settings.whatsapp
    ? `<p class="store-info"> ${settings.whatsapp}</p>`
    : ''}

  <div class="divider"></div>

  <!-- Código e data -->
  <p class="order-code">${order.code}</p>
  <p class="order-date">${formatDateTime(order.created_at)}</p>

  <div class="divider"></div>

  <!-- Tipo -->
  <div class="type-badge">${ORDER_TYPE_LABEL[order.type]}</div>

  <!-- Cliente -->
  <div class="section">
    <div class="section-row">
      <span class="label">Cliente</span>
    </div>
    <p class="bold">${order.customer_name}</p>
    <p>${order.phone}</p>
    ${order.address ? `<p>${order.address}</p>` : ''}
  </div>

  <div class="divider"></div>

  <!-- Itens -->
  <div class="section">
    ${itemsHTML}
  </div>

  <div class="divider"></div>

  <!-- Observação -->
  ${order.notes
    ? `<div class="notes">OBS: ${order.notes}</div>`
    : ''}

<!-- Totais -->
<div class="section">
  ${order.delivery_fee > 0
    ? `<div class="total-row">
        <span>Taxa de entrega</span>
        <span>${formatCurrency(order.delivery_fee)}</span>
      </div>`
    : ''}

  ${order.card_fee > 0
    ? `<div class="total-row">
        <span>Taxa ${order.payment_method === 'credit' ? 'crédito' : 'débito'}</span>
        <span>${formatCurrency(order.total - (order.total / (1 + order.card_fee / 100)) * (order.card_fee / 100) * (1 + order.card_fee / 100) / (order.card_fee / 100))}</span>
      </div>`
    : ''}
    ${order.card_fee_amount > 0
  ? `<div class="total-row">
      <span>Taxa ${order.payment_method === 'credit' ? 'crédito' : 'débito'} (${order.card_fee}%)</span>
      <span>${formatCurrency(order.card_fee_amount)}</span>
    </div>`
  : ''}

  <div class="total-final">
    <span>TOTAL</span>
    <span>${formatCurrency(order.total)}</span>
  </div>

    ${order.payment_method
      ? `<div class="total-row" style="margin-top:2px">
          <span>${PAYMENT_METHOD_LABEL[order.payment_method]}</span>
          ${order.change_info ? `<span>${order.change_info}</span>` : ''}
        </div>`
      : ''}
  </div>

  <!-- PIX -->
  ${pixQR}

  <div class="divider"></div>

  <!-- Rodapé -->
  <div class="footer">
    ${settings.receipt_footer
      ? `<p class="footer-primary">${settings.receipt_footer}</p>`
      : ''}
    ${settings.receipt_footer_secondary
      ? `<p>${settings.receipt_footer_secondary}</p>`
      : ''}
  </div>

</body>
</html>`
}