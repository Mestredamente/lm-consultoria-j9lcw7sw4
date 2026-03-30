import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useCompanies, Company } from '@/contexts/CompaniesContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Loader2 } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

const formSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  cnpj: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  employees: z.coerce.number().min(0, 'Deve ser maior ou igual a 0').optional(),
  email: z.string().email('E-mail inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
})

interface CompanyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyToEdit?: Company | null
}

export function CompanyDialog({
  open,
  onOpenChange,
  companyToEdit,
}: CompanyDialogProps) {
  const { addCompany, updateCompany } = useCompanies()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMobile = useIsMobile()
  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cnpj: '',
      industry: '',
      address: '',
      website: '',
      employees: 0,
      email: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (companyToEdit) {
        form.reset({
          name: companyToEdit.name,
          cnpj: companyToEdit.cnpj || '',
          industry: companyToEdit.industry || '',
          address: companyToEdit.address || '',
          website: companyToEdit.website || '',
          employees: companyToEdit.employees || 0,
          email: companyToEdit.email || '',
          phone: companyToEdit.phone || '',
        })
      } else {
        form.reset({
          name: '',
          cnpj: '',
          industry: '',
          address: '',
          website: '',
          employees: 0,
          email: '',
          phone: '',
        })
      }
    }
  }, [open, companyToEdit, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const payload = {
        name: values.name,
        cnpj: values.cnpj || '',
        industry: values.industry || '',
        address: values.address || '',
        website: values.website || '',
        employees: values.employees || 0,
        email: values.email || '',
        phone: values.phone || '',
      }

      if (companyToEdit) {
        await updateCompany(companyToEdit.id, payload)
        toast.success('Empresa atualizada com sucesso!')
      } else {
        await addCompany(payload)
        toast.success('Empresa criada com sucesso!')
      }
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro ao salvar a empresa.')
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
            {companyToEdit ? 'Editar Empresa' : 'Nova Empresa'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 pb-24 md:pb-6 scrollbar-thin scrollbar-thumb-gray-200">
          <Form {...form}>
            <form
              ref={formRef}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base md:text-sm">
                        Nome *
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 md:h-10 text-base"
                          placeholder="Nome da empresa"
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
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base md:text-sm">
                        CNPJ
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 md:h-10 text-base"
                          inputMode="numeric"
                          placeholder="00.000.000/0000-00"
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
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base md:text-sm">
                        Setor
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
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
                          <SelectItem value="Tecnologia" className="py-3">
                            Tecnologia
                          </SelectItem>
                          <SelectItem value="Logística" className="py-3">
                            Logística
                          </SelectItem>
                          <SelectItem value="Varejo" className="py-3">
                            Varejo
                          </SelectItem>
                          <SelectItem value="Saúde" className="py-3">
                            Saúde
                          </SelectItem>
                          <SelectItem value="Finanças" className="py-3">
                            Finanças
                          </SelectItem>
                          <SelectItem value="Indústria" className="py-3">
                            Indústria
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base md:text-sm">
                        Nº Funcionários
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 md:h-10 text-base"
                          type="number"
                          inputMode="numeric"
                          min="0"
                          onFocus={handleInputFocus}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="sm:col-span-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base md:text-sm">
                          Endereço
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-12 md:h-10 text-base"
                            placeholder="Endereço completo"
                            onFocus={handleInputFocus}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base md:text-sm">
                        Website
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 md:h-10 text-base"
                          inputMode="url"
                          placeholder="https://www.exemplo.com"
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base md:text-sm">
                        Email Principal
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 md:h-10 text-base"
                          type="email"
                          inputMode="email"
                          autoCapitalize="none"
                          autoCorrect="off"
                          placeholder="contato@empresa.com"
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base md:text-sm">
                        Telefone
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 md:h-10 text-base"
                          inputMode="tel"
                          placeholder="(11) 99999-9999"
                          onFocus={handleInputFocus}
                          {...field}
                        />
                      </FormControl>
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
              if (formRef.current) {
                formRef.current.requestSubmit()
              }
            }}
          >
            {isSubmitting && (
              <Loader2 className="w-5 h-5 md:w-4 md:h-4 mr-2 animate-spin" />
            )}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
