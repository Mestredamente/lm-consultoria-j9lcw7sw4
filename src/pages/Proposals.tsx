import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  Edit,
  Send,
  FileText,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

export default function Proposals() {
  const { user } = useAuth()
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    if (user) fetchProposals()
  }, [user])

  const fetchProposals = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('propostas')
      .select('*, empresas(nome), contatos(nome)')
      .order('created_at', { ascending: false })

    if (data) setProposals(data)
    else if (error) toast.error('Erro ao carregar propostas.')

    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('propostas').delete().eq('id', id)
    if (!error) {
      toast.success('Proposta deletada com sucesso!')
      fetchProposals()
    } else {
      toast.error('Erro ao deletar a proposta.')
    }
  }

  const handleCreateMock = async () => {
    if (!user) return
    const { data: emp } = await supabase
      .from('empresas')
      .select('id')
      .limit(1)
      .single()
    const { data: cnt } = await supabase
      .from('contatos')
      .select('id')
      .limit(1)
      .single()

    const { error } = await supabase.from('propostas').insert({
      responsavel_id: user.id,
      empresa_id: emp?.id || null,
      contato_id: cnt?.id || null,
      status: 'Rascunho',
      valor_total: Math.random() * 10000 + 1000,
      data_emissao: new Date().toISOString().split('T')[0],
    })

    if (!error) {
      toast.success('Proposta gerada e salva com sucesso!')
      fetchProposals()
    } else {
      toast.error('Erro ao criar a proposta.')
    }
  }

  const filtered = useMemo(
    () =>
      proposals.filter((p) => {
        const matchSearch =
          p.numero_proposta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.empresas?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchStatus =
          statusFilter === 'Todos' || p.status === statusFilter
        const matchFrom =
          !dateFrom || new Date(p.data_emissao) >= new Date(dateFrom)
        const matchTo = !dateTo || new Date(p.data_emissao) <= new Date(dateTo)
        return matchSearch && matchStatus && matchFrom && matchTo
      }),
    [proposals, searchTerm, statusFilter, dateFrom, dateTo],
  )

  const getBadge = (s: string) => {
    const colors: Record<string, string> = {
      Rascunho: 'bg-slate-500',
      Enviada: 'bg-blue-500',
      Visualizada: 'bg-yellow-500 text-yellow-950',
      Aceita: 'bg-emerald-500',
      Rejeitada: 'bg-red-500',
    }
    return (
      <Badge className={`${colors[s] || 'bg-slate-500'} border-none`}>
        {s}
      </Badge>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Propostas e Orçamentos
          </h2>
          <p className="text-muted-foreground">
            Gerencie seus orçamentos, acompanhe envios e aprovações.
          </p>
        </div>
        <Button onClick={handleCreateMock}>
          <Plus className="mr-2 h-4 w-4" /> Nova Proposta
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Todas as Propostas</CardTitle>
          <CardDescription>
            Visualize e filtre o histórico completo de propostas comerciais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou empresa..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              <select
                className="flex h-10 w-full md:w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="Todos">Todos os Status</option>
                <option value="Rascunho">Rascunho</option>
                <option value="Enviada">Enviada</option>
                <option value="Visualizada">Visualizada</option>
                <option value="Aceita">Aceita</option>
                <option value="Rejeitada">Rejeitada</option>
              </select>
              <Input
                type="date"
                className="w-full md:w-[140px]"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                title="Data Inicial"
              />
              <Input
                type="date"
                className="w-full md:w-[140px]"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                title="Data Final"
              />
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <FileText className="mx-auto h-8 w-8 mb-3 opacity-20" />
                      Nenhuma proposta encontrada com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {p.numero_proposta}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {p.empresas?.nome || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {p.contatos?.nome || '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(p.data_emissao), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(p.valor_total)}
                      </TableCell>
                      <TableCell>{getBadge(p.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info(
                                  'Funcionalidade de visualização em breve',
                                )
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" /> Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info('Funcionalidade de edição em breve')
                              }
                            >
                              <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info('Funcionalidade de envio em breve')
                              }
                            >
                              <Send className="mr-2 h-4 w-4" /> Enviar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              onClick={() => handleDelete(p.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
