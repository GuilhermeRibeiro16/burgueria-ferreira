import { Order, Settings } from '@/types'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import { ORDER_TYPE_LABEL, PAYMENT_METHOD_LABEL } from '@/constants'

interface Props {
  order:    Order
  settings: Settings
}

// Gera HTML completo da comanda para impressão térmica 58mm
// Retorna string — não renderiza no DOM do sistema
export function generateReceiptHTML({ order, settings }: Props): string {
  // Monta lista de itens
  const itemsHTML = order.items?.map(item => {
    const optionsHTML = item.options?.map(opt =>
      `<div class="option">
        + ${opt.option_name}
        ${opt.option_price > 0 ? `<span>${formatCurrency(opt.option_price)}</span>` : ''}
      </div>`
    ).join('') ?? ''

    const itemTotal = item.unit_price * item.quantity
    return `
      <div class="item">
        <div class="item-row">
          <span>${item.quantity}x ${item.product_name}</span>
          <span>${formatCurrency(itemTotal)}</span>
        </div>
        ${optionsHTML}
      </div>
    `
  }).join('') ?? ''

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
    .item      { margin-bottom: 4px; }
    .item-row  { display: flex; justify-content: space-between; font-weight: bold; }
    .option    {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #444;
      padding-left: 8px;
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

  <!-- Nome da loja -->
  <p class="store-name">${settings.store_name}</p>
  ${settings.instagram
    ? `<p class="store-info">@${settings.instagram}</p>`
    : ''}
  ${settings.whatsapp
    ? `<p class="store-info">📱 ${settings.whatsapp}</p>`
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