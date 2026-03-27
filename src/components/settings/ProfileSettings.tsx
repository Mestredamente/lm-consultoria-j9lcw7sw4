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
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const profileSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().optional().or(z.literal('')),
})

export function ProfileSettings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nome: '', email: '', senha: '' },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        nome: user.user_metadata?.name || '',
        email: user.email || '',
        senha: '',
      })
    }
  }, [user, form])

  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    setLoading(true)
    try {
      const updates: any = { email: values.email, data: { name: values.nome } }
      if (values.senha) updates.password = values.senha

      const { error } = await supabase.auth.updateUser(updates)
      if (error) throw error

      if (user) {
        await supabase
          .from('usuarios')
          .update({ nome: values.nome, email: values.email })
          .eq('id', user.id)
      }

      toast.success('Perfil atualizado com sucesso!')
      form.setValue('senha', '')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5 max-w-md"
      >
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Nome Completo</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="bg-gray-50/50 border-gray-200 focus-visible:ring-black"
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
            <FormItem>
              <FormLabel className="text-gray-700">E-mail</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  className="bg-gray-50/50 border-gray-200 focus-visible:ring-black"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="senha"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">
                Nova Senha (opcional)
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="Deixe em branco para manter"
                  className="bg-gray-50/50 border-gray-200 focus-visible:ring-black"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={loading}
          className="bg-black text-white hover:bg-gray-800 rounded-xl px-8"
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </form>
    </Form>
  )
}
