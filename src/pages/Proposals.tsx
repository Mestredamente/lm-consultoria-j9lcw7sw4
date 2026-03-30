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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
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
  Receipt,
  Loader2,
} from 'lucide-react'
import { NewProposalModal } from '@/components/proposals/NewProposalModal'
import { subDays, isAfter } from 'date-fns'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/hooks/use-mobile'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { Card, CardContent } from '@/components/ui/card'

export default function Proposals() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [propostas, setPropostas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [periodFilter, setPeriodFilter] = useState('Todos')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [editingProposalId, setEditingProposalId] = useState<string | null>(
    null,
  )

  const [proposalToDelete, setProposalToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isEmittingNF, setIsEmittingNF] = useState<string | null>(null)

  const isMobile = useIsMobile()
  const [page, setPage] = useState(1)
  const [observerRef, inView] = useIntersectionObserver()

  useEffect(() => {
    if (inView) setPage((p) => p + 1)
  }, [inView])

  useEffect(() => {
    if (user) {
      fetchPropostas()
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('public:propostas')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'propostas' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setPropostas((prev) => prev.filter((p) => p.id !== payload.old.id))
          } else {
            setPropostas((prev) => {
              if (payload.eventType === 'INSERT') {
                if (prev.some((p) => p.id === payload.new.id)) return prev
                return [payload.new as any, ...prev]
              } else {
                return prev.map((p) =>
                  p.id === payload.new.id ? { ...p, ...payload.new } : p,
                )
              }
            })

            setTimeout(() => {
              supabase
                .from('propostas')
                .select('*, empresas (nome), contatos (nome), usuarios (nome)')
                .eq('id', payload.new.id)
                .single()
                .then(({ data, error }) => {
                  if (data && !error) {
                    setPropostas((prev) =>
                      prev.map((p) => (p.id === data.id ? (data as any) : p)),
                    )
                  }
                })
            }, 0)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const fetchPropostas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('propostas')
        .select(`*, empresas (nome), contatos (nome), usuarios (nome)`)
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

  const handleEmitirNF = async (propostaId: string) => {
    try {
      setIsEmittingNF(propostaId)
      const { error } = await supabase.functions.invoke('emitir_nf_proposta', {
        body: { proposta_id: propostaId },
      })
      if (error) throw error
      toast.success('Nota Fiscal emitida com sucesso!')
      fetchPropostas()
    } catch (err: any) {
      toast.error('Erro ao emitir NF: ' + err.message)
    } finally {
      setIsEmittingNF(null)
    }
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
            className="bg-gray-100 text-gray-800 border-gray-200"
          >
            Rascunho
          </Badge>
        )
      case 'Enviada':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Enviada
          </Badge>
        )
      case 'Visualizada':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Visualizada
          </Badge>
        )
      case 'Aceita':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Aceita
          </Badge>
        )
      case 'Rejeitada':
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-800 border-red-200"
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

  const ITEMS_PER_PAGE = isMobile ? 10 : 20
  const displayedPropostas = filteredPropostas.slice(0, page * ITEMS_PER_PAGE)
  const hasMore = displayedPropostas.length < filteredPropostas.length

  const handleClearFilters = () => {
    setStatusFilter('Todos')
    setPeriodFilter('Todos')
    setSearchTerm('')
    setIsFiltersOpen(false)
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 fade-in pb-20">
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 md:h-8 md:w-8 text-black" />
            Propostas
          </h1>
          <p className="text-gray-500 mt-1 text-sm hidden md:block">
            Gerencie e crie novas propostas comerciais para seus clientes.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingProposalId(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 shadow-lg rounded-full bg-black hover:bg-gray-800 text-white h-auto py-2 px-4 md:px-6"
        >
          <Plus className="h-5 w-5 md:h-4 md:w-4" />{' '}
          <span className="hidden md:inline">Nova Proposta</span>
        </Button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-[24px] shadow-sm border border-white/50 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-white/40 space-y-4">
          <div className="flex flex-row gap-2 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Buscar por número ou nome..."
                className="pl-10 h-12 text-base bg-white border-gray-200 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isMobile ? (
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl border-gray-200 shrink-0 bg-white"
                onClick={() => setIsFiltersOpen(true)}
              >
                <Filter className="h-5 w-5 text-gray-600" />
                {(statusFilter !== 'Todos' || periodFilter !== 'Todos') && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Button>
            ) : (
              <div className="flex flex-row gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-white h-12 rounded-xl">
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
                  <SelectTrigger className="w-[180px] bg-white h-12 rounded-xl">
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
            )}
          </div>
        </div>

        {isMobile ? (
          <div className="p-4 space-y-4">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-black mb-4" />
                Carregando propostas...
              </div>
            ) : filteredPropostas.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground bg-white/50 rounded-xl border border-gray-100">
                Nenhuma proposta encontrada.
              </div>
            ) : (
              <>
                {displayedPropostas.map((proposta) => (
                  <Card
                    key={proposta.id}
                    className="overflow-hidden border-gray-100 shadow-sm"
                  >
                    <CardContent className="p-4 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-lg text-gray-900">
                            {proposta.numero_proposta || 'S/N'}
                          </span>
                          {getStatusBadge(proposta.status)}
                        </div>
                        <div className="space-y-1 mb-3">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {proposta.empresas?.nome || '-'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {proposta.contatos?.nome || '-'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <p className="font-bold text-gray-900">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(proposta.valor_total || 0)}
                          </p>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {proposta.data_emissao
                              ? new Date(
                                  proposta.data_emissao,
                                ).toLocaleDateString('pt-BR')
                              : '-'}
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem
                            className="py-3 text-base"
                            onClick={() =>
                              navigate(`/proposals/${proposta.id}`)
                            }
                          >
                            <Eye className="mr-3 h-5 w-5" /> Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="py-3 text-base"
                            onClick={() => openEditModal(proposta.id)}
                          >
                            <Edit className="mr-3 h-5 w-5 text-blue-600" />{' '}
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="py-3 text-base"
                            onClick={() => handleDuplicar(proposta.id)}
                            disabled={isDuplicating}
                          >
                            <FileText className="mr-3 h-5 w-5" /> Duplicar
                          </DropdownMenuItem>
                          {proposta.status === 'Aceita' &&
                            proposta.status_nf !== 'Emitida' && (
                              <DropdownMenuItem
                                className="py-3 text-base"
                                onClick={() => handleEmitirNF(proposta.id)}
                                disabled={isEmittingNF === proposta.id}
                              >
                                <Receipt className="mr-3 h-5 w-5 text-green-600" />{' '}
                                Emitir NF
                              </DropdownMenuItem>
                            )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="py-3 text-base text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => setProposalToDelete(proposta.id)}
                          >
                            <Trash className="mr-3 h-5 w-5" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
                {hasMore && (
                  <div
                    ref={observerRef}
                    className="h-10 w-full flex items-center justify-center"
                  >
                    <Loader2 className="w-5 h-5 text-black animate-spin" />
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white">
            <Table>
              <TableHeader className="bg-gray-50/50">
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
                  <TableHead className="font-semibold text-gray-600">
                    NF
                  </TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        <p>Carregando propostas...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPropostas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <FileText className="h-12 w-12 text-gray-300" />
                        <p>Nenhuma proposta encontrada.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {displayedPropostas.map((proposta) => (
                      <TableRow
                        key={proposta.id}
                        className="hover:bg-gray-50/50 border-b border-gray-100/50"
                      >
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
                              {new Date(
                                proposta.data_emissao,
                              ).toLocaleDateString('pt-BR', {
                                timeZone: 'UTC',
                              })}
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
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              proposta.status_nf === 'Emitida'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-gray-50 text-gray-600 border-gray-200'
                            }
                          >
                            {proposta.status_nf || 'Pendente'}
                          </Badge>
                        </TableCell>
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
                                <Edit className="mr-2 h-4 w-4 text-blue-600" />{' '}
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => handleDuplicar(proposta.id)}
                                disabled={isDuplicating}
                              >
                                <FileText className="mr-2 h-4 w-4" /> Duplicar
                              </DropdownMenuItem>
                              {proposta.status === 'Aceita' &&
                                proposta.status_nf !== 'Emitida' && (
                                  <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => handleEmitirNF(proposta.id)}
                                    disabled={isEmittingNF === proposta.id}
                                  >
                                    <Receipt className="mr-2 h-4 w-4 text-green-600" />{' '}
                                    Emitir NF
                                  </DropdownMenuItem>
                                )}
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
                    ))}
                    {hasMore && (
                      <TableRow ref={observerRef}>
                        <TableCell
                          colSpan={7}
                          className="h-16 text-center text-muted-foreground"
                        >
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-black" />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Drawer open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <DrawerContent className="px-4 pb-8 max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Filtros</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-6 mt-4 overflow-y-auto px-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos" className="py-3">
                    Todos os Status
                  </SelectItem>
                  <SelectItem value="Rascunho" className="py-3">
                    Rascunho
                  </SelectItem>
                  <SelectItem value="Enviada" className="py-3">
                    Enviada
                  </SelectItem>
                  <SelectItem value="Visualizada" className="py-3">
                    Visualizada
                  </SelectItem>
                  <SelectItem value="Aceita" className="py-3">
                    Aceita
                  </SelectItem>
                  <SelectItem value="Rejeitada" className="py-3">
                    Rejeitada
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos" className="py-3">
                    Qualquer data
                  </SelectItem>
                  <SelectItem value="7d" className="py-3">
                    Últimos 7 dias
                  </SelectItem>
                  <SelectItem value="30d" className="py-3">
                    Últimos 30 dias
                  </SelectItem>
                  <SelectItem value="90d" className="py-3">
                    Últimos 90 dias
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DrawerFooter className="flex-row gap-3 pt-6 border-t mt-6">
            <DrawerClose asChild>
              <Button
                variant="outline"
                className="flex-1 h-12 text-base"
                onClick={handleClearFilters}
              >
                Limpar
              </Button>
            </DrawerClose>
            <DrawerClose asChild>
              <Button className="flex-1 h-12 text-base bg-black hover:bg-gray-800 text-white">
                Aplicar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

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
        <AlertDialogContent className="w-[90vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta proposta? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="flex-1 mt-0 h-12 md:h-10"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 h-12 md:h-10"
            >
              {isDeleting ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
