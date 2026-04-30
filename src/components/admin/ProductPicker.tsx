// componente para selecionar produtos e opções ao criar ou editar um pedido
'use client'

import { useState } from 'react'
import { Search, Plus, Check } from 'lucide-react'
import { Product, ProductOption } from '@/types'
import { Input }  from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface Props {
  products:  Product[]
  onAdd:     (product: Product, options: ProductOption[]) => void
}

export function ProductPicker({ products, onAdd }: Props) {
  const [search,          setSearch]          = useState('')
  const [selected,        setSelected]        = useState<Product | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<ProductOption[]>([])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) && p.available
  )

  function handleSelectProduct(product: Product) {
    setSelected(product)
    setSelectedOptions([])
  }

  function toggleOption(option: ProductOption, groupType: 'radio' | 'checkbox', groupId: string) {
    if (groupType === 'radio') {
      // Radio: substitui opção do mesmo grupo
      setSelectedOptions(prev => [
        ...prev.filter(o => {
          const group = selected?.option_groups?.find(g => g.options?.some(opt => opt.id === o.id))
          return group?.id !== groupId
        }),
        option,
      ])
    } else {
      // Checkbox: toggle
      setSelectedOptions(prev =>
        prev.some(o => o.id === option.id)
          ? prev.filter(o => o.id !== option.id)
          : [...prev, option]
      )
    }
  }

  function handleAdd() {
    if (!selected) return
    onAdd(selected, selectedOptions)
    setSelected(null)
    setSelectedOptions([])
    setSearch('')
  }

  // Verifica se opção está selecionada
  function isSelected(optionId: string) {
    return selectedOptions.some(o => o.id === optionId)
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Busca */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-subtle)' }}
        />
        <Input
          placeholder="Buscar produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de produtos */}
      {!selected && (
        <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
          {filtered.map(product => (
            <button
              key={product.id}
              onClick={() => handleSelectProduct(product)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--bg-muted)' }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {product.name}
                </p>
                {product.description && (
                  <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                    {product.description}
                  </p>
                )}
              </div>
              <span className="text-sm font-medium ml-3" style={{ color: 'var(--brand)' }}>
                {formatCurrency(product.price)}
              </span>
            </button>
          ))}

          {filtered.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-subtle)' }}>
              Nenhum produto encontrado
            </p>
          )}
        </div>
      )}

      {/* Adicionais do produto selecionado */}
      {selected && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {selected.name} — {formatCurrency(selected.price)}
            </p>
            <button
              className="text-xs"
              style={{ color: 'var(--text-subtle)' }}
              onClick={() => setSelected(null)}
            >
              trocar
            </button>
          </div>

          {/* Grupos de opções */}
          {selected.option_groups?.map(group => (
            <div key={group.id} className="flex flex-col gap-1.5">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                {group.name}
                {group.type === 'checkbox' && group.max_select > 1
                  ? ` (máx. ${group.max_select})`
                  : ''}
              </p>

              {group.options?.filter(o => o.available).map(option => {
                const active = isSelected(option.id)
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleOption(option, group.type as 'radio' | 'checkbox', group.id)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: active ? 'var(--brand-subtle)' : 'var(--bg-muted)',
                      border: `1px solid ${active ? 'var(--brand)' : 'transparent'}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0"
                        style={{
                          borderColor:     active ? 'var(--brand)' : 'var(--border-strong)',
                          backgroundColor: active ? 'var(--brand)' : 'transparent',
                        }}
                      >
                        {active && <Check size={10} color="white" />}
                      </div>
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        {option.name}
                      </span>
                    </div>
                    {option.price > 0 && (
                      <span className="text-xs" style={{ color: 'var(--brand)' }}>
                        +{formatCurrency(option.price)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}

          <Button
            onClick={handleAdd}
            className="w-full font-medium"
            style={{ backgroundColor: 'var(--brand)', color: 'white' }}
          >
            <Plus size={16} className="mr-1" />
            Adicionar ao pedido
          </Button>
        </div>
      )}
    </div>
  )
}