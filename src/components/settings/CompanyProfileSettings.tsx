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

const companySchema = z.object({
  nome_consultorio: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  telefone_consultorio: z.string().optional(),
  endereco_consultorio: z.string().optional(),
  logo_url: z
    .string()
    .url('Deve ser uma URL válida')
    .optional()
    .or(z.literal('')),
})

export function CompanyProfileSettings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const form = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      nome_consultorio: '',
      telefone_consultorio: '',
      endereco_consultorio: '',
      logo_url: '',
    },
  })

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select(
            'nome_consultorio, telefone_consultorio, endereco_consultorio, logo_url',
          )
          .eq('id', user.id)
          .single()

        if (error) throw error
        if (data) {
          form.reset({
            nome_consultorio: data.nome_consultorio || '',
            telefone_consultorio: data.telefone_consultorio || '',
            endereco_consultorio: data.endereco_consultorio || '',
            logo_url: data.logo_url || '',
          })
        }
      } catch (err: any) {
        console.error(err)
      } finally {
        setInitialLoading(false)
      }
    }
    fetchCompanyData()
  }, [user, form])

  const onSubmit = async (values: z.infer<typeof companySchema>) => {
    if (!user) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome_consultorio: values.nome_consultorio,
          telefone_consultorio: values.telefone_consultorio,
          endereco_consultorio: values.endereco_consultorio,
          logo_url: values.logo_url || null,
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Dados da empresa atualizados com sucesso!')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar dados')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) return <div className="text-gray-500">Carregando...</div>

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="logo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">URL da Logomarca</FormLabel>
              <FormControl>
                <div className="flex gap-4 items-center">
                  {field.value && (
                    <div className="w-12 h-12 rounded bg-gray-100 flex-shrink-0 overflow-hidden border">
                      <img
                        src={field.value}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <Input
                    {...field}
                    placeholder="https://exemplo.com/logo.png"
                    className="bg-gray-50/50"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nome_consultorio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Nome da Empresa</FormLabel>
              <FormControl>
                <Input {...field} className="bg-gray-50/50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="telefone_consultorio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">
                Telefone Principal
              </FormLabel>
              <FormControl>
                <Input {...field} className="bg-gray-50/50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endereco_consultorio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700">Endereço Completo</FormLabel>
              <FormControl>
                <Input {...field} className="bg-gray-50/50" />
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
