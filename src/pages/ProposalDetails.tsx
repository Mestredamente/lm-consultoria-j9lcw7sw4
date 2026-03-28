import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Edit,
  Trash,
  Mail,
  FileText,
  Clock,
  PlusCircle,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  Activity,
  MailOpen,
  MessageCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  calcularCustosProposal,
  ServiceRow,
  CostItem,
} from '@/components/proposals/proposal-types'
import { NewProposalModal } from '@/components/proposals/NewProposalModal'
import { ResumoFinanceiro } from '@/components/proposals/ResumoFinanceiro'
import { GraficosProposal } from '@/components/proposals/GraficosProposal'
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
import { SendEmailModal } from '@/components/proposals/SendEmailModal'
import { SendWhatsAppModal } from '@/components/proposals/SendWhatsAppModal'
import { ProposalsVersions } from '@/components/proposals/ProposalsVersions'
import { ProposalDocuments } from '@/components/proposals/ProposalDocuments'
import { useAuth } from '@/hooks/use-auth'

export default function ProposalDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [proposal, setProposal] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [costs, setCosts] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEmailOpen, setIsEmailOpen] = useState(false)
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [emailsSent, setEmailsSent] = useState<any[]>([])
  const [emailToResend, setEmailToResend] = useState('')

  const fetchDetails = async () => {
    try {
      setLoading(true)
      const [propRes, itemsRes, costsRes, histRes, emailsRes] =
        await Promise.all([
          supabase
            .from('propostas')
            .select('*, empresas(*), contatos(*), usuarios(*)')
            .eq('id', id)
            .single(),
          supabase.from('itens_proposta').select('*').eq('proposta_id', id),
          supabase
            .from('custos_operacionais')
            .select('*')
            .eq('proposta_id', id),
          supabase
            .from('historico_propostas')
            .select('*')
            .eq('proposta_id', id)
            .order('data_acao', { ascending: false }),
          supabase
            .from('emails_propostas')
            .select('*')
            .eq('proposta_id', id)
            .order('data_envio', { ascending: false }),
        ])
      if (propRes.error) throw propRes.error
      setProposal(propRes.data)
      setItems(itemsRes.data || [])
      setCosts(costsRes.data || [])
      setHistory(histRes.data || [])
      setEmailsSent(emailsRes.data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchDetails()
  }, [id])

  const handleEditClick = async () => {
    if (!id || !user) return
    try {
      // Create snapshot before edit
      await supabase.rpc('snapshot_proposta', {
        p_proposta_id: id,
        p_usuario_id: user.id,
        p_resumo: 'Edição manual',
      })
    } catch (e) {
      console.error('Erro ao criar snapshot:', e)
    }
    setIsEditOpen(true)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await supabase.from('historico_propostas').delete().eq('proposta_id', id)
      await supabase.from('custos_operacionais').delete().eq('proposta_id', id)
      await supabase.from('itens_proposta').delete().eq('proposta_id', id)
      const { error } = await supabase.from('propostas').delete().eq('id', id)
      if (error) throw error
      toast.success('Proposta deletada!')
      navigate('/proposals')
    } catch (error: any) {
      toast.error('Erro ao deletar: ' + error.message)
    } finally {
      setIsDeleting(false)
      setIsDeleteOpen(false)
    }
  }

  const summary = useMemo(() => {
    const s = items.map((i) => ({
      id: i.id,
      tipo: i.tipo_servico,
      descricao: i.descricao,
      quantidade: i.quantidade,
      valor_unitario: i.valor_unitario,
      checked: true,
    })) as ServiceRow[]
    const c = costs.map((c) => {
      try {
        if (c.descricao?.startsWith('{'))
          return { ...JSON.parse(c.descricao), id: c.id }
      } catch (e) {
        // ignore error
      }
      return { id: c.id, type: c.tipo, descricao: c.descricao }
    }) as CostItem[]
    return calcularCustosProposal(s, c)
  }, [items, costs])

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v || 0)
  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'
  const mc = (m: number) =>
    m > 35 ? 'text-green-600' : m >= 20 ? 'text-yellow-600' : 'text-red-600'

  const trackingStats = useMemo(() => {
    const views = history.filter((h) => h.acao === 'Visualizada')
    const emailsCount = emailsSent.length
    const openRate =
      emailsCount > 0
        ? Math.min(100, Math.round((views.length / emailsCount) * 100))
        : 0
    const lastView = views.length > 0 ? views[0].data_acao : null

    const sendsAsc = history
      .filter((h) => h.acao === 'Enviada')
      .sort(
        (a, b) =>
          new Date(a.data_acao).getTime() - new Date(b.data_acao).getTime(),
      )
    const viewsAsc = [...views].sort(
      (a, b) =>
        new Date(a.data_acao).getTime() - new Date(b.data_acao).getTime(),
    )

    let avgTime = null
    if (sendsAsc.length > 0 && viewsAsc.length > 0) {
      const diffMs =
        new Date(viewsAsc[0].data_acao).getTime() -
        new Date(sendsAsc[0].data_acao).getTime()
      if (diffMs > 0) {
        const diffMins = Math.round(diffMs / 60000)
        if (diffMins < 60) avgTime = `${diffMins} min`
        else if (diffMins < 1440) avgTime = `${Math.round(diffMins / 60)} h`
        else avgTime = `${Math.round(diffMins / 1440)} dias`
      }
    }

    let rateColor = 'text-red-600'
    if (openRate >= 50) rateColor = 'text-green-600'
    else if (openRate >= 20) rateColor = 'text-yellow-600'

    return {
      views: views.length,
      lastView,
      emailsCount,
      openRate,
      rateColor,
      avgTime,
    }
  }, [history, emailsSent])

  const handleDeleteEmail = async (emailId: string) => {
    if (!confirm('Deseja realmente remover o registro deste e-mail?')) return
    try {
      const { error } = await supabase
        .from('emails_propostas')
        .delete()
        .eq('id', emailId)
      if (error) throw error
      toast.success('Registro de e-mail removido')
      setEmailsSent(emailsSent.filter((e) => e.id !== emailId))
    } catch (err: any) {
      toast.error('Erro ao deletar registro: ' + err.message)
    }
  }

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true)
    try {
      const { data, error } = await supabase.functions.invoke(
        'gerar-pdf-proposta',
        {
          body: { proposta_id: id },
        },
      )
      if (error) throw error
      if (data?.url) {
        window.open(data.url, '_blank')
        toast.success('PDF gerado com sucesso!')
      }
    } catch (err: any) {
      toast.error('Erro ao gerar PDF: ' + err.message)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const getActionIcon = (acao: string) => {
    if (acao === 'Criada')
      return <PlusCircle className="h-5 w-5 text-blue-500" />
    if (acao === 'Enviada') return <Send className="h-5 w-5 text-primary" />
    if (acao === 'Visualizada')
      return <Eye className="h-5 w-5 text-purple-500" />
    if (acao === 'Aceita')
      return <CheckCircle className="h-5 w-5 text-green-500" />
    if (acao === 'Rejeitada')
      return <XCircle className="h-5 w-5 text-red-500" />
    return <Clock className="h-5 w-5 text-gray-500" />
  }

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  if (!proposal)
    return (
      <div className="p-8 text-center text-red-500">
        Proposta não encontrada.
      </div>
    )

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 fade-in">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Link
          to="/proposals"
          className="hover:text-primary transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Propostas
        </Link>
        <span>/</span>{' '}
        <span className="font-medium text-gray-900">
          {proposal.numero_proposta}
        </span>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            {proposal.numero_proposta || 'Proposta Sem Número'}
            <Badge
              variant={
                proposal.status === 'Rejeitada' ? 'destructive' : 'default'
              }
              className="text-sm"
            >
              {proposal.status}
            </Badge>
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleEditClick}>
            <Edit className="w-4 h-4 mr-2" /> Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEmailToResend(proposal.contatos?.email || '')
              setIsEmailOpen(true)
            }}
          >
            <Mail className="w-4 h-4 mr-2" /> Enviar por Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 border-green-200 hover:bg-green-50"
            onClick={() => setIsWhatsAppOpen(true)}
          >
            <MessageCircle className="w-4 h-4 mr-2" /> Enviar via WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
          >
            <FileText className="w-4 h-4 mr-2" />{' '}
            {isGeneratingPdf ? 'Gerando...' : 'Gerar PDF'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash className="w-4 h-4 mr-2" /> Deletar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Empresa / Contato</p>
            <p className="font-semibold">{proposal.empresas?.nome || '-'}</p>
            <p className="text-sm">{proposal.contatos?.nome || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Emissão / Validade</p>
            <p className="font-semibold">{fmtDate(proposal.data_emissao)}</p>
            <p className="text-sm">
              Válido até: {fmtDate(proposal.data_validade)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Responsável</p>
            <p className="font-semibold">{proposal.usuarios?.nome || '-'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Valor Total</p>
            <p className="font-bold text-xl text-primary">
              {fmt(proposal.valor_total)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="resumo">Resumo Financeiro</TabsTrigger>
          <TabsTrigger value="itens">Itens ({items.length})</TabsTrigger>
          <TabsTrigger value="custos">Custos ({costs.length})</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="versoes">Versões</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="notas">Notas Internas</TabsTrigger>
          <TabsTrigger value="emails">Emails ({emailsSent.length})</TabsTrigger>
          <TabsTrigger value="rastreamento">Rastreamento</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-4 space-y-6">
          <ResumoFinanceiro summary={summary} items={items} costs={costs} />
          <GraficosProposal summary={summary} />
        </TabsContent>

        <TabsContent value="itens" className="mt-4">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Valor Un.</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">
                        {i.tipo_servico}{' '}
                        <div className="text-xs text-gray-500">
                          {i.descricao}
                        </div>
                      </TableCell>
                      <TableCell>{i.quantidade}</TableCell>
                      <TableCell>{fmt(i.valor_unitario)}</TableCell>
                      <TableCell className="font-semibold">
                        {fmt(i.subtotal || i.quantidade * i.valor_unitario)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-6 text-gray-500"
                      >
                        Nenhum serviço adicionado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="custos" className="mt-4">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.tipo}</TableCell>
                      <TableCell className="text-sm text-gray-600 truncate max-w-xs">
                        {c.descricao}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {fmt(c.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {costs.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-6 text-gray-500"
                      >
                        Nenhum custo operacional adicionado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 py-4">
                {history.map((h, i) => (
                  <div key={h.id} className="relative pl-8">
                    <div className="absolute -left-[17px] top-1 bg-white p-1 rounded-full border border-gray-100 shadow-sm">
                      {getActionIcon(h.acao)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Proposta {h.acao}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(h.data_acao).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="text-gray-500 pl-4">
                    Nenhum evento registrado.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versoes" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <ProposalsVersions proposalId={id!} onSuccess={fetchDetails} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <ProposalDocuments proposalId={id!} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notas" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <Textarea
                readOnly
                value={proposal.notas_internas || ''}
                placeholder="Nenhuma nota registrada."
                className="min-h-[200px] resize-none bg-gray-50"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="mt-4">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data de Envio</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailsSent.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(email.data_envio).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>{email.email_destinatario}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            email.status === 'Enviado'
                              ? 'default'
                              : email.status === 'Entregue'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {email.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEmailToResend(email.email_destinatario)
                              setIsEmailOpen(true)
                            }}
                            title="Reenviar E-mail"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteEmail(email.id)}
                            title="Excluir Registro"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {emailsSent.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-6 text-gray-500"
                      >
                        Nenhum e-mail registrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="rastreamento" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Visualizações
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {trackingStats.views}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                  <Eye className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Taxa de Abertura
                  </p>
                  <p
                    className={`text-2xl font-bold ${trackingStats.rateColor}`}
                  >
                    {trackingStats.emailsCount > 0
                      ? `${trackingStats.openRate}%`
                      : '-'}
                  </p>
                </div>
                <div
                  className={`p-3 rounded-full ${trackingStats.openRate >= 50 ? 'bg-green-50 text-green-600' : trackingStats.openRate >= 20 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'}`}
                >
                  <Activity className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Tempo Médio (1ª Visita)
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {trackingStats.avgTime || '-'}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
                  <Clock className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Última Visualização
                  </p>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {trackingStats.lastView
                      ? new Date(trackingStats.lastView).toLocaleString('pt-BR')
                      : 'Aguardando'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 text-gray-600 rounded-full">
                  <MailOpen className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Linha do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 py-4">
                {[...history]
                  .sort(
                    (a, b) =>
                      new Date(a.data_acao).getTime() -
                      new Date(b.data_acao).getTime(),
                  )
                  .map((h) => (
                    <div key={h.id} className="relative pl-8">
                      <div className="absolute -left-[17px] top-1 bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                        {getActionIcon(h.acao)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {h.acao === 'Visualizada'
                            ? 'Proposta Visualizada pelo Cliente'
                            : h.acao === 'Enviada'
                              ? 'Proposta Enviada por Email'
                              : h.acao === 'Criada'
                                ? 'Proposta Criada'
                                : `Proposta ${h.acao}`}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(h.data_acao).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                {history.length === 0 && (
                  <p className="text-gray-500 pl-4">
                    Nenhum evento registrado na linha do tempo.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NewProposalModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={fetchDetails}
        proposalId={id}
      />

      <SendEmailModal
        open={isEmailOpen}
        onOpenChange={setIsEmailOpen}
        proposalId={id!}
        defaultEmail={emailToResend || proposal.contatos?.email}
        onSuccess={fetchDetails}
      />

      <SendWhatsAppModal
        open={isWhatsAppOpen}
        onOpenChange={setIsWhatsAppOpen}
        proposalId={id!}
        defaultPhone={proposal.contatos?.telefone || ''}
        onSuccess={fetchDetails}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita e removerá todos os dados
              relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
