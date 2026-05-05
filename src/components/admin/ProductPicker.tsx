import { useState } from 'react'
import { Search, Plus, Check, Split } from 'lucide-react'
import { Product, ProductOption } from '@/types'
import { Input }  from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface Props {
  products: Product[]
  onAdd:    (
    product:   Product,
    options:   ProductOption[],
    splitWith: Product | null
  ) => void
}

export function ProductPicker({ products, onAdd }: Props) {
  const [search,          setSearch]          = useState('')
  const [selected,        setSelected]        = useState<Product | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<ProductOption[]>([])
  const [splitting,       setSplitting]       = useState(false)
  const [splitProduct,    setSplitProduct]    = useState<Product | null>(null)
  const [splitSearch,     setSplitSearch]     = useState('')

  // Verifica se produto é pizza
  const isPizza = (product: Product) =>
    product.category?.name?.toLowerCase().includes('pizza')

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) && p.available
  )

  // Pizzas disponíveis para dividir (exceto a selecionada)
  const pizzasToSplit = products.filter(p =>
    p.available &&
    isPizza(p) &&
    p.id !== selected?.id &&
    p.name.toLowerCase().includes(splitSearch.toLowerCase())
  )

  function handleSelectProduct(product: Product) {
    setSelected(product)
    setSelectedOptions([])
    setSplitting(false)
    setSplitProduct(null)
    setSplitSearch('')
  }

  function toggleOption(
    option:    ProductOption,
    groupType: 'radio' | 'checkbox',
    groupId:   string
  ) {
    if (groupType === 'radio') {
      setSelectedOptions(prev => [
        ...prev.filter(o => {
          const group = selected?.option_groups?.find(
            g => g.options?.some(opt => opt.id === o.id)
          )
          return group?.id !== groupId
        }),
        option,
      ])
    } else {
      setSelectedOptions(prev =>
        prev.some(o => o.id === option.id)
          ? prev.filter(o => o.id !== option.id)
          : [...prev, option]
      )
    }
  }

  function handleAdd() {
    if (!selected) return
    onAdd(selected, selectedOptions, splitProduct)
    setSelected(null)
    setSelectedOptions([])
    setSplitting(false)
    setSplitProduct(null)
    setSearch('')
    setSplitSearch('')
  }

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

      {/* Produto selecionado + adicionais */}
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

          {/* Botão dividir pizza */}
          {isPizza(selected) && !splitting && (
            <button
              onClick={() => setSplitting(true)}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg w-full transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'var(--bg-muted)',
                color:           'var(--brand)',
              }}
            >
              <Split size={14} />
              Dividir pizza com outro sabor
            </button>
          )}

          {/* Seletor do segundo sabor */}
          {splitting && (
            <div
              className="flex flex-col gap-2 p-3 rounded-lg"
              style={{ backgroundColor: 'var(--bg-muted)' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Segundo sabor
                </p>
                <button
                  className="text-xs"
                  style={{ color: 'var(--error)' }}
                  onClick={() => {
                    setSplitting(false)
                    setSplitProduct(null)
                    setSplitSearch('')
                  }}
                >
                  cancelar
                </button>
              </div>

              <Input
                placeholder="Buscar pizza..."
                value={splitSearch}
                onChange={e => setSplitSearch(e.target.value)}
                className="h-8 text-xs"
              />

              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                {pizzasToSplit.map(pizza => (
                  <button
                    key={pizza.id}
                    onClick={() => setSplitProduct(pizza)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-left"
                    style={{
                      backgroundColor: splitProduct?.id === pizza.id
                        ? 'var(--brand-subtle)'
                        : 'var(--bg-card)',
                      border: `1px solid ${splitProduct?.id === pizza.id
                        ? 'var(--brand)'
                        : 'transparent'}`,
                    }}
                  >
                    <span className="text-xs" style={{ color: 'var(--text-primary)' }}>
                      {pizza.name}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--brand)' }}>
                      {formatCurrency(pizza.price)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Preço final com divisão */}
              {splitProduct && (
                <p className="text-xs font-medium" style={{ color: 'var(--success)' }}>
                  Preço final: {formatCurrency(
                    Math.max(selected.price, splitProduct.price)
                  )} (maior valor)
                </p>
              )}
            </div>
          )}

          {/* Adicionais */}
          {selected.option_groups?.map(group => (
            <div key={group.id} className="flex flex-col gap-1.5">
              <p
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: 'var(--text-muted)' }}
              >
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
                    onClick={() => toggleOption(
                      option,
                      group.type as 'radio' | 'checkbox',
                      group.id
                    )}
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