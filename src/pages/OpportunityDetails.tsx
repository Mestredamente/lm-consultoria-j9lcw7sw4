import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useOportunidades } from '@/contexts/OportunidadesContext'
import { useCompanies } from '@/contexts/CompaniesContext'
import { useContacts } from '@/contexts/ContactsContext'
import { useActivities, getActivityColor } from '@/contexts/ActivitiesContext'
import { OportunidadeDialog } from '@/components/oportunidades/OportunidadeDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  Pencil,
  Building2,
  User,
  DollarSign,
  Calendar,
  Activity,
  Clock,
  History,
  Briefcase,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const LINEAR_STAGES = [
  'Prospecção',
  'Qualificação',
  'Proposta',
  'Negociação',
  'Fechamento',
]

export default function OpportunityDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { oportunidades, updateOportunidade } = useOportunidades()
  const { companies } = useCompanies()
  const { contacts } = useContacts()
  const { activities } = useActivities()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [historico, setHistorico] = useState<any[]>([])
  const [loadingHist, setLoadingHist] = useState(false)
  const [nota, setNota] = useState('')
  const [savingNota, setSavingNota] = useState(false)

  const oportunidade = oportunidades.find((o) => o.id === id)
  const relActivities = activities.filter((a) => a.oportunidade_id === id)

  useEffect(() => {
    if (oportunidade) setNota(oportunidade.notas_internas || '')
  }, [oportunidade])

  useEffect(() => {
    if (!id || !user) return
    const fetchHistory = async () => {
      setLoadingHist(true)
      const { data } = await supabase
        .from('historico_oportunidades')
        .select('*')
        .eq('oportunidade_id', id)
        .order('created_at', { ascending: false })
      if (data) setHistorico(data)
      setLoadingHist(false)
    }
    fetchHistory()
  }, [id, user, oportunidade?.estagio])

  const handleSaveNota = async () => {
    if (!id) return
    setSavingNota(true)
    try {
      await updateOportunidade(id, { notas_internas: nota })
      toast.success('Notas salvas com sucesso!')
    } catch (err) {
      toast.error('Erro ao salvar notas.')
    } finally {
      setSavingNota(false)
    }
  }

  if (!oportunidade) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Oportunidade não encontrada
        </h2>
        <Button
          onClick={() => navigate('/leads')}
          className="bg-black text-white"
        >
          Voltar para Pipeline
        </Button>
      </div>
    )
  }

  const empresa = companies.find((c) => c.id === oportunidade.empresa_id)
  const contato = contacts.find((c) => c.id === oportunidade.contato_id)
  const isWon = oportunidade.estagio === 'Ganho'
  const isLost = oportunidade.estagio === 'Perdido'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/leads')}
          className="text-gray-500 hover:text-black"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {oportunidade.nome}
            </h1>
            <Badge
              variant="outline"
              className={cn(
                'font-medium px-3 py-1',
                isWon && 'bg-emerald-50 text-emerald-700',
                isLost && 'bg-red-50 text-red-700',
                !isWon && !isLost && 'bg-blue-50 text-blue-700',
              )}
            >
              {oportunidade.estagio}
            </Badge>
          </div>
        </div>
        <Button
          onClick={() => setIsEditDialogOpen(true)}
          className="bg-black text-white hover:bg-gray-800 rounded-xl px-6 shadow-md"
        >
          <Pencil className="w-4 h-4 mr-2" /> Editar
        </Button>
      </div>

      <div className="glass-card rounded-[24px] p-6 border-white/60 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
          Jornada da Oportunidade
        </h3>
        <div className="relative flex justify-between items-center w-full max-w-4xl mx-auto px-4 sm:px-8 mb-4">
          <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full z-0" />
          {LINEAR_STAGES.map((stage, idx) => {
            const isCompleted =
              isWon ||
              (!isLost && LINEAR_STAGES.indexOf(oportunidade.estagio) >= idx)
            const isCurrent = oportunidade.estagio === stage
            return (
              <div
                key={stage}
                className="relative z-10 flex flex-col items-center"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-[3px] transition-all bg-white',
                    isCompleted
                      ? 'border-emerald-500 text-emerald-600'
                      : isCurrent
                        ? 'border-blue-500 text-blue-600 ring-4 ring-blue-50'
                        : 'border-gray-200 text-gray-300',
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{idx + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'absolute top-12 text-xs font-medium whitespace-nowrap',
                    isCompleted || isCurrent
                      ? 'text-gray-900'
                      : 'text-gray-400',
                  )}
                >
                  {stage}
                </span>
              </div>
            )
          })}
        </div>
        {(isWon || isLost) && (
          <div className="flex justify-center mt-12 mb-2">
            <div
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm border',
                isWon
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-red-50 text-red-700 border-red-100',
              )}
            >
              {isWon ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}{' '}
              Oportunidade {isWon ? 'Ganha' : 'Perdida'}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <Card className="glass-card border-white/60 shadow-sm h-fit">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-semibold text-gray-900 mb-2">Detalhes</h3>
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Empresa</p>
                  <p className="text-sm font-medium text-gray-900">
                    {empresa ? (
                      <Link
                        to={`/companies/${empresa.id}`}
                        className="hover:underline text-blue-600"
                      >
                        {empresa.name}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500">Contato</p>
                  <p className="text-sm font-medium text-gray-900">
                    {contato?.name || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Valor Estimado
                  </p>
                  <p className="text-sm font-bold text-emerald-600">
                    {oportunidade.valor_estimado !== null
                      ? new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(oportunidade.valor_estimado)
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Fechamento Previsto
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {oportunidade.data_fechamento_prevista
                      ? format(
                          parseISO(oportunidade.data_fechamento_prevista),
                          'dd/MM/yyyy',
                        )
                      : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="w-full pr-4">
                  <div className="flex justify-between items-end mb-1">
                    <p className="text-xs font-medium text-gray-500">
                      Probabilidade
                    </p>
                    <span className="text-xs font-bold text-gray-700">
                      {oportunidade.probabilidade_percentual || 0}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${oportunidade.probabilidade_percentual || 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              {oportunidade.descricao && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Descrição
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {oportunidade.descricao}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="glass-card border-white/60 shadow-sm overflow-hidden h-full flex flex-col">
            <Tabs
              defaultValue="history"
              className="w-full flex-1 flex flex-col"
            >
              <div className="px-6 pt-4 border-b border-gray-100/50 bg-white/20">
                <TabsList className="bg-transparent h-auto p-0 gap-6 flex-wrap">
                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none px-0 pb-3 font-medium text-gray-500 data-[state=active]:text-gray-900"
                  >
                    Histórico
                  </TabsTrigger>
                  <TabsTrigger
                    value="activities"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none px-0 pb-3 font-medium text-gray-500 data-[state=active]:text-gray-900 flex items-center gap-2"
                  >
                    Atividades Relacionadas
                    {relActivities.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 text-gray-600 border-0 ml-1"
                      >
                        {relActivities.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none px-0 pb-3 font-medium text-gray-500 data-[state=active]:text-gray-900"
                  >
                    Notas Internas
                  </TabsTrigger>
                </TabsList>
              </div>

              <CardContent className="p-0 flex-1">
                <TabsContent
                  value="history"
                  className="m-0 p-6 h-full min-h-[300px]"
                >
                  {loadingHist ? (
                    <div className="flex justify-center items-center h-40 text-gray-400 animate-pulse">
                      Carregando histórico...
                    </div>
                  ) : historico.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center h-40 text-gray-500">
                      <History className="w-8 h-8 mb-2 text-gray-300" />
                      <p>Nenhum histórico registrado.</p>
                    </div>
                  ) : (
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-200">
                      {historico.map((h) => (
                        <div
                          key={h.id}
                          className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                        >
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-50 text-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-white border border-gray-100 shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-gray-900 text-sm">
                                Mudança de Estágio
                              </span>
                              <time className="text-xs font-medium text-gray-400">
                                {format(
                                  parseISO(h.created_at),
                                  'dd MMM, HH:mm',
                                  { locale: ptBR },
                                )}
                              </time>
                            </div>
                            <div className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                              {h.estagio_anterior ? (
                                <>
                                  <Badge
                                    variant="secondary"
                                    className="font-normal text-gray-600"
                                  >
                                    {h.estagio_anterior}
                                  </Badge>
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                  <Badge className="font-medium bg-blue-50 text-blue-700">
                                    {h.estagio_novo}
                                  </Badge>
                                </>
                              ) : (
                                <span>
                                  Criado no estágio{' '}
                                  <Badge className="font-medium bg-blue-50 text-blue-700">
                                    {h.estagio_novo}
                                  </Badge>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent
                  value="activities"
                  className="m-0 p-6 outline-none h-full flex flex-col min-h-[300px]"
                >
                  {relActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2 shadow-sm">
                        <Briefcase className="w-6 h-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Nenhuma atividade
                      </h3>
                      <p className="text-sm text-gray-500 max-w-sm">
                        Não há atividades agendadas ou concluídas para esta
                        oportunidade.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 overflow-y-auto pr-2">
                      {relActivities.map((act) => (
                        <div
                          key={act.id}
                          className={cn(
                            'p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm',
                            getActivityColor(act.tipo),
                          )}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className="bg-white/50 text-xs border-current opacity-80"
                              >
                                {act.tipo}
                              </Badge>
                              <h4 className="font-bold text-sm leading-tight">
                                {act.titulo}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2 text-xs opacity-70 font-medium">
                              <Calendar className="w-3 h-3" />
                              {act.data_agendada
                                ? format(
                                    parseISO(act.data_agendada),
                                    "dd 'de' MMM, HH:mm",
                                    { locale: ptBR },
                                  )
                                : 'Sem data'}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'whitespace-nowrap self-start sm:self-auto',
                              act.status === 'Concluída'
                                ? 'bg-white/60'
                                : 'bg-white border-transparent',
                            )}
                          >
                            {act.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent
                  value="notes"
                  className="m-0 p-6 h-full flex flex-col min-h-[300px]"
                >
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Registre observações, pontos importantes e detalhes da
                        negociação.
                      </p>
                      <Button
                        onClick={handleSaveNota}
                        disabled={
                          savingNota ||
                          nota === (oportunidade.notas_internas || '')
                        }
                        size="sm"
                        className="bg-black text-white hover:bg-gray-800 rounded-lg px-4"
                      >
                        {savingNota ? 'Salvando...' : 'Salvar Notas'}
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Comece a digitar suas notas aqui..."
                      className="flex-1 min-h-[200px] resize-none bg-gray-50/50 border-gray-200 focus-visible:ring-black/20 p-4 text-sm"
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
      <OportunidadeDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        oportunidadeToEdit={oportunidade}
      />
    </div>
  )
}
