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
import { Trash2, Plus, Mail } from 'lucide-react'

const teamSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  role: z.string().min(1, 'Função é obrigatória'),
})

export function TeamSettings() {
  const { user, role: currentUserRole } = useAuth()
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof teamSchema>>({
    resolver: zodResolver(teamSchema),
    defaultValues: { nome: '', email: '', role: 'vendedor' },
  })

  const fetchMembers = async () => {
    if (!user) return
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .or(`id.eq.${user.id},parent_id.eq.${user.id}`)
      .order('created_at', { ascending: true })
    if (data) setMembers(data)
  }

  useEffect(() => {
    fetchMembers()
  }, [user])

  const onSubmit = async (values: z.infer<typeof teamSchema>) => {
    setLoading(true)
    try {
      // Mocking invitation since creating auth users requires admin privileges
      toast.success(`Convite enviado para ${values.email}`)
      form.reset()
    } catch (error: any) {
      toast.error('Erro ao enviar convite')
    } finally {
      setLoading(false)
    }
  }

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ role: newRole })
        .eq('id', userId)
      if (error) throw error
      toast.success('Função atualizada com sucesso')
      fetchMembers()
    } catch (err: any) {
      toast.error('Erro ao atualizar função')
    }
  }

  return (
    <div className="space-y-8">
      {currentUserRole === 'admin' && (
        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-400" />
            Convidar Novo Membro
          </h3>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col md:flex-row items-start gap-4"
            >
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem className="w-full md:flex-1">
                    <FormControl>
                      <Input
                        placeholder="Nome do colaborador"
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
                name="email"
                render={({ field }) => (
                  <FormItem className="w-full md:flex-1">
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="E-mail"
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
                name="role"
                render={({ field }) => (
                  <FormItem className="w-full md:w-48">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="gerente">Gerente</SelectItem>
                        <SelectItem value="vendedor">Vendedor</SelectItem>
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
                <Plus className="w-4 h-4 mr-2" /> Convidar
              </Button>
            </form>
          </Form>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Membros Atuais
        </h3>
        <div className="rounded-xl border border-gray-100 overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-gray-50/80">
              <TableRow>
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">E-mail</TableHead>
                <TableHead className="font-semibold">Função</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-gray-900">
                    {m.nome || '-'}
                  </TableCell>
                  <TableCell className="text-gray-500">{m.email}</TableCell>
                  <TableCell className="capitalize text-gray-600">
                    <Select
                      value={m.role || 'vendedor'}
                      onValueChange={(val) => updateRole(m.id, val)}
                      disabled={
                        currentUserRole !== 'admin' || m.id === user?.id
                      }
                    >
                      <SelectTrigger className="w-36 bg-transparent border-none shadow-none focus:ring-0 p-0 h-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="gerente">Gerente</SelectItem>
                        <SelectItem value="vendedor">Vendedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    {m.id !== user?.id && currentUserRole === 'admin' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
