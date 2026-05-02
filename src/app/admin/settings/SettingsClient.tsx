'use client'

import { useState, useTransition } from 'react'
import { useRouter }        from 'next/navigation'
import { Settings }         from '@/types'
import { updateSettings }   from '@/lib/actions/settings'
import { Input }            from '@/components/ui/input'
import { Label }            from '@/components/ui/label'
import { Button }           from '@/components/ui/button'
import { Separator }        from '@/components/ui/separator'
import { Loader2, Store, Truck, Clock , Phone, Key, FileText, Signal } from 'lucide-react'
import { toast }            from 'sonner'

interface Props {
  settings: Settings
}

// Componente auxiliar para seção com título
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-4"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </p>
      {children}
    </div>
  )
}

// Componente auxiliar para campo com ícone
function Field({
  label, icon: Icon, children
}: {
  label: string
  icon:  React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        className="flex items-center gap-1.5 text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        <Icon size={13} />
        {label}
      </Label>
      {children}
    </div>
  )
}

export function SettingsClient({ settings }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Estado dos campos
  const [storeName,            setStoreName]            = useState(settings.store_name)
  const [deliveryFeeCity,      setDeliveryFeeCity]      = useState(settings.delivery_fee_city.toString())
  const [deliveryFeeOutside,   setDeliveryFeeOutside]   = useState(settings.delivery_fee_outside.toString())
  const [openingHours,         setOpeningHours]         = useState(settings.opening_hours)
  const [instagram,            setInstagram]            = useState(settings.instagram ?? '')
  const [whatsapp,             setWhatsapp]             = useState(settings.whatsapp  ?? '')
  const [pixKey,               setPixKey]               = useState(settings.pix_key   ?? '')
  const [receiptFooter,        setReceiptFooter]        = useState(settings.receipt_footer)
  const [receiptFooterSecondary, setReceiptFooterSecondary] = useState(
    settings.receipt_footer_secondary ?? ''
  )

  async function handleSave() {
    startTransition(async () => {
      try {
        await updateSettings({
          store_name:               storeName.trim(),
          delivery_fee_city:        deliveryFeeCity,
          delivery_fee_outside:     deliveryFeeOutside,
          opening_hours:            openingHours.trim(),
          instagram:                instagram.trim(),
          whatsapp:                 whatsapp.trim(),
          pix_key:                  pixKey.trim(),
          receipt_footer:           receiptFooter.trim(),
          receipt_footer_secondary: receiptFooterSecondary.trim(),
        })
        toast.success('Configurações salvas!')
        startTransition(() => router.refresh())
      } catch {
        toast.error('Erro ao salvar configurações')
      }
    })
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">

      {/* Header */}
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Configurações
      </h1>

      {/* Loja */}
      <Section title="Loja">
        <Field label="Nome da loja" icon={Store}>
          <Input
            value={storeName}
            onChange={e => setStoreName(e.target.value)}
            placeholder="Burgueria Ferreira"
          />
        </Field>
        <Field label="Horário de funcionamento" icon={Clock}>
          <Input
            value={openingHours}
            onChange={e => setOpeningHours(e.target.value)}
            placeholder="Terça a Domingo, 18h às 23h45"
          />
        </Field>
      </Section>

      {/* Taxas de entrega */}
      <Section title="Taxas de entrega">
        <Field label="Dentro da cidade (R$)" icon={Truck}>
          <Input
            type="number"
            step="0.01"
            value={deliveryFeeCity}
            onChange={e => setDeliveryFeeCity(e.target.value)}
            placeholder="1.00"
          />
        </Field>
        <Field label="Fora da cidade (R$)" icon={Truck}>
          <Input
            type="number"
            step="0.01"
            value={deliveryFeeOutside}
            onChange={e => setDeliveryFeeOutside(e.target.value)}
            placeholder="2.00"
          />
        </Field>
      </Section>

      {/* Contato */}
      <Section title="Contato e pagamento">
        <Field label="Instagram (sem @)" icon={Signal }>
          <Input
            value={instagram}
            onChange={e => setInstagram(e.target.value)}
            placeholder="burgueriaferreira"
          />
        </Field>
        <Field label="WhatsApp (com DDD)" icon={Phone}>
          <Input
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            placeholder="82999999999"
          />
        </Field>
        <Field label="Chave PIX" icon={Key}>
          <Input
            value={pixKey}
            onChange={e => setPixKey(e.target.value)}
            placeholder="CPF, email ou chave aleatória"
          />
        </Field>
      </Section>

      {/* Comanda */}
      <Section title="Rodapé da comanda">
        <Field label="Frase principal" icon={FileText}>
          <Input
            value={receiptFooter}
            onChange={e => setReceiptFooter(e.target.value)}
            placeholder="Deus é fiel, qualidade que faz rei"
          />
        </Field>
        <Field label="Frase secundária (opcional)" icon={FileText}>
          <Input
            value={receiptFooterSecondary}
            onChange={e => setReceiptFooterSecondary(e.target.value)}
            placeholder="Volte sempre!"
          />
        </Field>
      </Section>

      {/* Salvar */}
      <Button
        onClick={handleSave}
        disabled={isPending}
        className="w-full h-11 font-semibold"
        style={{ backgroundColor: 'var(--brand)', color: 'white' }}
      >
        {isPending
          ? <><Loader2 size={16} className="animate-spin mr-2" />Salvando...</>
          : 'Salvar configurações'
        }
      </Button>

    </div>
  )
}