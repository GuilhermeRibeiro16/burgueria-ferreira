'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, ImagePlus, Loader2 } from 'lucide-react'
import { Product, Category } from '@/types'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Button }   from '@/components/ui/button'
import { Separator} from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { uploadProductImage } from '@/lib/actions/products'
import { formatCurrency }     from '@/lib/utils'
import Image from 'next/image'

// Tipo local para grupo de opções no formulário
interface OptionGroupDraft {
  id:         string
  name:       string
  type:       'radio' | 'checkbox'
  max_select: number
  options: {
    id:        string
    name:      string
    price:     number
    available: boolean
  }[]
}

interface Props {
  product?:    Product     // se passado = modo edição
  categories:  Category[]
  onSave:      (data: any) => Promise<void>
  onCancel:    () => void
  loading:     boolean
}

export function ProductForm({ product, categories, onSave, onCancel, loading }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  // Campos básicos
  const [name,        setName]        = useState(product?.name        ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price,       setPrice]       = useState(product?.price.toString() ?? '')
  const [categoryId,  setCategoryId]  = useState(product?.category_id ?? '')
  const [available,   setAvailable]   = useState(product?.available   ?? true)
  const [imageUrl,    setImageUrl]    = useState(product?.image_url   ?? '')
  const [uploading,   setUploading]   = useState(false)

  // Grupos de opções
  const [groups, setGroups] = useState<OptionGroupDraft[]>(
    product?.option_groups?.map(g => ({
      id:         g.id,
      name:       g.name,
      type:       g.type as 'radio' | 'checkbox',
      max_select: g.max_select,
      options:    g.options?.map(o => ({
        id:        o.id,
        name:      o.name,
        price:     o.price,
        available: o.available,
      })) ?? [],
    })) ?? []
  )

  // ── Upload de imagem ──
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const url = await uploadProductImage(formData)
      setImageUrl(url)
    } catch {
      alert('Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
    }
  }

  // ── Grupos de opções ──
  function addGroup() {
    setGroups(prev => [...prev, {
      id:         `draft-${Date.now()}`,
      name:       '',
      type:       'checkbox',
      max_select: 1,
      options:    [],
    }])
  }

  function removeGroup(groupId: string) {
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }

  function updateGroup(groupId: string, field: string, value: any) {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, [field]: value } : g
    ))
  }

  function addOption(groupId: string) {
    setGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, options: [...g.options, {
            id:        `opt-${Date.now()}`,
            name:      '',
            price:     0,
            available: true,
          }]}
        : g
    ))
  }

  function removeOption(groupId: string, optionId: string) {
    setGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, options: g.options.filter(o => o.id !== optionId) }
        : g
    ))
  }

  function updateOption(groupId: string, optionId: string, field: string, value: any) {
    setGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, options: g.options.map(o =>
            o.id === optionId ? { ...o, [field]: value } : o
          )}
        : g
    ))
  }

  // ── Submit ──
  async function handleSubmit() {
    if (!name.trim())       return alert('Informe o nome do produto')
    if (!price)             return alert('Informe o preço')
    if (!categoryId)        return alert('Selecione uma categoria')

    await onSave({
      name,
      description:   description || null,
      price:         parseFloat(price.replace(',', '.')),
      category_id:   categoryId,
      image_url:     imageUrl || null,
      available,
      option_groups: groups.map(g => ({
        name:       g.name,
        type:       g.type,
        max_select: g.max_select,
        options:    g.options,
      })),
    })
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Imagem */}
      <div className="flex flex-col gap-2">
        <Label style={{ color: 'var(--text-muted)' }}>Foto do produto</Label>
        <div
          className="relative w-full h-36 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden"
          style={{ borderColor: 'var(--border-strong)' }}
          onClick={() => fileRef.current?.click()}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Produto"
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2" style={{ color: 'var(--text-subtle)' }}>
              {uploading
                ? <Loader2 size={24} className="animate-spin" />
                : <><ImagePlus size={24} /><span className="text-xs">Clique para adicionar foto</span></>
              }
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageUpload}
        />
        {imageUrl && (
          <button
            className="text-xs self-start"
            style={{ color: 'var(--error)' }}
            onClick={() => setImageUrl('')}
          >
            Remover foto
          </button>
        )}
      </div>

      <Separator style={{ backgroundColor: 'var(--border)' }} />

      {/* Dados básicos */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label style={{ color: 'var(--text-muted)' }}>Nome</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="X-Burguer"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label style={{ color: 'var(--text-muted)' }}>Descrição (ingredientes)</Label>
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Pão, hambúrguer 150g, queijo, alface..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label style={{ color: 'var(--text-muted)' }}>Preço (R$)</Label>
            <Input
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="25.00"
              type="number"
              step="0.01"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label style={{ color: 'var(--text-muted)' }}>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Disponível */}
        <div className="flex gap-2">
          {([true, false] as const).map(val => (
            <button
              key={String(val)}
              onClick={() => setAvailable(val)}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: available === val ? 'var(--brand)' : 'var(--bg-muted)',
                color:           available === val ? 'white' : 'var(--text-muted)',
              }}
            >
              {val ? 'Disponível' : 'Indisponível'}
            </button>
          ))}
        </div>
      </div>

      <Separator style={{ backgroundColor: 'var(--border)' }} />

      {/* Grupos de opções */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Adicionais
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={addGroup}
            className="text-xs"
          >
            <Plus size={14} className="mr-1" />
            Novo grupo
          </Button>
        </div>

        {groups.map(group => (
          <div
            key={group.id}
            className="rounded-xl border p-3 flex flex-col gap-3"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-muted)' }}
          >
            {/* Header do grupo */}
            <div className="flex items-center gap-2">
              <Input
                value={group.name}
                onChange={e => updateGroup(group.id, 'name', e.target.value)}
                placeholder="Nome do grupo (ex: Adicionais)"
                className="flex-1"
              />
              <button onClick={() => removeGroup(group.id)} style={{ color: 'var(--error)' }}>
                <Trash2 size={16} />
              </button>
            </div>

            {/* Tipo e max */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs" style={{ color: 'var(--text-muted)' }}>Tipo</Label>
                <Select
                  value={group.type}
                  onValueChange={v => updateGroup(group.id, 'type', v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="radio">Escolha única</SelectItem>
                    <SelectItem value="checkbox">Múltipla escolha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs" style={{ color: 'var(--text-muted)' }}>Máx. seleções</Label>
                <Input
                  type="number"
                  min={1}
                  value={group.max_select}
                  onChange={e => updateGroup(group.id, 'max_select', parseInt(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Opções */}
            <div className="flex flex-col gap-2">
              {group.options.map(option => (
                <div key={option.id} className="flex items-center gap-2">
                  <Input
                    value={option.name}
                    onChange={e => updateOption(group.id, option.id, 'name', e.target.value)}
                    placeholder="Nome do adicional"
                    className="flex-1 h-8 text-xs"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={option.price}
                    onChange={e => updateOption(group.id, option.id, 'price', parseFloat(e.target.value) || 0)}
                    placeholder="R$"
                    className="w-20 h-8 text-xs"
                  />
                  <button
                    onClick={() => removeOption(group.id, option.id)}
                    style={{ color: 'var(--error)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addOption(group.id)}
                className="text-xs flex items-center gap-1 self-start mt-1"
                style={{ color: 'var(--brand)' }}
              >
                <Plus size={13} />
                Adicionar opção
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || uploading}
          className="flex-1 font-semibold"
          style={{ backgroundColor: 'var(--brand)', color: 'white' }}
        >
          {loading ? <><Loader2 size={15} className="animate-spin mr-2" />Salvando...</> : 'Salvar'}
        </Button>
      </div>

    </div>
  )
}