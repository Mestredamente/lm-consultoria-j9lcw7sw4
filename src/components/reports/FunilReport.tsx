import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Eye,
  Send,
  FileText,
  CheckCircle,
  XCircle,
  Filter,
  TrendingUp,
  Clock,
  Lightbulb,
} from 'lucide-react'
import { subDays, differenceInDays, parseISO } from 'date-fns'

export function FunilReport() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('90d')
  const [usuarioId, setUsuarioId] = useState('todos')
  const [empresaId, setEmpresaId] = useState('todas')

  const [usuarios, setUsuarios] = useState<any[]>([])
  const [empresas, setEmpresas] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('usuarios')
      .select('id, nome')
      .then(({ data }) => setUsuarios(data || []))
    supabase
      .from('empresas')
      .select('id, nome')
      .then(({ data }) => setEmpresas(data || []))
  }, [])

  useEffect(() => {
    fetchData()
  }, [periodo, usuarioId, empresaId])

  const fetchData = async () => {
    setLoading(true)
    let query = supabase.from('propostas').select(`
        id, status, valor_total, created_at, responsavel_id, empresa_id,
        historico_propostas(acao, data_acao)
      `)

    if (periodo === '30d')
      query = query.gte('created_at', subDays(new Date(), 30).toISOString())
    if (periodo === '90d')
      query = query.gte('created_at', subDays(new Date(), 90).toISOString())
    if (periodo === 'ano')
      query = query.gte('created_at', subDays(new Date(), 365).toISOString())

    if (usuarioId !== 'todos') query = query.eq('responsavel_id', usuarioId)
    if (empresaId !== 'todas') query = query.eq('empresa_id', empresaId)

    const { data: props } = await query
    setData(props || [])
    setLoading(false)
  }

  const funnelData = useMemo(() => {
    const counts = {
      Rascunho: 0,
      Enviada: 0,
      Visualizada: 0,
      Aceita: 0,
      Rejeitada: 0,
    }
    const values = {
      Rascunho: 0,
      Enviada: 0,
      Visualizada: 0,
      Aceita: 0,
      Rejeitada: 0,
    }

    let totalEnviadasParaCalculo = 0
    let totalVisualizadasParaCalculo = 0
    let totalAceitas = 0
    let sumDaysToAccept = 0
    let acceptedCount = 0

    data.forEach((p) => {
      const s = p.status as keyof typeof counts
      if (counts[s] !== undefined) {
        counts[s]++
        values[s] += p.valor_total || 0
      }

      // Tracking for insights
      const hasBeenSent = [
        'Enviada',
        'Visualizada',
        'Aceita',
        'Rejeitada',
      ].includes(p.status)
      const hasBeenViewed = ['Visualizada', 'Aceita', 'Rejeitada'].includes(
        p.status,
      )

      if (hasBeenSent) totalEnviadasParaCalculo++
      if (hasBeenViewed) totalVisualizadasParaCalculo++

      if (p.status === 'Aceita') {
        totalAceitas++
        const created =
          p.historico_propostas?.find((h: any) => h.acao === 'Criada')
            ?.data_acao || p.created_at
        const accepted = p.historico_propostas?.find(
          (h: any) => h.acao === 'Aceita',
        )?.data_acao
        if (created && accepted) {
          sumDaysToAccept += differenceInDays(
            parseISO(accepted),
            parseISO(created),
          )
          acceptedCount++
        }
      }
    })

    const total = data.length

    const viewRate =
      totalEnviadasParaCalculo > 0
        ? (totalVisualizadasParaCalculo / totalEnviadasParaCalculo) * 100
        : 0
    const acceptRate =
      totalEnviadasParaCalculo > 0
        ? (totalAceitas / totalEnviadasParaCalculo) * 100
        : 0
    const avgDaysToAccept =
      acceptedCount > 0 ? sumDaysToAccept / acceptedCount : 0

    const funnelSteps = [
      {
        name: 'Criadas (Total)',
        count: total,
        value: data.reduce((a, b) => a + (b.valor_total || 0), 0),
        color: '#94a3b8',
        icon: FileText,
      },
      {
        name: 'Enviadas',
        count: totalEnviadasParaCalculo,
        value:
          values.Enviada +
          values.Visualizada +
          values.Aceita +
          values.Rejeitada,
        color: '#3b82f6',
        icon: Send,
      },
      {
        name: 'Visualizadas',
        count: totalVisualizadasParaCalculo,
        value: values.Visualizada + values.Aceita + values.Rejeitada,
        color: '#a855f7',
        icon: Eye,
      },
      {
        name: 'Aceitas',
        count: totalAceitas,
        value: values.Aceita,
        color: '#22c55e',
        icon: CheckCircle,
      },
    ]

    return {
      funnelSteps,
      currentStatus: [
        {
          name: 'Rascunho',
          count: counts.Rascunho,
          value: values.Rascunho,
          color: '#94a3b8',
        },
        {
          name: 'Enviada',
          count: counts.Enviada,
          value: values.Enviada,
          color: '#3b82f6',
        },
        {
          name: 'Visualizada',
          count: counts.Visualizada,
          value: values.Visualizada,
          color: '#a855f7',
        },
        {
          name: 'Aceita',
          count: counts.Aceita,
          value: values.Aceita,
          color: '#22c55e',
        },
        {
          name: 'Rejeitada',
          count: counts.Rejeitada,
          value: values.Rejeitada,
          color: '#ef4444',
        },
      ],
      total,
      insights: {
        viewRate,
        acceptRate,
        avgDaysToAccept,
        rejeitadas: counts.Rejeitada,
        valorRejeitado: values.Rejeitada,
      },
    }
  }, [data])

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v)
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full">
          <div className="bg-gray-100 p-2 rounded-lg shrink-0">
            <Filter className="w-4 h-4 text-gray-600" />
          </div>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="ano">Último ano</SelectItem>
              <SelectItem value="todos">Todo o período</SelectItem>
            </SelectContent>
          </Select>

          <Select value={usuarioId} onValueChange={setUsuarioId}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Responsáveis</SelectItem>
              {usuarios.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome || 'Sem Nome'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Empresas</SelectItem>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-blue-800">
              Taxa de Visualização
            </CardTitle>
            <Eye className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {funnelData.insights.viewRate.toFixed(1)}%
            </div>
            <p className="text-xs text-blue-600 mt-1">das propostas enviadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-green-800">
              Taxa de Aceitação
            </CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {funnelData.insights.acceptRate.toFixed(1)}%
            </div>
            <p className="text-xs text-green-600 mt-1">
              das propostas enviadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-amber-800">
              Tempo Médio de Fechamento
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">
              {funnelData.insights.avgDaysToAccept > 0
                ? `${Math.round(funnelData.insights.avgDaysToAccept)} dias`
                : '-'}
            </div>
            <p className="text-xs text-amber-600 mt-1">
              da criação até o aceite
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle>Funil de Conversão Cumulativo</CardTitle>
            <CardDescription>
              Retenção de propostas em cada estágio comercial
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Carregando gráfico...
              </div>
            ) : (
              <ChartContainer config={{}} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={funnelData.funnelSteps}
                    layout="vertical"
                    margin={{ top: 20, right: 50, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                      width={110}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(val: number) => [
                        `${val} propostas`,
                        'Volume',
                      ]}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={36}>
                      {funnelData.funnelSteps.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle>Detalhamento de Status e Insights</CardTitle>
            <CardDescription>
              Onde as propostas se encontram hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-gray-100 mb-6">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Estágio Atual</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-right">Valor em R$</TableHead>
                    <TableHead className="text-right">Mix %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funnelData.currentStatus.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        {row.name}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {row.count}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {fmt(row.value)}
                      </TableCell>
                      <TableCell className="text-right text-gray-500">
                        {funnelData.total
                          ? pct(row.count / funnelData.total)
                          : '0%'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
              <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100 mt-0.5">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Insights Automáticos
                </h4>
                <div className="space-y-2 mt-2 text-sm text-gray-600">
                  <p>
                    • A taxa geral de visualização das suas propostas enviadas é
                    de{' '}
                    <strong>{funnelData.insights.viewRate.toFixed(1)}%</strong>.
                  </p>
                  <p>
                    • A sua taxa de conversão final para negócios ganhos é de{' '}
                    <strong>
                      {funnelData.insights.acceptRate.toFixed(1)}%
                    </strong>
                    .
                  </p>
                  {funnelData.insights.rejeitadas > 0 && (
                    <p className="text-red-600">
                      • Ocorreram{' '}
                      <strong>{funnelData.insights.rejeitadas}</strong> perdas
                      recentes, representando{' '}
                      <strong>{fmt(funnelData.insights.valorRejeitado)}</strong>{' '}
                      a menos no faturamento estimado.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
