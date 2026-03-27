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
import { Trash2, Plus, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
              <div className="py-12 text-center text-muted-foreground">
                <p>Configuração de Custos Operacionais</p>
              </div>
            )}
            {step === 4 && (
              <div className="py-12 text-center text-muted-foreground">
                <p>Resumo Geral do Orçamento</p>
                <div className="mt-4 font-bold text-lg text-primary">
                  Total: R${' '}
                  {services
                    .filter((s) => s.checked)
                    .reduce(
                      (acc, s) => acc + s.quantidade * s.valor_unitario,
                      0,
                    )
                    .toFixed(2)}
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
