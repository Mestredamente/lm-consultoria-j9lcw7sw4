import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  subDays,
  isAfter,
  isBefore,
  startOfDay,
  parseISO,
  format,
} from 'date-fns'
import {
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Activity,
  Eye,
  BarChart3,
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
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
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

const STATUS_COLORS = {
  Rascunho: '#94a3b8',
  Enviada: '#3b82f6',
  Visualizada: '#eab308',
  Aceita: '#22c55e',
  Rejeitada: '#ef4444',
}

export default function ProposalsDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')
  const [responsavelId, setResponsavelId] = useState('all')
  const [empresaId, setEmpresaId] = useState('all')
  const [tipoServico, setTipoServico] = useState('all')

  const [rawProposals, setRawProposals] = useState<any[]>([])
  const [rawItems, setRawItems] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [serviceTypes, setServiceTypes] = useState<string[]>([])

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const oneYearAgo = startOfDay(subDays(new Date(), 365)).toISOString()

      const { data: props, error: propsErr } = await supabase
        .from('propostas')
        .select('*, empresas(id, nome), contatos(nome), usuarios(id, nome)')
        .gte('created_at', oneYearAgo)

      if (propsErr) throw propsErr

      const { data: items, error: itemsErr } = await supabase
        .from('itens_proposta')
        .select('*')

      if (itemsErr) throw itemsErr

      setRawProposals(props || [])
      setRawItems(items || [])

      const uniqueUsers = Array.from(
        new Map(
          (props || [])
            .filter((p) => p.usuarios)
            .map((p: any) => [p.usuarios.id, p.usuarios]),
        ).values(),
      )
      const uniqueCompanies = Array.from(
        new Map(
          (props || [])
            .filter((p) => p.empresas)
            .map((p: any) => [p.empresas.id, p.empresas]),
        ).values(),
      )
      const uniqueServices = Array.from(
        new Set((items || []).map((i) => i.tipo_servico).filter(Boolean)),
      )

      setUsers(uniqueUsers)
      setCompanies(uniqueCompanies)
      setServiceTypes(uniqueServices as string[])
    } catch (err: any) {
      toast.error('Erro ao carregar dados do dashboard: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const { currentData, previousData, filteredItems } = useMemo(() => {
    const now = new Date()
    let days = 30
    if (period === '7d') days = 7
    if (period === '90d') days = 90
    if (period === '365d') days = 365

    const currentStart = startOfDay(subDays(now, days))
    const previousStart = startOfDay(subDays(now, days * 2))

    let filtered = rawProposals
    if (responsavelId !== 'all') {
      filtered = filtered.filter((p) => p.responsavel_id === responsavelId)
    }
    if (empresaId !== 'all') {
      filtered = filtered.filter((p) => p.empresa_id === empresaId)
    }
    if (tipoServico !== 'all') {
      const propIdsWithService = new Set(
        rawItems
          .filter((i) => i.tipo_servico === tipoServico)
          .map((i) => i.proposta_id),
      )
      filtered = filtered.filter((p) => propIdsWithService.has(p.id))
    }

    const current = filtered.filter((p) => {
      const d = parseISO(p.data_emissao)
      return isAfter(d, currentStart) || d.getTime() === currentStart.getTime()
    })

    const previous = filtered.filter((p) => {
      const d = parseISO(p.data_emissao)
      return isAfter(d, previousStart) && isBefore(d, currentStart)
    })

    const currentPropIds = new Set(current.map((p) => p.id))
    const currentItems = rawItems.filter((i) =>
      currentPropIds.has(i.proposta_id),
    )

    return {
      currentData: current,
      previousData: previous,
      filteredItems: currentItems,
    }
  }, [rawProposals, rawItems, period, responsavelId, empresaId, tipoServico])

  const kpis = useMemo(() => {
    const calc = (data: any[]) => {
      const total = data.length
      const valorTotal = data.reduce(
        (acc, p) => acc + (Number(p.valor_total) || 0),
        0,
      )
      const aceitas = data.filter((p) => p.status === 'Aceita').length
      const pendentes = data.filter(
        (p) => p.status === 'Enviada' || p.status === 'Visualizada',
      ).length
      const taxaAceitacao = total > 0 ? (aceitas / total) * 100 : 0
      const valorMedio = total > 0 ? valorTotal / total : 0

      const vencidas = data.filter((p) => {
        if (
          !p.data_validade ||
          p.status === 'Aceita' ||
          p.status === 'Rejeitada'
        )
          return false
        return isBefore(parseISO(p.data_validade), startOfDay(new Date()))
      }).length

      return {
        total,
        valorTotal,
        taxaAceitacao,
        valorMedio,
        pendentes,
        vencidas,
      }
    }

    const curr = calc(currentData)
    const prev = calc(previousData)

    const getVar = (c: number, p: number) => {
      if (p === 0) return c > 0 ? 100 : 0
      return ((c - p) / p) * 100
    }

    return {
      current: curr,
      variations: {
        total: getVar(curr.total, prev.total),
        valorTotal: getVar(curr.valorTotal, prev.valorTotal),
        taxaAceitacao: curr.taxaAceitacao - prev.taxaAceitacao,
        valorMedio: getVar(curr.valorMedio, prev.valorMedio),
        pendentes: getVar(curr.pendentes, prev.pendentes),
        vencidas: getVar(curr.vencidas, prev.vencidas),
      },
    }
  }, [currentData, previousData])

  const charts = useMemo(() => {
    const lineMap = new Map()
    currentData.forEach((p) => {
      const date = format(parseISO(p.data_emissao), 'dd/MM')
      if (!lineMap.has(date)) lineMap.set(date, { date, valor: 0, count: 0 })
      const entry = lineMap.get(date)
      entry.valor += Number(p.valor_total) || 0
      entry.count += 1
    })
    const lineData = Array.from(lineMap.values()).sort((a, b) => {
      const [da, ma] = a.date.split('/')
      const [db, mb] = b.date.split('/')
      return (
        new Date(2000, Number(ma) - 1, Number(da)).getTime() -
        new Date(2000, Number(mb) - 1, Number(db)).getTime()
      )
    })

    const statusCount = currentData.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const pieData = Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name as keyof typeof STATUS_COLORS] || '#ccc',
    }))

    const pieConfig = pieData.reduce((acc, curr) => {
      acc[curr.name] = { label: curr.name, color: curr.color }
      return acc
    }, {} as any)

    const serviceValueMap = filteredItems.reduce(
      (acc, item) => {
        if (!item.tipo_servico) return acc
        const val =
          Number(item.subtotal) ||
          Number(item.quantidade) * Number(item.valor_unitario) ||
          0
        acc[item.tipo_servico] = (acc[item.tipo_servico] || 0) + val
        return acc
      },
      {} as Record<string, number>,
    )

    const barData = Object.entries(serviceValueMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    const lineConfig = {
      valor: { label: 'Valor (R$)', color: '#3b82f6' },
      count: { label: 'Quantidade', color: '#8b5cf6' },
    }
    const barConfig = { value: { label: 'Valor Total', color: '#22c55e' } }

    return { lineData, pieData, barData, pieConfig, lineConfig, barConfig }
  }, [currentData, filteredItems])

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v)
  const fmtPercent = (v: number) => v.toFixed(1) + '%'

  const renderVar = (val: number, inverse = false) => {
    const isPositive = val > 0
    const isNegative = val < 0
    const color = inverse
      ? isPositive
        ? 'text-red-600'
        : isNegative
          ? 'text-green-600'
          : 'text-gray-500'
      : isPositive
        ? 'text-green-600'
        : isNegative
          ? 'text-red-600'
          : 'text-gray-500'
    const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Activity

    return (
      <span className={`text-xs flex items-center font-medium ${color}`}>
        {isPositive || isNegative ? <Icon className="w-3 h-3 mr-1" /> : null}
        {val > 0 ? '+' : ''}
        {val.toFixed(1)}%
      </span>
    )
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Dashboard Comercial
          </h1>
          <p className="text-gray-500 mt-1">
            Acompanhe a performance das suas propostas e funil de vendas.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Período
          </label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="365d">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Responsável
          </label>
          <Select value={responsavelId} onValueChange={setResponsavelId}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os responsáveis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              {users.map((u: any) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome || u.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Empresa
          </label>
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as empresas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {companies.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-gray-500 mb-1 block">
            Tipo de Serviço
          </label>
          <Select value={tipoServico} onValueChange={setTipoServico}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os serviços" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os serviços</SelectItem>
              {serviceTypes.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Total de Propostas
              </p>
              <div className="flex items-end gap-3">
                <h3 className="text-2xl font-bold text-gray-900">
                  {kpis.current.total}
                </h3>
                {renderVar(kpis.variations.total)}
              </div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Valor Total
              </p>
              <div className="flex items-end gap-3">
                <h3 className="text-2xl font-bold text-gray-900">
                  {fmtCurrency(kpis.current.valorTotal)}
                </h3>
                {renderVar(kpis.variations.valorTotal)}
              </div>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-full">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Taxa de Aceitação
              </p>
              <div className="flex items-end gap-3">
                <h3 className="text-2xl font-bold text-gray-900">
                  {fmtPercent(kpis.current.taxaAceitacao)}
                </h3>
                {renderVar(kpis.variations.taxaAceitacao)}
              </div>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Ticket Médio
              </p>
              <div className="flex items-end gap-3">
                <h3 className="text-2xl font-bold text-gray-900">
                  {fmtCurrency(kpis.current.valorMedio)}
                </h3>
                {renderVar(kpis.variations.valorMedio)}
              </div>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Propostas Pendentes
              </p>
              <div className="flex items-end gap-3">
                <h3 className="text-2xl font-bold text-gray-900">
                  {kpis.current.pendentes}
                </h3>
                {renderVar(kpis.variations.pendentes)}
              </div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-full">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Propostas Vencidas
              </p>
              <div className="flex items-end gap-3">
                <h3 className="text-2xl font-bold text-gray-900">
                  {kpis.current.vencidas}
                </h3>
                {renderVar(kpis.variations.vencidas, true)}
              </div>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-full">
              <AlertCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Evolução de Propostas Geradas
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {charts.lineData.length > 0 ? (
              <ChartContainer
                config={charts.lineConfig}
                className="w-full h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={charts.lineData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="date"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      yAxisId="left"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      name="Valor (R$)"
                      dataKey="valor"
                      stroke="var(--color-valor)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      name="Quantidade"
                      dataKey="count"
                      stroke="var(--color-count)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Dados insuficientes
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            {charts.pieData.length > 0 ? (
              <ChartContainer
                config={charts.pieConfig}
                className="w-full h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                    >
                      {charts.pieData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Dados insuficientes
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Top 5 Serviços Demandados
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            {charts.barData.length > 0 ? (
              <ChartContainer
                config={charts.barConfig}
                className="w-full h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={charts.barData}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      type="number"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent valueFormatter={fmtCurrency} />
                      }
                    />
                    <Bar
                      dataKey="value"
                      name="Valor Total"
                      fill="var(--color-value)"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Dados insuficientes
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Propostas Recentes</CardTitle>
          <CardDescription>
            Últimas 10 propostas criadas no período filtrado.
          </CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Empresa / Contato</TableHead>
                <TableHead>Emissão</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...currentData]
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
                )
                .slice(0, 10)
                .map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-blue-600 hover:underline">
                      <Link to={`/proposals/${p.id}`}>
                        {p.numero_proposta || 'S/N'}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {p.empresas?.nome || '-'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {p.contatos?.nome || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {p.data_emissao
                        ? format(parseISO(p.data_emissao), 'dd/MM/yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {fmtCurrency(p.valor_total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        style={{
                          backgroundColor:
                            STATUS_COLORS[
                              p.status as keyof typeof STATUS_COLORS
                            ] || '#ccc',
                        }}
                        className="text-white hover:opacity-90"
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/proposals/${p.id}`)}
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {currentData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500"
                  >
                    Nenhuma proposta encontrada com os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
