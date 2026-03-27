import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { Trash2, Plus, Blocks } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

const fieldSchema = z
  .object({
    entidade: z.string().min(1, 'Entidade é obrigatória'),
    nome: z.string().min(2, 'Nome é obrigatório'),
    tipo: z.string().min(1, 'Tipo é obrigatório'),
    obrigatorio: z.boolean().default(false),
    opcoes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.tipo === 'select' &&
        (!data.opcoes || data.opcoes.trim() === '')
      ) {
        return false
      }
      return true
    },
    {
      message: 'Opções são obrigatórias para campos do tipo Select',
      path: ['opcoes'],
    },
  )

export function CustomFieldsSettings() {
  const { user } = useAuth()
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof fieldSchema>>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      entidade: 'empresa',
      nome: '',
      tipo: 'texto',
      obrigatorio: false,
      opcoes: '',
    },
  })

  const watchTipo = form.watch('tipo')

  const fetchFields = async () => {
    if (!user) return
    const { data } = await supabase
      .from('campos_personalizados')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setFields(data)
  }

  useEffect(() => {
    fetchFields()
  }, [user])

  const onSubmit = async (values: z.infer<typeof fieldSchema>) => {
    if (!user) return
    setLoading(true)
    try {
      const opcoesArray =
        values.tipo === 'select' && values.opcoes
          ? values.opcoes.split(',').map((s) => s.trim())
          : null

      const { error } = await supabase.from('campos_personalizados').insert({
        usuario_id: user.id,
        entidade: values.entidade,
        nome: values.nome,
        tipo: values.tipo,
        obrigatorio: values.obrigatorio,
        opcoes: opcoesArray,
      })
      if (error) throw error
      toast.success('Campo personalizado criado com sucesso!')
      form.reset({
        ...values,
        nome: '',
        opcoes: '',
        obrigatorio: false,
      })
      fetchFields()
    } catch (error: any) {
      toast.error('Erro ao criar campo: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este campo permanentemente?')) return
    try {
      await supabase.from('campos_personalizados').delete().eq('id', id)
      toast.success('Campo excluído.')
      fetchFields()
    } catch (err) {
      toast.error('Erro ao excluir campo.')
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Blocks className="w-5 h-5 text-gray-400" />
          Adicionar Novo Campo
        </h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="entidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entidade</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="empresa">Empresa</SelectItem>
                        <SelectItem value="contato">Contato</SelectItem>
                        <SelectItem value="oportunidade">
                          Oportunidade
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Campo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Origem do Lead"
                        className="bg-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="texto">Texto</SelectItem>
                        <SelectItem value="numero">Número</SelectItem>
                        <SelectItem value="data">Data</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchTipo === 'select' && (
              <FormField
                control={form.control}
                name="opcoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opções (separadas por vírgula)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="LinkedIn, Indicação, Evento"
                        className="bg-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 gap-4">
              <FormField
                control={form.control}
                name="obrigatorio"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      Campo Obrigatório
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" /> Adicionar Campo
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Campos Existentes
        </h3>
        <div className="rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="font-semibold">Entidade</TableHead>
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold text-center">
                  Obrigatório
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-500 py-8"
                  >
                    Nenhum campo personalizado cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                fields.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {f.entidade}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {f.nome}
                    </TableCell>
                    <TableCell className="capitalize text-gray-500">
                      {f.tipo}
                    </TableCell>
                    <TableCell className="text-center">
                      {f.obrigatorio ? (
                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0">
                          Sim
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">Não</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(f.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
