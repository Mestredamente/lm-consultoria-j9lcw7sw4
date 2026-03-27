import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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

const formSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  position: z.string().min(2, 'Cargo é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(8, 'Telefone inválido'),
  linkedin: z.string().url('URL inválida').optional().or(z.literal('')),
  companyId: z.string().min(1, 'Empresa é obrigatória'),
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
          position: contactToEdit.position,
          email: contactToEdit.email,
          phone: contactToEdit.phone,
          linkedin: contactToEdit.linkedin || '',
          companyId: contactToEdit.companyId,
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (contactToEdit) {
      updateContact(contactToEdit.id, values)
    } else {
      addContact(values)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] glass-card border-white/60">
        <DialogHeader>
          <DialogTitle>
            {contactToEdit ? 'Editar Contato' : 'Novo Contato'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
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
                    <FormLabel>Cargo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Diretor de Vendas" {...field} />
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
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="contato@empresa.com" {...field} />
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
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
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
                    <FormLabel>Empresa</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
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
                    <FormLabel>LinkedIn (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://linkedin.com/in/..."
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
                  <FormLabel>Notas Internas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre o contato..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-black text-white hover:bg-gray-800"
              >
                Salvar Contato
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
