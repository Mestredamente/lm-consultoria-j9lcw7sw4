import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  FileText,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash,
  Calendar,
  Send,
  Filter,
} from 'lucide-react'
import { NewProposalModal } from '@/components/proposals/NewProposalModal'
import { subDays, isAfter } from 'date-fns'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export default function Proposals() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [propostas, setPropostas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [periodFilter, setPeriodFilter] = useState('Todos')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProposalId, setEditingProposalId] = useState<string | null>(
    null,
  )

  const [proposalToDelete, setProposalToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)

  useEffect(() => {
    if (user) {
      fetchPropostas()
    }
  }, [user])

  const fetchPropostas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('propostas')
        .select(
          `
          *,
          empresas (nome),
          contatos (nome),
          usuarios (nome)
        `,
        )
        .order('created_at', { ascending: false })

      if (error) throw error
      setPropostas(data || [])
    } catch (error: any) {
      toast.error('Erro ao buscar propostas: ' + error.message)
      setPropostas([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!proposalToDelete) return
    try {
      setIsDeleting(true)
      await supabase
        .from('historico_propostas')
        .delete()
        .eq('proposta_id', proposalToDelete)
      await supabase
        .from('custos_operacionais')
        .delete()
        .eq('proposta_id', proposalToDelete)
      await supabase
        .from('itens_proposta')
        .delete()
        .eq('proposta_id', proposalToDelete)
      const { error } = await supabase
        .from('propostas')
        .delete()
        .eq('id', proposalToDelete)
      if (error) throw error

      toast.success('Proposta deletada com sucesso!')
      fetchPropostas()
    } catch (error: any) {
      toast.error('Erro ao deletar proposta: ' + error.message)
    } finally {
      setIsDeleting(false)
      setProposalToDelete(null)
    }
  }

  const openEditModal = (id: string) => {
    setEditingProposalId(id)
    setIsModalOpen(true)
  }

  const handleDuplicar = async (propostaId: string) => {
    try {
      setIsDuplicating(true)
      const { data: prop, error: propErr } = await supabase
        .from('propostas')
        .select('*')
        .eq('id', propostaId)
        .single()
      if (propErr) throw propErr

      const { data: items } = await supabase
        .from('itens_proposta')
        .select('*')
        .eq('proposta_id', propostaId)
      const { data: costs } = await supabase
        .from('custos_operacionais')
        .select('*')
        .eq('proposta_id', propostaId)

      const { data: newProp, error: newPropErr } = await supabase
        .from('propostas')
        .insert({
          empresa_id: prop.empresa_id,
          contato_id: prop.contato_id,
          oportunidade_id: prop.oportunidade_id,
          responsavel_id: user?.id,
          status: 'Rascunho',
          valor_total: prop.valor_total,
          notas_internas: prop.notas_internas,
          condicoes_pagamento: prop.condicoes_pagamento,
        })
        .select()
        .single()

      if (newPropErr) throw newPropErr

      if (items && items.length > 0) {
        const newItems = items.map((i) => ({
          proposta_id: newProp.id,
          tipo_servico: i.tipo_servico,
          descricao: i.descricao,
          quantidade: i.quantidade,
          valor_unitario: i.valor_unitario,
          subtotal: i.subtotal,
        }))
        await supabase.from('itens_proposta').insert(newItems)
      }

      if (costs && costs.length > 0) {
        const newCosts = costs.map((c) => ({
          proposta_id: newProp.id,
          tipo: c.tipo,
          descricao: c.descricao,
          valor: c.valor,
        }))
        await supabase.from('custos_operacionais').insert(newCosts)
      }

      await supabase.from('historico_propostas').insert({
        proposta_id: newProp.id,
        acao: `Duplicada da proposta ${prop.numero_proposta || 'original'}`,
        usuario_id: user?.id,
      })

      toast.success('Proposta duplicada com sucesso!')
      navigate(`/proposals/${newProp.id}`)
    } catch (err: any) {
      toast.error('Erro ao duplicar proposta: ' + err.message)
    } finally {
      setIsDuplicating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Rascunho':
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
          >
            Rascunho
          </Badge>
        )
      case 'Enviada':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">
            Enviada
          </Badge>
        )
      case 'Visualizada':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">
            Visualizada
          </Badge>
        )
      case 'Aceita':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
            Aceita
          </Badge>
        )
      case 'Rejeitada':
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
          >
            Rejeitada
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredPropostas = useMemo(() => {
    return propostas.filter((p) => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        p.numero_proposta?.toLowerCase().includes(searchLower) ||
        p.empresas?.nome?.toLowerCase().includes(searchLower)

      const matchesStatus =
        statusFilter === 'Todos' || p.status === statusFilter

      let matchesPeriod = true
      if (periodFilter !== 'Todos' && p.data_emissao) {
        const date = new Date(p.data_emissao)
        const now = new Date()
        if (periodFilter === '7d')
          matchesPeriod = isAfter(date, subDays(now, 7))
        else if (periodFilter === '30d')
          matchesPeriod = isAfter(date, subDays(now, 30))
        else if (periodFilter === '90d')
          matchesPeriod = isAfter(date, subDays(now, 90))
      }

      return matchesSearch && matchesStatus && matchesPeriod
    })
  }, [propostas, searchTerm, statusFilter, periodFilter])

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Propostas e Orçamentos
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie e crie novas propostas comerciais para seus clientes.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProposalId(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Nova Proposta
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por número ou nome da empresa..."
                className="pl-9 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os Status</SelectItem>
                  <SelectItem value="Rascunho">Rascunho</SelectItem>
                  <SelectItem value="Enviada">Enviada</SelectItem>
                  <SelectItem value="Visualizada">Visualizada</SelectItem>
                  <SelectItem value="Aceita">Aceita</SelectItem>
                  <SelectItem value="Rejeitada">Rejeitada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Período" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Qualquer data</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-semibold text-gray-600">
                  Número
                </TableHead>
                <TableHead className="font-semibold text-gray-600">
                  Empresa / Contato
                </TableHead>
                <TableHead className="font-semibold text-gray-600">
                  Data de Emissão
                </TableHead>
                <TableHead className="font-semibold text-gray-600">
                  Valor Total
                </TableHead>
                <TableHead className="font-semibold text-gray-600">
                  Status
                </TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p>Carregando propostas...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPropostas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <FileText className="h-12 w-12 text-gray-300" />
                      <p>Nenhuma proposta encontrada.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setEditingProposalId(null)
                          setIsModalOpen(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Criar Nova Proposta
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPropostas.map((proposta) => (
                  <TableRow key={proposta.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium text-gray-900">
                      {proposta.numero_proposta || 'S/N'}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        {proposta.empresas?.nome || '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {proposta.contatos?.nome || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {proposta.data_emissao ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {new Date(proposta.data_emissao).toLocaleDateString(
                            'pt-BR',
                            { timeZone: 'UTC' },
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(proposta.valor_total || 0)}
                    </TableCell>
                    <TableCell>{getStatusBadge(proposta.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-gray-200"
                          >
                            <span className="sr-only">Abrir menu</span>
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              navigate(`/proposals/${proposta.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" /> Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => openEditModal(proposta.id)}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Editar Proposta
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleDuplicar(proposta.id)}
                            disabled={isDuplicating}
                          >
                            <FileText className="mr-2 h-4 w-4" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-blue-600 focus:text-blue-600 focus:bg-blue-50">
                            <Send className="mr-2 h-4 w-4" /> Enviar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => setProposalToDelete(proposta.id)}
                          >
                            <Trash className="mr-2 h-4 w-4" /> Excluir
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
      </div>

      <NewProposalModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) setEditingProposalId(null)
        }}
        onSuccess={fetchPropostas}
        proposalId={editingProposalId}
      />

      <AlertDialog
        open={!!proposalToDelete}
        onOpenChange={(open) => !open && setProposalToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta proposta? Esta ação não pode
              ser desfeita e removerá todos os itens e custos associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
