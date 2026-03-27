import { useEffect, useState } from 'react'
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
import { Plus, Search, FileText, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

  useEffect(() => {
    if (user) {
      fetchProposals()
    }
  }, [user])

  const fetchProposals = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('propostas')
      .select(
        `
        *,
        empresas (nome)
      `,
      )
      .order('created_at', { ascending: false })

    if (!error && data) {
      setProposals(data)
    } else if (error) {
      console.error(error)
      toast.error('Erro ao carregar propostas.')
    }
    setLoading(false)
  }

  const handleCreateMock = async () => {
    if (!user) return

    const { data: empresa } = await supabase
      .from('empresas')
      .select('id')
      .limit(1)
      .single()

    const newProposal = {
      responsavel_id: user.id,
      empresa_id: empresa?.id || null,
      status: 'Rascunho',
      valor_total: Math.random() * 10000 + 1000,
      data_emissao: new Date().toISOString().split('T')[0],
      data_validade: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    }

    const { data, error } = await supabase
      .from('propostas')
      .insert(newProposal)
      .select()
      .single()

    if (error) {
      toast.error('Erro ao criar proposta.')
      console.error(error)
    } else if (data) {
      toast.success('Proposta criada com sucesso!')
      fetchProposals()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Rascunho':
        return <Badge variant="secondary">Rascunho</Badge>
      case 'Enviada':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Enviada</Badge>
      case 'Visualizada':
        return (
          <Badge className="bg-purple-500 hover:bg-purple-600">
            Visualizada
          </Badge>
        )
      case 'Aceita':
        return <Badge className="bg-green-500 hover:bg-green-600">Aceita</Badge>
      case 'Rejeitada':
        return <Badge variant="destructive">Rejeitada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filtered = proposals.filter(
    (p) =>
      p.numero_proposta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.empresas?.nome?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Propostas e Orçamentos
          </h2>
          <p className="text-muted-foreground">
            Gerencie seus orçamentos, envie para clientes e acompanhe as
            aprovações.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleCreateMock}>
            <Plus className="mr-2 h-4 w-4" /> Nova Proposta
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Propostas</CardTitle>
          <CardDescription>
            Acompanhe o status e os valores das suas propostas geradas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por número ou cliente..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Validade</TableHead>
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
                      Carregando propostas...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      Nenhuma proposta encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((prop) => (
                    <TableRow key={prop.id}>
                      <TableCell className="font-medium">
                        {prop.numero_proposta}
                      </TableCell>
                      <TableCell>
                        {prop.empresas?.nome || 'Não vinculado'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(prop.data_emissao), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        {prop.data_validade
                          ? format(new Date(prop.data_validade), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(prop.valor_total)}
                      </TableCell>
                      <TableCell>{getStatusBadge(prop.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info('Funcionalidade em desenvolvimento')
                              }
                            >
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info('Funcionalidade em desenvolvimento')
                              }
                            >
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toast.info('Funcionalidade em desenvolvimento')
                              }
                            >
                              Enviar para Cliente
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
