import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { useContacts, Contact } from '@/contexts/ContactsContext'
import { useCompanies } from '@/contexts/CompaniesContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  position: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  linkedin: z.string().url('URL inválida').optional().or(z.literal('')),
  companyId: z.string().optional(),
  notes: z.string().optional(),
})

interface ContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactToEdit?: Contact | null
}

export function ContactDialog({
  open,
  onOpenChange,
  contactToEdit,
}: ContactDialogProps) {
  const { addContact, updateContact } = useContacts()
  const { companies } = useCompanies()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isMobile = useIsMobile()
  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      position: '',
      email: '',
      phone: '',
      linkedin: '',
      companyId: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (contactToEdit) {
        form.reset({
          name: contactToEdit.name,
          position: contactToEdit.position || '',
          email: contactToEdit.email || '',
          phone: contactToEdit.phone || '',
          linkedin: contactToEdit.linkedin || '',
          companyId: contactToEdit.companyId || '',
          notes: contactToEdit.notes || '',
        })
      } else {
        form.reset({
          name: '',
          position: '',
          email: '',
          phone: '',
          linkedin: '',
          companyId: '',
          notes: '',
        })
      }
    }
  }, [open, contactToEdit, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      if (contactToEdit) {
        await updateContact(contactToEdit.id, values as any)
        toast.success('Contato atualizado com sucesso!')
      } else {
        await addContact(values as any)
        toast.success('Contato criado com sucesso!')
      }
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro ao salvar o contato.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputFocus = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement
    >,
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
            {contactToEdit ? 'Editar Contato' : 'Novo Contato'}
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
                          placeholder="Nome completo"
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
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base md:text-sm">
                        Cargo
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 md:h-10 text-base"
                          placeholder="Ex: Diretor de Vendas"
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
                        E-mail
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 md:h-10 text-base"
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
                          placeholder="(00) 00000-0000"
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
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base md:text-sm">
                        Empresa
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger
                            className="h-12 md:h-10 text-base"
                            onFocus={handleInputFocus as any}
                          >
                            <SelectValue placeholder="Selecione (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none" className="py-3">
                            Sem empresa
                          </SelectItem>
                          {companies.map((company) => (
                            <SelectItem
                              key={company.id}
                              value={company.id}
                              className="py-3"
                            >
                              {company.name}
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
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base md:text-sm">
                        LinkedIn (Opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-12 md:h-10 text-base"
                          inputMode="url"
                          placeholder="https://linkedin.com/in/..."
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base md:text-sm">
                      Notas Internas
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações adicionais sobre o contato..."
                        className="resize-none min-h-[100px] text-base md:text-sm p-3"
                        onFocus={handleInputFocus}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            Salvar Contato
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
