import { useEffect, useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { subDays, format, parseISO } from 'date-fns'

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#6366f1',
  '#14b8a6',
]

export default function Dashboard() {
  const { user } = useAuth()
  const [propostas, setPropostas] = useState<any[]>([])
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [periodFilter, setPeriodFilter] = useState('30d')

  useEffect(() => {
    if (user) fetchDashboardData()
  }, [user, periodFilter])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('propostas')
        .select('*, empresas(nome)')
        .order('data_emissao', { ascending: true })

      const now = new Date()
      if (periodFilter === '7d')
        query = query.gte('data_emissao', subDays(now, 7).toISOString())
      else if (periodFilter === '30d')
        query = query.gte('data_emissao', subDays(now, 30).toISOString())
      else if (periodFilter === '90d')
        query = query.gte('data_emissao', subDays(now, 90).toISOString())

      const { data: propData, error: propErr } = await query
      if (propErr) throw propErr

      const ids = propData?.map((p) => p.id) || []
      let itensData: any[] = []
      if (ids.length > 0) {
        const { data: iData } = await supabase
          .from('itens_proposta')
          .select('tipo_servico, valor_unitario, quantidade, subtotal')
          .in('proposta_id', ids)
        itensData = iData || []
      }

      setPropostas(propData || [])
      setItens(itensData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const total = propostas.length
    const valorTotal = propostas.reduce(
      (acc, p) => acc + (p.valor_total || 0),
      0,
    )
    const aceitas = propostas.filter((p) => p.status === 'Aceita').length
    const pendentes = propostas.filter((p) =>
      ['Rascunho', 'Enviada', 'Visualizada'].includes(p.status),
    ).length
    const tx = total > 0 ? (aceitas / total) * 100 : 0
    const vmed = total > 0 ? valorTotal / total : 0
    return { total, valorTotal, taxaAceitacao: tx, valorMedio: vmed, pendentes }
  }, [propostas])

  const evolucaoData = useMemo(() => {
    const map = new Map()
    propostas.forEach((p) => {
      if (!p.data_emissao) return
      const date = format(parseISO(p.data_emissao), 'dd/MM')
      map.set(date, (map.get(date) || 0) + 1)
    })
    return Array.from(map.entries()).map(([date, count]) => ({
      date,
      propostas: count,
    }))
  }, [propostas])

  const statusData = useMemo(() => {
    const counts = propostas.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, {} as any)
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [propostas])

  const servicesData = useMemo(() => {
    const map = new Map()
    itens.forEach((i) => {
      const type = i.tipo_servico || 'Outros'
      const val = i.subtotal || i.quantidade * i.valor_unitario
      map.set(type, (map.get(type) || 0) + val)
    })
    return Array.from(map.entries())
      .map(([name, valor]) => ({ name, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)
  }, [itens])

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v)

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Dashboard Executivo
          </h1>
          <p className="text-gray-500 mt-1">
            Acompanhe os resultados e performance das suas propostas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[180px] bg-white">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <SelectValue placeholder="Período" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todo o período</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Valor em Propostas
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {fmt(stats.valorTotal)}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">
                Valor médio:{' '}
                <span className="font-semibold text-gray-700">
                  {fmt(stats.valorMedio)}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Taxa de Aceitação
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.taxaAceitacao.toFixed(1)}%
                </h3>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-green-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {stats.taxaAceitacao >= 30 ? (
                <>
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">Saudável</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-red-600 font-medium">Atenção</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Propostas Emitidas
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.total}
                </h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Pendentes de Ação
                </p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.pendentes}
                </h3>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">
              Evolução de Propostas Emitidas
            </CardTitle>
            <CardDescription>
              Volume de propostas ao longo do período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {evolucaoData.length > 0 ? (
              <ChartContainer
                config={{ propostas: { label: 'Propostas', color: '#3b82f6' } }}
                className="w-full h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={evolucaoData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorProp"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f3f4f6"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      fontSize={12}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      fontSize={12}
                      dx={-10}
                      allowDecimals={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="propostas"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorProp)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Dados insuficientes para exibir o gráfico.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">
              Distribuição por Status
            </CardTitle>
            <CardDescription>Visão geral do funil de vendas</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {statusData.length > 0 ? (
              <ChartContainer config={{}} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Dados insuficientes para exibir o gráfico.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">
              Receita por Serviço
            </CardTitle>
            <CardDescription>
              Top 5 serviços com maior volume financeiro em propostas
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {servicesData.length > 0 ? (
              <ChartContainer
                config={{ valor: { label: 'Valor (R$)', color: '#8b5cf6' } }}
                className="w-full h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={servicesData}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#f3f4f6"
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      fontSize={11}
                      width={80}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent valueFormatter={fmt} />}
                    />
                    <Bar
                      dataKey="valor"
                      fill="#8b5cf6"
                      radius={[0, 4, 4, 0]}
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Dados insuficientes para exibir o gráfico.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
