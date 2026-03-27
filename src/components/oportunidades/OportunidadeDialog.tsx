import React, { useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] glass-card border-white/60">
        <DialogHeader>
          <DialogTitle>
            {oportunidadeToEdit ? 'Editar Oportunidade' : 'Nova Oportunidade'}
          </DialogTitle>
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
                        !selectedEmpresaId || filteredContacts.length === 0
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
                      <Input type="date" {...field} className="bg-white/50" />
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
                onClick={() => onOpenChange(false)}
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
  )
}
