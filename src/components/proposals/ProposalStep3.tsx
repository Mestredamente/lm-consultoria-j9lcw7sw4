import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, ChevronDown } from 'lucide-react'
import {
  COST_CATEGORIES,
  CostItem,
  CostCategory,
  MOCK_CIDADES,
  MOCK_TESTES,
  getCostSubtotal,
} from './proposal-types'

function CostRow({
  c,
  updateCost,
  removeCost,
}: {
  c: CostItem
  updateCost: any
  removeCost: any
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center bg-background p-4 rounded-lg border border-border shadow-sm relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full">
        {c.type === 'Deslocamento' && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Origem</Label>
              <Select
                value={c.origem}
                onValueChange={(v) => updateCost(c.id, 'origem', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_CIDADES.map((cid) => (
                    <SelectItem key={cid} value={cid}>
                      {cid}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Destino</Label>
              <Select
                value={c.destino}
                onValueChange={(v) => updateCost(c.id, 'destino', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_CIDADES.map((cid) => (
                    <SelectItem key={cid} value={cid}>
                      {cid}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Passagem (R$)</Label>
              <Input
                type="number"
                min="0"
                value={c.valor_passagem ?? ''}
                onChange={(e) =>
                  updateCost(c.id, 'valor_passagem', Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Transporte Local (R$)</Label>
              <Input
                type="number"
                min="0"
                value={c.transporte_local ?? ''}
                onChange={(e) =>
                  updateCost(c.id, 'transporte_local', Number(e.target.value))
                }
              />
            </div>
          </>
        )}
        {c.type === 'Hospedagem' && (
          <>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Nº de Noites</Label>
              <Input
                type="number"
                min="0"
                value={c.num_noites ?? ''}
                onChange={(e) =>
                  updateCost(c.id, 'num_noites', Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Valor da Diária (R$)</Label>
              <Input
                type="number"
                min="0"
                value={c.valor_diaria ?? ''}
                onChange={(e) =>
                  updateCost(c.id, 'valor_diaria', Number(e.target.value))
                }
              />
            </div>
          </>
        )}
        {c.type === 'Alimentação' && (
          <>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Nº de Dias</Label>
              <Input
                type="number"
                min="0"
                value={c.num_dias ?? ''}
                onChange={(e) =>
                  updateCost(c.id, 'num_dias', Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Valor por Dia (R$)</Label>
              <Input
                type="number"
                min="0"
                value={c.valor_dia ?? ''}
                onChange={(e) =>
                  updateCost(c.id, 'valor_dia', Number(e.target.value))
                }
              />
            </div>
          </>
        )}
        {c.type === 'Testes Psicológicos' && (
          <>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Tipo de Teste</Label>
              <Select
                value={c.tipo_teste}
                onValueChange={(v) => updateCost(c.id, 'tipo_teste', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_TESTES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nº Participantes</Label>
              <Input
                type="number"
                min="0"
                value={c.num_participantes ?? ''}
                onChange={(e) =>
                  updateCost(c.id, 'num_participantes', Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor Unitário (R$)</Label>
              <Input
                type="number"
                min="0"
                value={c.valor_unitario ?? ''}
                onChange={(e) =>
                  updateCost(c.id, 'valor_unitario', Number(e.target.value))
                }
              />
            </div>
          </>
        )}
        {c.type === 'Materiais' && (
          <>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Descrição</Label>
              <Input
                value={c.descricao ?? ''}
                onChange={(e) => updateCost(c.id, 'descricao', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quantidade</Label>
              <Input
                type="number"
                min="0"
                value={c.quantidade ?? ''}
                onChange={(e) =>
                  updateCost(c.id, 'quantidade', Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Valor Unitário (R$)</Label>
              <Input
                type="number"
                min="0"
                value={c.valor_unitario ?? ''}
                onChange={(e) =>
                  updateCost(c.id, 'valor_unitario', Number(e.target.value))
                }
              />
            </div>
          </>
        )}
      </div>
      <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border lg:pl-4">
        <div className="font-semibold text-primary whitespace-nowrap">
          R$ {getCostSubtotal(c).toFixed(2)}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeCost(c.id)}
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function ProposalStep3({
  costs,
  setCosts,
}: {
  costs: CostItem[]
  setCosts: any
}) {
  const addCost = (type: CostCategory) =>
    setCosts([...costs, { id: Math.random().toString(), type }])
  const updateCost = (id: string, field: keyof CostItem, value: any) =>
    setCosts((curr: CostItem[]) =>
      curr.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    )
  const removeCost = (id: string) =>
    setCosts((curr: CostItem[]) => curr.filter((c) => c.id !== id))

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 pb-4 fade-in">
      <div className="text-sm text-muted-foreground mb-4 px-1">
        Adicione os custos operacionais previstos. Eles serão somados ao valor
        final do orçamento da proposta.
      </div>
      <div className="space-y-3">
        {COST_CATEGORIES.map((cat) => {
          const catCosts = costs.filter((c) => c.type === cat)
          return (
            <Collapsible
              key={cat}
              className="border border-border/60 rounded-xl p-4 bg-muted/10"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full font-medium hover:text-primary transition-colors group [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-3">
                  <span className="text-base">{cat}</span>
                  {catCosts.length > 0 && (
                    <span className="bg-primary/10 text-primary text-xs px-2.5 py-0.5 rounded-full font-semibold">
                      {catCosts.length}
                    </span>
                  )}
                </div>
                <ChevronDown className="h-5 w-5 transition-transform duration-200 text-muted-foreground group-hover:text-primary" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4 animate-in slide-in-from-top-2">
                {catCosts.map((c) => (
                  <CostRow
                    key={c.id}
                    c={c}
                    updateCost={updateCost}
                    removeCost={removeCost}
                  />
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addCost(cat)}
                  className="shadow-sm"
                >
                  <Plus className="mr-2 h-4 w-4" /> Adicionar item de{' '}
                  {cat.toLowerCase()}
                </Button>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}
