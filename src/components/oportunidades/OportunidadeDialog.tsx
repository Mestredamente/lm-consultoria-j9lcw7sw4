import React, { useMemo, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { toast } from 'sonner'
import {
  useOportunidades,
  EstagioOportunidade,
  Oportunidade,
} from '@/contexts/OportunidadesContext'
import { useCompanies } from '@/contexts/CompaniesContext'
import { useContacts } from '@/contexts/ContactsContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { Loader2 } from 'lucide-react'

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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  oportunidadeToEdit?: Oportunidade | null
}

export function OportunidadeDialog({
  open,
  onOpenChange,
  oportunidadeToEdit,
}: Props) {
  const { addOportunidade, updateOportunidade } = useOportunidades()
  const { companies } = useCompanies()
  const { contacts } = useContacts()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isMobile = useIsMobile()
  const formRef = useRef<HTMLFormElement>(null)

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

  useEffect(() => {
    if (open) {
      if (oportunidadeToEdit) {
        form.reset({
          nome: oportunidadeToEdit.nome,
          empresa_id: oportunidadeToEdit.empresa_id || '',
          contato_id: oportunidadeToEdit.contato_id || '',
          valor_estimado:
            oportunidadeToEdit.valor_estimado !== null
              ? oportunidadeToEdit.valor_estimado
              : '',
          data_fechamento_prevista:
            oportunidadeToEdit.data_fechamento_prevista || '',
          probabilidade_percentual:
            oportunidadeToEdit.probabilidade_percentual !== null
              ? oportunidadeToEdit.probabilidade_percentual
              : '',
          estagio: oportunidadeToEdit.estagio,
          descricao: oportunidadeToEdit.descricao || '',
        })
      } else {
        form.reset({
          nome: '',
          empresa_id: '',
          contato_id: '',
          valor_estimado: '',
          data_fechamento_prevista: '',
          probabilidade_percentual: '',
          estagio: 'Prospecção',
          descricao: '',
        })
      }
    }
  }, [open, oportunidadeToEdit, form])

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
      payload.empresa_id = values.empresa_id || null
      payload.contato_id = values.contato_id || null
      payload.valor_estimado =
        values.valor_estimado !== '' &&
        values.valor_estimado !== undefined &&
        !isNaN(Number(values.valor_estimado))
          ? values.valor_estimado
          : null
      payload.data_fechamento_prevista = values.data_fechamento_prevista || null
      payload.probabilidade_percentual =
        values.probabilidade_percentual !== '' &&
        values.probabilidade_percentual !== undefined &&
        !isNaN(Number(values.probabilidade_percentual))
          ? values.probabilidade_percentual
          : null
      payload.descricao = values.descricao || null

      if (oportunidadeToEdit) {
        await updateOportunidade(oportunidadeToEdit.id, payload)
        toast.success('Oportunidade atualizada!')
      } else {
        await addOportunidade(payload)
        toast.success('Oportunidade criada!')
      }
      onOpenChange(false)
    } catch (error) {
      toast.error('Erro ao salvar oportunidade.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputFocus = (
    e: React.FocusEvent<HTMLInputElement | HTMLButtonElement>,
  ) => {
    if (isMobile) {
      setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-[600px] border-white/60 bg-white">
        <DialogHeader className="p-4 md:p-6 border-b border-gray-100 pb-4 sticky top-0 bg-white z-10">
          <DialogTitle className="text-xl md:text-2xl font-bold pr-8">
            {oportunidadeToEdit ? 'Editar Oportunidade' : 'Nova Oportunidade'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 pb-24 md:pb-6 scrollbar-thin scrollbar-thumb-gray-200">
          <Form {...form}>
            <form
              ref={formRef}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base md:text-sm">
                      Nome da Oportunidade *
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-12 md:h-10 text-base"
                        placeholder="Ex: Contrato Anual Serviços"
                        onFocus={handleInputFocus}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="empresa_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base md:text-sm">
                        Empresa
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger
                            className="h-12 md:h-10 text-base"
                            onFocus={handleInputFocus as any}
                          >
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((c) => (
                            <SelectItem
                              key={c.id}
                              value={c.id}
                              className="py-3"
                            >
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
                      <FormLabel className="text-base md:text-sm">
                        Contato
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                        disabled={
                          !selectedEmpresaId || filteredContacts.length === 0
                        }
                      >
                        <FormControl>
                          <SelectTrigger
                            className="h-12 md:h-10 text-base"
                            onFocus={handleInputFocus as any}
                          >
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredContacts.map((c) => (
                            <SelectItem
                              key={c.id}
                              value={c.id}
                              className="py-3"
                            >
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="valor_estimado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base md:text-sm">
                        Valor Estimado (R$)
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 md:h-10 text-base"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          placeholder="0.00"
                          onFocus={handleInputFocus}
                          {...field}
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
                      <FormLabel className="text-base md:text-sm">
                        Probabilidade (%)
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 md:h-10 text-base"
                          type="number"
                          inputMode="numeric"
                          min="0"
                          max="100"
                          placeholder="50"
                          onFocus={handleInputFocus}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="data_fechamento_prevista"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base md:text-sm">
                        Fechamento Previsto
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="h-12 md:h-10 text-base bg-white"
                          onFocus={handleInputFocus}
                          {...field}
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
                      <FormLabel className="text-base md:text-sm">
                        Estágio *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger
                            className="h-12 md:h-10 text-base"
                            onFocus={handleInputFocus as any}
                          >
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ESTAGIOS.map((estagio) => (
                            <SelectItem
                              key={estagio}
                              value={estagio}
                              className="py-3"
                            >
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
            </form>
          </Form>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-row items-center gap-3 sticky bottom-0 z-10 w-full mt-auto">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 md:h-10 text-base"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="flex-1 bg-black text-white hover:bg-gray-800 h-12 md:h-10 text-base"
            disabled={isSubmitting}
            onClick={() => {
              if (formRef.current) formRef.current.requestSubmit()
            }}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 md:w-4 md:h-4 mr-2 animate-spin" />
            ) : null}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
