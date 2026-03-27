import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, Plus, CheckCircle2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

const MOCK_EMPRESAS = [
  { id: '1', nome: 'Tech Solutions SA' },
  { id: '2', nome: 'Indústria Global' },
]
const MOCK_CONTATOS = [
  { id: '1', empresa_id: '1', nome: 'João Silva' },
  { id: '2', empresa_id: '2', nome: 'Carlos Souza' },
]
const MOCK_OPORTUNIDADES = [
  { id: '1', empresa_id: '1', nome: 'Transformação Digital 2026' },
]
const TIPOS_SERVICO = [
  'Consultoria Estratégica',
  'Treinamento Corporativo',
  'Coaching Executivo',
  'Diagnóstico Organizacional',
  'Palestra/Workshop',
]

interface ServiceRow {
  id: string
  tipo: string
  descricao: string
  quantidade: number
  valor_unitario: number
  checked: boolean
  isCustom?: boolean
}

type CostCategory =
  | 'Deslocamento'
  | 'Hospedagem'
  | 'Alimentação'
  | 'Testes Psicológicos'
  | 'Materiais'

interface CostItem {
  id: string
  type: CostCategory
  origem?: string
  destino?: string
  passagem?: number
  transporte?: number
  diarias?: number
  valor_diaria?: number
  dias?: number
  valor_dia?: number
  tipo_teste?: string
  participantes?: number
  valor_unitario?: number
  descricao?: string
  quantidade?: number
}

const COST_CATEGORIES: CostCategory[] = [
  'Deslocamento',
  'Hospedagem',
  'Alimentação',
  'Testes Psicológicos',
  'Materiais',
]

export function NewProposalModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSuccess?: () => void
}) {
  const [step, setStep] = useState(1)
  const [empId, setEmpId] = useState('')
  const [contId, setContId] = useState('')
  const [optId, setOptId] = useState('')
  const [services, setServices] = useState<ServiceRow[]>(
    TIPOS_SERVICO.map((t) => ({
      id: t,
      tipo: t,
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      checked: false,
    })),
  )
  const [costs, setCosts] = useState<CostItem[]>([])

  const filteredContatos = useMemo(
    () => MOCK_CONTATOS.filter((c) => c.empresa_id === empId),
    [empId],
  )
  const filteredOportunidades = useMemo(
    () => MOCK_OPORTUNIDADES.filter((o) => o.empresa_id === empId),
    [empId],
  )

  const updateSrv = (id: string, f: keyof ServiceRow, v: any) =>
    setServices((s) => s.map((x) => (x.id === id ? { ...x, [f]: v } : x)))
  const addCustom = () =>
    setServices([
      ...services,
      {
        id: Math.random().toString(),
        tipo: 'Outro',
        descricao: '',
        quantidade: 1,
        valor_unitario: 0,
        checked: true,
        isCustom: true,
      },
    ])

  const addCost = (type: CostCategory) => {
    setCosts([...costs, { id: Math.random().toString(), type }])
  }

  const updateCost = (id: string, field: keyof CostItem, value: any) => {
    setCosts((curr) =>
      curr.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    )
  }

  const removeCost = (id: string) => {
    setCosts((curr) => curr.filter((c) => c.id !== id))
  }

  const getCostSubtotal = (c: CostItem) => {
    switch (c.type) {
      case 'Deslocamento':
        return (c.passagem || 0) + (c.transporte || 0)
      case 'Hospedagem':
        return (c.diarias || 0) * (c.valor_diaria || 0)
      case 'Alimentação':
        return (c.dias || 0) * (c.valor_dia || 0)
      case 'Testes Psicológicos':
        return (c.participantes || 0) * (c.valor_unitario || 0)
      case 'Materiais':
        return (c.quantidade || 0) * (c.valor_unitario || 0)
      default:
        return 0
    }
  }

  const totalServices = useMemo(
    () =>
      services
        .filter((s) => s.checked)
        .reduce((acc, s) => acc + s.quantidade * s.valor_unitario, 0),
    [services],
  )

  const totalCosts = useMemo(
    () => costs.reduce((acc, c) => acc + getCostSubtotal(c), 0),
    [costs],
  )

  const handleSave = () => {
    if (onSuccess) onSuccess()
    onOpenChange(false)
    setStep(1)
    setEmpId('')
    setContId('')
    setOptId('')
    setServices(
      TIPOS_SERVICO.map((t) => ({
        id: t,
        tipo: t,
        descricao: '',
        quantidade: 1,
        valor_unitario: 0,
        checked: false,
      })),
    )
    setCosts([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Proposta</DialogTitle>
          <DialogDescription>
            Crie uma nova proposta em passos simples.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="flex items-center justify-between mb-8 px-2 md:px-8">
            {['Cliente', 'Serviços', 'Custos', 'Resumo'].map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium',
                      step === i + 1
                        ? 'border-primary bg-primary text-primary-foreground'
                        : step > i + 1
                          ? 'border-primary bg-primary/20 text-primary'
                          : 'border-muted bg-background text-muted-foreground',
                    )}
                  >
                    {step > i + 1 ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium hidden sm:block',
                      step >= i + 1 ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {label}
                  </span>
                </div>
                {i < 3 && (
                  <div
                    className={cn(
                      'h-[2px] w-6 sm:w-16 md:w-24 -translate-y-0 sm:-translate-y-3 mx-2',
                      step > i + 1 ? 'bg-primary' : 'bg-muted',
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 min-h-[300px]">
            {step === 1 && (
              <div className="space-y-4 max-w-md mx-auto">
                <div className="space-y-2">
                  <Label>
                    Empresa <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={empId}
                    onValueChange={(v) => {
                      setEmpId(v)
                      setContId('')
                      setOptId('')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_EMPRESAS.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Contato</Label>
                  <Select
                    value={contId}
                    onValueChange={setContId}
                    disabled={!empId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredContatos.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Oportunidade (Opcional)</Label>
                  <Select
                    value={optId}
                    onValueChange={setOptId}
                    disabled={!empId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredOportunidades.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-[100px]">Qtd</TableHead>
                        <TableHead className="w-[150px]">Valor Un.</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((srv) => (
                        <TableRow
                          key={srv.id}
                          className={srv.checked ? 'bg-muted/30' : ''}
                        >
                          <TableCell>
                            <Checkbox
                              checked={srv.checked}
                              onCheckedChange={(c) =>
                                updateSrv(srv.id, 'checked', !!c)
                              }
                            />
                          </TableCell>
                          <TableCell className="min-w-[200px]">
                            {srv.isCustom ? (
                              <Input
                                value={srv.tipo}
                                onChange={(e) =>
                                  updateSrv(srv.id, 'tipo', e.target.value)
                                }
                                disabled={!srv.checked}
                              />
                            ) : (
                              <span
                                className={
                                  srv.checked
                                    ? 'font-medium'
                                    : 'text-muted-foreground'
                                }
                              >
                                {srv.tipo}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="min-w-[200px]">
                            <Input
                              value={srv.descricao}
                              onChange={(e) =>
                                updateSrv(srv.id, 'descricao', e.target.value)
                              }
                              disabled={!srv.checked}
                              placeholder="Detalhes..."
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={srv.quantidade}
                              onChange={(e) =>
                                updateSrv(
                                  srv.id,
                                  'quantidade',
                                  Number(e.target.value),
                                )
                              }
                              disabled={!srv.checked}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={srv.valor_unitario}
                              onChange={(e) =>
                                updateSrv(
                                  srv.id,
                                  'valor_unitario',
                                  Number(e.target.value),
                                )
                              }
                              disabled={!srv.checked}
                            />
                          </TableCell>
                          <TableCell>
                            {srv.isCustom && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setServices((s) =>
                                    s.filter((x) => x.id !== srv.id),
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button variant="outline" size="sm" onClick={addCustom}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Serviço
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4 px-1">
                  Adicione os custos operacionais previstos para a proposta.
                  Eles serão somados ao valor final do orçamento.
                </div>
                {COST_CATEGORIES.map((cat) => {
                  const catCosts = costs.filter((c) => c.type === cat)
                  return (
                    <Collapsible
                      key={cat}
                      className="border rounded-md p-4 bg-card"
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full font-medium hover:text-primary transition-colors [&[data-state=open]>svg]:rotate-180">
                        <div className="flex items-center gap-3">
                          <span>{cat}</span>
                          {catCosts.length > 0 && (
                            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                              {catCosts.length} item(s)
                            </span>
                          )}
                        </div>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4 space-y-4">
                        {catCosts.map((c) => (
                          <div
                            key={c.id}
                            className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-muted/30 p-3 rounded-md border border-muted"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full">
                              {cat === 'Deslocamento' && (
                                <>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Origem</Label>
                                    <Input
                                      value={c.origem ?? ''}
                                      onChange={(e) =>
                                        updateCost(
                                          c.id,
                                          'origem',
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Ex: São Paulo"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Destino</Label>
                                    <Input
                                      value={c.destino ?? ''}
                                      onChange={(e) =>
                                        updateCost(
                                          c.id,
                                          'destino',
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Ex: Rio de Janeiro"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">
                                      Passagem (R$)
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={c.passagem ?? ''}
                                      onChange={(e) =>
                                        updateCost(
                                          c.id,
                                          'passagem',
                                          Number(e.target.value),
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">
                                      Transporte Local (R$)
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={c.transporte ?? ''}
                                      onChange={(e) =>
                                        updateCost(
                                          c.id,
                                          'transporte',
                                          Number(e.target.value),
                                        )
                                      }
                                    />
                                  </div>
                                </>
                              )}
                              {cat === 'Hospedagem' && (
                                <>
                                  <div className="space-y-1 md:col-span-2">
                                    <Label className="text-xs">
                                      Nº de Diárias
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={c.diarias ?? ''}
                                      onChange={(e) =>
                                        updateCost(
                                          c.id,
                                          'diarias',
                                          Number(e.target.value),
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1 md:col-span-2">
                                    <Label className="text-xs">
                                      Valor por Diária (R$)
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={c.valor_diaria ?? ''}
                                      onChange={(e) =>
                                        updateCost(
                                          c.id,
                                          'valor_diaria',
                                          Number(e.target.value),
                                        )
                                      }
                                    />
                                  </div>
                                </>
                              )}
                              {cat === 'Alimentação' && (
                                <>
                                  <div className="space-y-1 md:col-span-2">
                                    <Label className="text-xs">
                                      Nº de Dias
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={c.dias ?? ''}
                                      onChange={(e) =>
                                        updateCost(
                                          c.id,
                                          'dias',
                                          Number(e.target.value),
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1 md:col-span-2">
                                    <Label className="text-xs">
                                      Valor por Dia (R$)
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={c.valor_dia ?? ''}
                                      onChange={(e) =>
                                        updateCost(
                                          c.id,
                                          'valor_dia',
                                          Number(e.target.value),
                                        )
                                      }
                                    />
                                  </div>
                                </>
                              )}
                              {cat === 'Testes Psicológicos' && (
                                <>
                                  <div className="space-y-1 md:col-span-2">
                                    <Label className="text-xs">
                                      Tipo de Teste
                                    </Label>
                                    <Input
                                      value={c.tipo_teste ?? ''}
                                      onChange={(e) =>
                                        updateCost(
                                          c.id,
                                          'tipo_teste',
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Ex: Palográfico"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">
                                      Nº Participantes
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={c.participantes ?? ''}
                                      onChange={(e) =>
                                        updateCost(
                                          c.id,
                                          'participantes',
                                          Number(e.target.value),
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">
                                      Valor Unitário (R$)
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={c.valor_unitario ?? ''}
                                      onChange={(e) =>
                                        updateCost(
                                          c.id,
                                          'valor_unitario',
                                          Number(e.target.value),
                                        )
                                      }
                                    />
                                  </div>
                                </>
                              )}
                              {cat === 'Materiais' && (
                                <>
                                  <div className="space-y-1 md:col-span-2">
                                    <Label className="text-xs">Descrição</Label>
                                    <Input
                                      value={c.descricao ?? ''}
                                      onChange={(e) =>
                                        updateCost(
                                          c.id,
                                          'descricao',
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Ex: Apostilas de treinamento"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">
                                      Quantidade
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={c.quantidade ?? ''}
                                      onChange={(e) =>
                                        updateCost(
                                          c.id,
                                          'quantidade',
                                          Number(e.target.value),
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">
                                      Valor Unitário (R$)
                                    </Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={c.valor_unitario ?? ''}
                                      onChange={(e) =>
                                        updateCost(
                                          c.id,
                                          'valor_unitario',
                                          Number(e.target.value),
                                        )
                                      }
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0 pt-2 md:pt-6 border-t md:border-t-0 md:border-l border-border md:pl-4">
                              <div className="text-sm font-semibold whitespace-nowrap text-primary">
                                R$ {getCostSubtotal(c).toFixed(2)}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeCost(c.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50/50 h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addCost(cat)}
                          className="mt-2 text-xs"
                        >
                          <Plus className="mr-2 h-3 w-3" /> Adicionar Custo
                        </Button>
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </div>
            )}
            {step === 4 && (
              <div className="max-w-md mx-auto py-8 space-y-6">
                <div className="text-center">
                  <h3 className="font-semibold text-xl">Resumo do Orçamento</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Confira a composição final dos valores da sua proposta antes
                    de salvá-la.
                  </p>
                </div>
                <div className="space-y-4 bg-muted/30 p-6 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center pb-3 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">
                      Total de Serviços
                    </span>
                    <span className="font-medium text-foreground">
                      R$ {totalServices.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">
                      Total de Custos Operacionais
                    </span>
                    <span className="font-medium text-foreground">
                      R$ {totalCosts.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-bold text-lg text-foreground">
                      Valor Final
                    </span>
                    <span className="font-bold text-2xl text-primary tracking-tight">
                      R$ {(totalServices + totalCosts).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between w-full mt-4">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
          >
            Voltar
          </Button>
          {step < 4 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !empId}
            >
              Próximo
            </Button>
          ) : (
            <Button onClick={handleSave}>Salvar Proposta</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
