import React, { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Plus,
  Search,
  CalendarIcon,
  Building2,
  Trash2,
  GripVertical,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import {
  useOportunidades,
  EstagioOportunidade,
} from '@/contexts/OportunidadesContext'
import { useCompanies } from '@/contexts/CompaniesContext'
import { useContacts } from '@/contexts/ContactsContext'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

const ESTAGIOS: EstagioOportunidade[] = [
  'Prospecção',
  'Qualificação',
  'Proposta',
  'Negociação',
  'Fechamento',
  'Ganho',
  'Perdido',
]

const formSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  empresa_id: z.string().optional().or(z.literal('')),
  contato_id: z.string().optional().or(z.literal('')),
  valor_estimado: z.coerce
    .number()
    .min(0, 'Valor inválido')
    .optional()
    .or(z.literal('')),
  data_fechamento_prevista: z.string().optional().or(z.literal('')),
  probabilidade_percentual: z.coerce
    .number()
    .min(0)
    .max(100)
    .optional()
    .or(z.literal('')),
  estagio: z.string().min(1, 'Estágio é obrigatório'),
  descricao: z.string().optional().or(z.literal('')),
})

export default function OportunidadesKanban() {
  const {
    oportunidades,
    addOportunidade,
    updateOportunidade,
    deleteOportunidade,
    loading,
  } = useOportunidades()
  const { companies } = useCompanies()
  const { contacts } = useContacts()

  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      empresa_id: '',
      contato_id: '',
      valor_estimado: '',
      data_fechamento_prevista: '',
      probabilidade_percentual: '',
      estagio: 'Prospecção',
      descricao: '',
    },
  })

  // Watch selected company to filter contacts
  const selectedEmpresaId = form.watch('empresa_id')
  const filteredContacts = useMemo(() => {
    if (!selectedEmpresaId) return contacts
    return contacts.filter((c) => c.companyId === selectedEmpresaId)
  }, [contacts, selectedEmpresaId])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      const payload: any = {
        nome: values.nome,
        estagio: values.estagio as EstagioOportunidade,
      }

      if (values.empresa_id) payload.empresa_id = values.empresa_id
      if (values.contato_id) payload.contato_id = values.contato_id
      if (
        values.valor_estimado !== '' &&
        values.valor_estimado !== undefined &&
        !isNaN(Number(values.valor_estimado))
      )
        payload.valor_estimado = values.valor_estimado
      if (values.data_fechamento_prevista)
        payload.data_fechamento_prevista = values.data_fechamento_prevista
      if (
        values.probabilidade_percentual !== '' &&
        values.probabilidade_percentual !== undefined &&
        !isNaN(Number(values.probabilidade_percentual))
      )
        payload.probabilidade_percentual = values.probabilidade_percentual
      if (values.descricao) payload.descricao = values.descricao

      await addOportunidade(payload)
      toast.success('Oportunidade criada com sucesso!')
      setIsOpen(false)
      form.reset()
    } catch (error) {
      toast.error('Erro ao criar oportunidade.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('oportunidade_id', id)
  }

  const handleDrop = async (
    e: React.DragEvent,
    novoEstagio: EstagioOportunidade,
  ) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-gray-200/50')
    const id = e.dataTransfer.getData('oportunidade_id')
    if (!id) return

    const oportunidade = oportunidades.find((o) => o.id === id)
    if (oportunidade && oportunidade.estagio !== novoEstagio) {
      try {
        await updateOportunidade(id, { estagio: novoEstagio })
        toast.success(`Movido para ${novoEstagio}`)
      } catch (err) {
        toast.error('Erro ao mover oportunidade.')
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('bg-gray-200/50')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-gray-200/50')
  }

  const filteredOportunidades = useMemo(() => {
    return oportunidades.filter(
      (op) =>
        op.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.empresas?.nome?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [oportunidades, searchTerm])

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground animate-pulse">
        Carregando oportunidades...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Pipeline de Vendas
          </h1>
          <p className="text-muted-foreground">
            Gerencie seu funil de negócios e oportunidades
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar oportunidade..."
              className="pl-9 bg-white/50 border-gray-200 rounded-xl focus-visible:ring-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-800 rounded-xl px-6 shadow-md transition-all whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" /> Nova Oportunidade
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] glass-card border-white/60">
              <DialogHeader>
                <DialogTitle>Nova Oportunidade</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4 mt-4"
                >
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Oportunidade *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Contrato Anual Serviços"
                            {...field}
                            className="bg-white/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="empresa_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Empresa</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white/50">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {companies.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contato_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contato</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                            disabled={
                              !selectedEmpresaId ||
                              filteredContacts.length === 0
                            }
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white/50">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredContacts.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="valor_estimado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Estimado (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              className="bg-white/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="probabilidade_percentual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Probabilidade (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="50"
                              {...field}
                              className="bg-white/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="data_fechamento_prevista"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fechamento Previsto</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              className="bg-white/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estagio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estágio *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-white/50">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ESTAGIOS.map((estagio) => (
                                <SelectItem key={estagio} value={estagio}>
                                  {estagio}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter className="mt-6 pt-4 border-t border-gray-100/50">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="bg-black text-white hover:bg-gray-800 rounded-xl"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Salvando...' : 'Salvar Oportunidade'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
        <div className="flex gap-4 h-full items-stretch min-w-max pb-2">
          {ESTAGIOS.map((estagio) => {
            const oportunidadesDaColuna = filteredOportunidades.filter(
              (op) => op.estagio === estagio,
            )

            return (
              <div
                key={estagio}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, estagio)}
                className="w-[320px] flex-shrink-0 bg-gray-50/80 rounded-2xl p-4 flex flex-col gap-3 h-full border border-gray-200/60 transition-colors"
              >
                <div className="font-semibold text-gray-700 flex items-center justify-between mb-1 px-1">
                  <span className="text-[15px]">{estagio}</span>
                  <span className="text-xs font-medium bg-white px-2.5 py-1 rounded-full text-gray-500 shadow-sm border border-gray-100">
                    {oportunidadesDaColuna.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 min-h-[100px]">
                  {oportunidadesDaColuna.map((op) => (
                    <Card
                      key={op.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, op.id)}
                      className="cursor-grab active:cursor-grabbing border-transparent shadow-sm hover:shadow-md transition-all bg-white relative group"
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <GripVertical className="w-4 h-4 text-gray-300 mt-0.5 cursor-grab hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">
                                {op.nome}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (
                                    confirm('Deseja excluir esta oportunidade?')
                                  ) {
                                    deleteOportunidade(op.id).catch(() =>
                                      toast.error('Erro ao excluir'),
                                    )
                                  }
                                }}
                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 bg-white"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {(op.empresas?.nome ||
                              op.valor_estimado !== null) && (
                              <div className="text-[13px] text-gray-500 flex flex-col gap-1.5 mt-2.5">
                                {op.empresas?.nome && (
                                  <span className="flex items-center gap-1.5 text-gray-600">
                                    <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                    <span className="truncate">
                                      {op.empresas.nome}
                                    </span>
                                  </span>
                                )}
                                {op.valor_estimado !== null && (
                                  <span className="font-medium text-emerald-600 flex items-center gap-1.5">
                                    <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-xs border border-emerald-100">
                                      {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                      }).format(op.valor_estimado)}
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}

                            {(op.data_fechamento_prevista ||
                              op.probabilidade_percentual !== null) && (
                              <div className="text-[11px] text-gray-400 flex items-center gap-3 pt-3 mt-3 border-t border-gray-100">
                                {op.data_fechamento_prevista && (
                                  <div className="flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    {format(
                                      parseISO(op.data_fechamento_prevista),
                                      'dd MMM',
                                      { locale: ptBR },
                                    )}
                                  </div>
                                )}
                                {op.probabilidade_percentual !== null && (
                                  <div
                                    className="flex items-center gap-1.5 font-medium"
                                    title="Probabilidade"
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    {op.probabilidade_percentual}%
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {oportunidadesDaColuna.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200/80 rounded-xl text-gray-400 text-sm bg-gray-50/50">
                      Arraste para cá
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
