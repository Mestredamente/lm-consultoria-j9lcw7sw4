import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
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
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  Filter,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  AlertCircle,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { format, subDays, parseISO, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { ChartContainer } from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { Settings2, GripVertical, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const DEFAULT_LAYOUT = ['kpis', 'evolution', 'status', 'recent', 'services']

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [propostas, setPropostas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [periodo, setPeriodo] = useState('90d')
  const [usuarioId, setUsuarioId] = useState('todos')
  const [empresaId, setEmpresaId] = useState('todas')

  const [usuarios, setUsuarios] = useState<any[]>([])
  const [empresas, setEmpresas] = useState<any[]>([])

  const [isCustomizeMode, setIsCustomizeMode] = useState(false)
  const [layout, setLayout] = useState<string[]>(DEFAULT_LAYOUT)

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
    if (user) {
      fetchData()
      fetchPreferences()
    }
  }, [user, periodo, usuarioId, empresaId])

  const fetchPreferences = async () => {
    if (!user) return
    const { data } = await supabase.from('usuarios').select('preferencias_dashboard').eq('id', user.id).single()
    if (data?.preferencias_dashboard?.layout) {
      setLayout(data.preferencias_dashboard.layout)
    }
  }

  const saveLayout = async (newLayout: string[]) => {
    if (!user) return
    const { data } = await supabase.from('usuarios').select('preferencias_dashboard').eq('id', user.id).single()
    const prefs = data?.preferencias_dashboard || {}
    await supabase.from('usuarios').update({ preferencias_dashboard: { ...prefs, layout: newLayout } }).eq('id', user.id)
    toast.success('Dashboard atualizado com sucesso!')
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('widget_id', id)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('widget_id')
    if (sourceId === targetId) return

    const newLayout = [...layout]
    const sourceIndex = newLayout.indexOf(sourceId)
    const targetIndex = newLayout.indexOf(targetId)

    newLayout.splice(sourceIndex, 1)
    newLayout.splice(targetIndex, 0, sourceId)

    setLayout(newLayout)
    saveLayout(newLayout)
  }

  const fetchData = async () => {
    setLoading(true)
    let query = supabase
      .from('propostas')
      .select(
        '*, empresas(nome), contatos(nome), itens_proposta(tipo_servico, subtotal)',
      )
      .order('created_at', { ascending: false })

    if (periodo === '30d')
      query = query.gte('created_at', subDays(new Date(), 30).toISOString())
    if (periodo === '90d')
      query = query.gte('created_at', subDays(new Date(), 90).toISOString())
    if (periodo === 'ano')
      query = query.gte('created_at', subDays(new Date(), 365).toISOString())

    if (usuarioId !== 'todos') query = query.eq('responsavel_id', usuarioId)
    if (empresaId !== 'todas') query = query.eq('empresa_id', empresaId)

    const { data, error } = await query
    if (!error) {
      setPropostas(data || [])
    }
    setLoading(false)
  }

  // KPIs
  const kpis = useMemo(() => {
    const total = propostas.length
    const valorTotal = propostas.reduce(
      (sum, p) => sum + (p.valor_total || 0),
      0,
    )
    const aceitas = propostas.filter((p) => p.status === 'Aceita')
    const taxaAceitacao = total ? (aceitas.length / total) * 100 : 0
    const valorMedio = total ? valorTotal / total : 0
    const pendentes = propostas.filter((p) =>
      ['Enviada', 'Visualizada'].includes(p.status),
    ).length
    const vencidas = propostas.filter(
      (p) =>
        p.data_validade &&
        isBefore(parseISO(p.data_validade), new Date()) &&
        !['Aceita', 'Rejeitada'].includes(p.status),
    ).length

    return {
      total,
      valorTotal,
      taxaAceitacao,
      valorMedio,
      pendentes,
      vencidas,
    }
  }, [propostas])

  // Charts data
  const evolutionData = useMemo(() => {
    const grouped = propostas.reduce(
      (acc, p) => {
        const date = format(parseISO(p.created_at), 'dd/MM', { locale: ptBR })
        if (!acc[date]) acc[date] = { date, propostas: 0 }
        acc[date].propostas += 1
        return acc
      },
      {} as Record<string, any>,
    )
    return Object.values(grouped).reverse()
  }, [propostas])

  const STATUS_COLORS: Record<string, string> = {
    Rascunho: '#94a3b8',
    Enviada: '#3b82f6',
    Visualizada: '#a855f7',
    Aceita: '#22c55e',
    Rejeitada: '#ef4444',
  }

  const statusData = useMemo(() => {
    const counts = {
      Rascunho: 0,
      Enviada: 0,
      Visualizada: 0,
      Aceita: 0,
      Rejeitada: 0,
    }
    propostas.forEach((p) => {
      if (counts[p.status as keyof typeof counts] !== undefined) {
        counts[p.status as keyof typeof counts]++
      }
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0)
  }, [propostas])

  const serviceData = useMemo(() => {
    const services: Record<string, number> = {}
    propostas.forEach((p) => {
      p.itens_proposta?.forEach((i: any) => {
        const t = i.tipo_servico || 'Outros'
        if (!services[t]) services[t] = 0
        services[t] += i.subtotal || 0
      })
    })
    return Object.entries(services)
      .map(([name, valor]) => ({ name, valor }))
      .sort((a, b) => b.valor - a.valor)
  }, [propostas])

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Rascunho':
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            Rascunho
          </Badge>
        )
      case 'Enviada':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Enviada
          </Badge>
        )
      case 'Visualizada':
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
            Visualizada
          </Badge>
        )
      case 'Aceita':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Aceita
          </Badge>
        )
      case 'Rejeitada':
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-800 hover:bg-red-200"
          >
            Rejeitada
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const renderWidget = (id: string) => {
    const Wrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => (
      <div
        key={id}
        draggable={isCustomizeMode}
        onDragStart={(e) => handleDragStart(e, id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, id)}
        className={cn(
          className,
          isCustomizeMode ? 'cursor-move ring-2 ring-primary/50 ring-dashed rounded-xl relative opacity-90 hover:opacity-100 transition-opacity bg-gray-50/50' : ''
        )}
      >
        {isCustomizeMode && (
          <div className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur p-1.5 rounded-md shadow-sm border border-gray-200">
            <GripVertical className="w-4 h-4 text-gray-500" />
          </div>
        )}
        <div className={cn(isCustomizeMode && 'pointer-events-none')}>
          {children}
        </div>
      </div>
    )

    switch (id) {
      case 'kpis':
        return (
          <Wrapper className="col-span-1 lg:col-span-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Propostas
                      </p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-1">
                        {kpis.total}
                      </h3>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <FileText className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Pipeline
                      </p>
                      <h3 className="text-xl font-bold text-blue-600 mt-1">
                        {fmt(kpis.valorTotal)}
                      </h3>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conversão
                      </p>
                      <h3 className="text-2xl font-bold text-green-600 mt-1">
                        {kpis.taxaAceitacao.toFixed(1)}%
                      </h3>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ticket Médio
                      </p>
                      <h3 className="text-xl font-bold text-gray-900 mt-1">
                        {fmt(kpis.valorMedio)}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-100 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pendentes
                      </p>
                      <h3 className="text-2xl font-bold text-amber-600 mt-1">
                        {kpis.pendentes}
                      </h3>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-lg">
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-100 shadow-sm bg-red-50/30">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-medium text-red-600 uppercase tracking-wider">
                        Vencidas
                      </p>
                      <h3 className="text-2xl font-bold text-red-700 mt-1">
                        {kpis.vencidas}
                      </h3>
                    </div>
                    <div className="bg-red-100 p-2 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Wrapper>
        )
      case 'evolution':
        return (
          <Wrapper className="col-span-1 lg:col-span-2">
            <Card className="shadow-sm border-gray-100 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  Evolução de Criação de Propostas
                </CardTitle>
                <CardDescription>
                  Volume de propostas geradas ao longo do período
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {evolutionData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    Sem dados
                  </div>
                ) : (
                  <ChartContainer config={{}} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={evolutionData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          dy={10}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="propostas"
                          name="Qtd. Propostas"
                          stroke="#0f172a"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: '#0f172a' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </Wrapper>
        )
      case 'status':
        return (
          <Wrapper className="col-span-1 lg:col-span-1">
            <Card className="shadow-sm border-gray-100 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-gray-500" />
                  Distribuição por Status
                </CardTitle>
                <CardDescription>Pipeline atual das propostas</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {statusData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    Sem dados
                  </div>
                ) : (
                  <ChartContainer config={{}} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={STATUS_COLORS[entry.name] || '#cbd5e1'}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number) => [
                            `${value} propostas`,
                            'Volume',
                          ]}
                          contentStyle={{ borderRadius: '8px', border: 'none' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </Wrapper>
        )
      case 'recent':
        return (
          <Wrapper className="col-span-1 lg:col-span-2">
            <Card className="shadow-sm border-gray-100 h-full">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-3 pt-4">
                <CardTitle className="text-base font-semibold">
                  Últimas 10 Propostas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Número</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Emissão</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {propostas.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-6 text-gray-500"
                        >
                          Nenhuma proposta recente.
                        </TableCell>
                      </TableRow>
                    ) : (
                      propostas.slice(0, 10).map((p) => (
                        <TableRow
                          key={p.id}
                          className="cursor-pointer hover:bg-gray-50/80 transition-colors"
                          onClick={() => navigate(`/proposals/${p.id}`)}
                        >
                          <TableCell className="font-medium text-gray-900">
                            {p.numero_proposta || 'S/N'}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-800">
                              {p.empresas?.nome || '-'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {p.contatos?.nome || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            {p.data_emissao
                              ? new Date(p.data_emissao).toLocaleDateString(
                                  'pt-BR',
                                )
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium text-gray-900">
                            {fmt(p.valor_total)}
                          </TableCell>
                          <TableCell>{getStatusBadge(p.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Wrapper>
        )
      case 'services':
        return (
          <Wrapper className="col-span-1 lg:col-span-1">
            <Card className="shadow-sm border-gray-100 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  Volume por Tipo de Serviço
                </CardTitle>
                <CardDescription>Faturamento por categoria</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {serviceData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    Sem dados
                  </div>
                ) : (
                  <ChartContainer config={{}} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={serviceData}
                        layout="vertical"
                        margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={true}
                          vertical={false}
                          stroke="#f1f5f9"
                        />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fill: '#475569',
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                          width={100}
                        />
                        <RechartsTooltip
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                          formatter={(val: number) => [fmt(val), 'Faturamento']}
                        />
                        <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={24}>
                          {serviceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="#0f172a" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </Wrapper>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Dashboard Executivo
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Visão consolidada do fluxo comercial e performance de propostas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button
            variant={isCustomizeMode ? "default" : "outline"}
            onClick={() => setIsCustomizeMode(!isCustomizeMode)}
            className="gap-2"
          >
            <Settings2 className="w-4 h-4" />
            {isCustomizeMode ? "Concluir" : "Customizar Home"}
          </Button>

          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[140px] bg-transparent border-none focus:ring-0 shadow-none">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="w-4 h-4 text-gray-400" />
                <SelectValue placeholder="Período" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="ano">Último ano</SelectItem>
              <SelectItem value="todos">Todo o período</SelectItem>
            </SelectContent>
          </Select>
          <div className="w-px h-6 bg-gray-200" />
          <Select value={usuarioId} onValueChange={setUsuarioId}>
            <SelectTrigger className="w-[160px] bg-transparent border-none focus:ring-0 shadow-none">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Filter className="w-4 h-4 text-gray-400" />
                <SelectValue placeholder="Responsável" />
              </div>
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
          <div className="w-px h-6 bg-gray-200" />
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger className="w-[160px] bg-transparent border-none focus:ring-0 shadow-none">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Filter className="w-4 h-4 text-gray-400" />
                <SelectValue placeholder="Empresa" />
              </div>
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

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {layout.map((widgetId) => renderWidget(widgetId))}
          </div>
        </>
      )}
    </div>
  )
}
