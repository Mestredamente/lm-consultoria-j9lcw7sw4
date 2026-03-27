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
import { ArrowLeft, Edit, Trash, Mail, FileText, Clock } from 'lucide-react'
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

export default function ProposalDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [proposal, setProposal] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [costs, setCosts] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchDetails = async () => {
    try {
      setLoading(true)
      const [propRes, itemsRes, costsRes, histRes] = await Promise.all([
        supabase
          .from('propostas')
          .select('*, empresas(*), contatos(*), usuarios(*)')
          .eq('id', id)
          .single(),
        supabase.from('itens_proposta').select('*').eq('proposta_id', id),
        supabase.from('custos_operacionais').select('*').eq('proposta_id', id),
        supabase
          .from('historico_propostas')
          .select('*')
          .eq('proposta_id', id)
          .order('data_acao', { ascending: false }),
      ])
      if (propRes.error) throw propRes.error
      setProposal(propRes.data)
      setItems(itemsRes.data || [])
      setCosts(costsRes.data || [])
      setHistory(histRes.data || [])
    } catch (error: any) {
      toast.error('Erro ao carregar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchDetails()
  }, [id])

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
          >
            <Edit className="w-4 h-4 mr-2" /> Editar
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" /> Enviar
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" /> PDF
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
          <TabsTrigger value="notas">Notas Internas</TabsTrigger>
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
            <CardContent className="p-6 space-y-4">
              {history.map((h) => (
                <div key={h.id} className="flex gap-4 items-start">
                  <div className="mt-1 bg-primary/10 p-2 rounded-full">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Proposta {h.acao}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(h.data_acao).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <p className="text-gray-500">Sem histórico.</p>
              )}
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
      </Tabs>

      <NewProposalModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={fetchDetails}
        proposalId={id}
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
