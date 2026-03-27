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

const fieldSchema = z.object({
  entidade: z.string().min(1, 'Entidade é obrigatória'),
  nome: z.string().min(2, 'Nome é obrigatório'),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
})

export function CustomFieldsSettings() {
  const { user } = useAuth()
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof fieldSchema>>({
    resolver: zodResolver(fieldSchema),
    defaultValues: { entidade: 'empresas', nome: '', tipo: 'texto' },
  })

  const fetchFields = async () => {
    if (!user) return
    const { data } = await supabase
      .from('campos_personalizados')
      .select('*')
      .eq('usuario_id', user.id)
    if (data) setFields(data)
  }

  useEffect(() => {
    fetchFields()
  }, [user])

  const onSubmit = async (values: z.infer<typeof fieldSchema>) => {
    if (!user) return
    setLoading(true)
    try {
      const { error } = await supabase.from('campos_personalizados').insert({
        usuario_id: user.id,
        entidade: values.entidade,
        nome: values.nome,
        tipo: values.tipo,
      })
      if (error) throw error
      toast.success('Campo criado com sucesso!')
      form.reset({ ...values, nome: '' })
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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col md:flex-row items-start gap-4"
          >
            <FormField
              control={form.control}
              name="entidade"
              render={({ field }) => (
                <FormItem className="w-full md:w-48">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Entidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="empresas">Empresas</SelectItem>
                      <SelectItem value="contatos">Contatos</SelectItem>
                      <SelectItem value="oportunidades">
                        Oportunidades
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
                <FormItem className="w-full md:flex-1">
                  <FormControl>
                    <Input
                      placeholder="Nome do Campo"
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
                <FormItem className="w-full md:w-48">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="texto">Texto</SelectItem>
                      <SelectItem value="numero">Número</SelectItem>
                      <SelectItem value="data">Data</SelectItem>
                      <SelectItem value="booleano">Verdadeiro/Falso</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-black text-white hover:bg-gray-800 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Adicionar
            </Button>
          </form>
        </Form>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Campos Existentes
        </h3>
        <div className="rounded-xl border border-gray-100 overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="font-semibold">Entidade</TableHead>
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
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
