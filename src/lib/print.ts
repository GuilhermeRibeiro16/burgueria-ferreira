// Abre janela de impressão térmica isolada
// Recebe HTML pronto e dispara window.print()
export function printReceipt(html: string) {
  const win = window.open('', '_blank', 'width=300,height=600')
  if (!win) {
    alert('Permita popups para imprimir a comanda')
    return
  }

  win.document.write(html)
  win.document.close()

  // Aguarda imagens carregarem antes de imprimir
  win.onload = () => {
    win.focus()
    win.print()
    win.close()
  }
}