import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useLeads, LeadStatus } from '@/contexts/LeadsContext'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Badge } from '@/components/ui/badge'

const formSchema = z.object({
  company: z.string().min(2, 'Nome da empresa é obrigatório'),
  contact: z.string().min(2, 'Nome do contato é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(8, 'Telefone inválido'),
  segment: z.string().min(1, 'Selecione um segmento'),
  size: z.string().min(1, 'Selecione o tamanho'),
  source: z.string().min(1, 'Selecione a origem'),
})

export default function Leads() {
  const { leads, addLead } = useLeads()
  const [isOpen, setIsOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterSegment, setFilterSegment] = useState<string>('todos')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company: '',
      contact: '',
      email: '',
      phone: '',
      segment: '',
      size: '',
      source: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    addLead({
      ...values,
      status: 'Novo',
    })
    setIsOpen(false)
    form.reset()
  }

  const filteredLeads = leads.filter((lead) => {
    const statusMatch = filterStatus === 'todos' || lead.status === filterStatus
    const segmentMatch =
      filterSegment === 'todos' || lead.segment === filterSegment
    return statusMatch && segmentMatch
  })

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'Novo':
        return 'bg-blue-100 text-blue-700'
      case 'Qualificado':
        return 'bg-yellow-100 text-yellow-700'
      case 'Em Negociação':
        return 'bg-purple-100 text-purple-700'
      case 'Ganho':
        return 'bg-green-100 text-green-700'
      case 'Perdido':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Leads</h1>
          <p className="text-muted-foreground">
            Gerencie seus potenciais clientes
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-6 shadow-lg">
              <Plus className="w-4 h-4 mr-2" /> Novo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] glass-card border-white/60">
            <DialogHeader>
              <DialogTitle>Novo Lead</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 mt-4"
              >
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Acme Inc."
                          {...field}
                          className="bg-white/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contato Principal</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome completo"
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
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="(00) 00000-0000"
                            {...field}
                            className="bg-white/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="contato@empresa.com"
                          {...field}
                          className="bg-white/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="segment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segmento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/50">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Tecnologia">
                              Tecnologia
                            </SelectItem>
                            <SelectItem value="Varejo">Varejo</SelectItem>
                            <SelectItem value="Indústria">Indústria</SelectItem>
                            <SelectItem value="Serviços">Serviços</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tamanho</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white/50">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 func.</SelectItem>
                            <SelectItem value="11-50">11-50 func.</SelectItem>
                            <SelectItem value="51-200">51-200 func.</SelectItem>
                            <SelectItem value="201+">201+ func.</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origem do Lead</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/50">
                            <SelectValue placeholder="Selecione a origem" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                          <SelectItem value="Indicação">Indicação</SelectItem>
                          <SelectItem value="Evento">Evento</SelectItem>
                          <SelectItem value="Site">Site</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Salvar Lead
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card rounded-[24px] p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar leads..."
              className="pl-9 bg-white/50 border-gray-200 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] bg-white/50 rounded-xl border-gray-200">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="Novo">Novo</SelectItem>
                <SelectItem value="Qualificado">Qualificado</SelectItem>
                <SelectItem value="Em Negociação">Em Negociação</SelectItem>
                <SelectItem value="Perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSegment} onValueChange={setFilterSegment}>
              <SelectTrigger className="w-[180px] bg-white/50 rounded-xl border-gray-200">
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Segmentos</SelectItem>
                <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                <SelectItem value="Varejo">Varejo</SelectItem>
                <SelectItem value="Indústria">Indústria</SelectItem>
                <SelectItem value="Serviços">Serviços</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-gray-100">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-semibold text-gray-700">
                  Empresa
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Contato
                </TableHead>
                <TableHead className="font-semibold text-gray-700 hidden md:table-cell">
                  E-mail
                </TableHead>
                <TableHead className="font-semibold text-gray-700 hidden sm:table-cell">
                  Segmento
                </TableHead>
                <TableHead className="font-semibold text-gray-700 hidden lg:table-cell">
                  Origem
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-gray-700 hidden xl:table-cell">
                  Data
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum lead encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="hover:bg-white/40 transition-colors border-b border-gray-100/50"
                  >
                    <TableCell className="font-medium text-gray-900">
                      {lead.company}
                    </TableCell>
                    <TableCell>{lead.contact}</TableCell>
                    <TableCell className="text-gray-500 hidden md:table-cell">
                      {lead.email}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant="outline"
                        className="bg-gray-50 font-normal"
                      >
                        {lead.segment}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 hidden lg:table-cell">
                      {lead.source}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'hover:bg-opacity-80 border-0 shadow-none font-medium',
                          getStatusColor(lead.status),
                        )}
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 hidden xl:table-cell">
                      {format(lead.createdAt, 'dd MMM, yyyy', { locale: ptBR })}
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
