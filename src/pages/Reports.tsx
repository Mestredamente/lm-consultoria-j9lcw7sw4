import React, { useState, useMemo, useEffect } from 'react'
import {
  BarChart3,
  Download,
  Filter,
  TrendingUp,
  CircleDollarSign,
  Target,
  LineChart as LineChartIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useOportunidades } from '@/contexts/OportunidadesContext'
import { useCompanies } from '@/contexts/CompaniesContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import {
  format,
  parseISO,
  isAfter,
  subDays,
  startOfDay,
  startOfWeek,
  startOfMonth,
  addDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Reports() {
  const { oportunidades, loading: loadingOps } = useOportunidades()
  const { companies } = useCompanies()
  const [usuarios, setUsuarios] = useState<
    { id: string; nome: string; email: string }[]
  >([])

  const [periodo, setPeriodo] = useState<string>('all')
  const [empresaId, setEmpresaId] = useState<string>('all')
  const [responsavelId, setResponsavelId] = useState<string>('all')

  useEffect(() => {
    const fetchUsuarios = async () => {
      const { data } = await supabase.from('usuarios').select('id, nome, email')
      if (data) setUsuarios(data)
    }
    fetchUsuarios()
  }, [])

  const getGroupDate = (dateStr: string, periodType: string) => {
    const d = parseISO(dateStr)
    if (periodType === '30') return startOfDay(d).toISOString()
    if (periodType === '90')
      return startOfWeek(d, { weekStartsOn: 1 }).toISOString()
    return startOfMonth(d).toISOString()
  }

  const formatGroupLabel = (isoDate: string, periodType: string) => {
    const d = parseISO(isoDate)
    if (periodType === '30') return format(d, 'dd/MM')
    if (periodType === '90')
      return `${format(d, 'dd/MM')} a ${format(addDays(d, 6), 'dd/MM')}`
    return format(d, 'MMM yyyy', { locale: ptBR })
  }

  const stats = useMemo(() => {
    let filtered = oportunidades

    if (periodo !== 'all') {
      const threshold = subDays(new Date(), parseInt(periodo))
      filtered = filtered.filter((o) =>
        isAfter(parseISO(o.created_at), threshold),
      )
    }
    if (empresaId !== 'all') {
      filtered = filtered.filter((o) => o.empresa_id === empresaId)
    }
    if (responsavelId !== 'all') {
      filtered = filtered.filter((o) => o.responsavel_id === responsavelId)
    }

    const groupedMap: Record<string, any> = {}

    filtered.forEach((o) => {
      const groupDate = getGroupDate(o.created_at, periodo)
      if (!groupedMap[groupDate]) {
        groupedMap[groupDate] = {
          isoDate: groupDate,
          totalCount: 0,
          wonCount: 0,
          wonValue: 0,
        }
      }
      groupedMap[groupDate].totalCount += 1
      if (o.estagio === 'Ganho') {
        groupedMap[groupDate].wonCount += 1
        groupedMap[groupDate].wonValue += o.valor_estimado || 0
      }
    })

    const sortedKeys = Object.keys(groupedMap).sort()

    return sortedKeys.map((k) => {
      const data = groupedMap[k]
      const ticketMedio = data.wonCount > 0 ? data.wonValue / data.wonCount : 0
      const taxaConversao =
        data.totalCount > 0 ? (data.wonCount / data.totalCount) * 100 : 0
      return {
        periodLabel: formatGroupLabel(k, periodo),
        wonValue: data.wonValue,
        wonCount: data.wonCount,
        ticketMedio,
        taxaConversao,
        totalCount: data.totalCount,
      }
    })
  }, [oportunidades, periodo, empresaId, responsavelId])

  const totalWonValue = stats.reduce((acc, row) => acc + row.wonValue, 0)
  const totalWonCount = stats.reduce((acc, row) => acc + row.wonCount, 0)
  const totalTotalCount = stats.reduce((acc, row) => acc + row.totalCount, 0)
  const avgTicket = totalWonCount > 0 ? totalWonValue / totalWonCount : 0
  const avgConversion =
    totalTotalCount > 0 ? (totalWonCount / totalTotalCount) * 100 : 0

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)

  const handleExportCsv = () => {
    const headers = [
      'Período',
      'Valor Total Ganho',
      'Oportunidades Ganhas',
      'Ticket Médio',
      'Taxa Conversão (%)',
    ]
    const rows = stats.map((row) => [
      `"${row.periodLabel}"`,
      row.wonValue.toFixed(2),
      row.wonCount,
      row.ticketMedio.toFixed(2),
      row.taxaConversao.toFixed(2),
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio-vendas-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  const chartConfig = {
    wonValue: {
      label: 'Valor Ganho (R$)',
      color: '#10b981', // emerald-500
    },
  }

  if (loadingOps) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground animate-pulse">
        Carregando relatórios...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg shrink-0 text-white">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Relatórios de Vendas
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Analise a performance do seu pipeline e conversões.
            </p>
          </div>
        </div>
        <Button
          onClick={handleExportCsv}
          variant="outline"
          className="bg-white rounded-xl shadow-sm border-gray-200"
        >
          <Download className="w-4 h-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="glass-card rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 border-white/60">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mr-2 shrink-0">
          <Filter className="w-4 h-4" />
          Filtros:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="bg-white/70 border-gray-200 rounded-xl">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>

          <Select value={responsavelId} onValueChange={setResponsavelId}>
            <SelectTrigger className="bg-white/70 border-gray-200 rounded-xl">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              {usuarios.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger className="bg-white/70 border-gray-200 rounded-xl">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-white/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Valor Ganho
              </p>
              <CircleDollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(totalWonValue)}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Oportunidades
              </p>
              <Target className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {totalWonCount}{' '}
              <span className="text-sm font-normal text-gray-500">ganhas</span>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Ticket Médio
              </p>
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(avgTicket)}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Conversão
              </p>
              <LineChartIcon className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {avgConversion.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="glass-card border-white/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Evolução de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                Nenhum dado encontrado para os filtros selecionados.
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart
                  data={stats}
                  margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="periodLabel"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis
                    tickFormatter={(val) =>
                      `R$ ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`
                    }
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <ChartTooltip
                    cursor={{
                      stroke: '#9ca3af',
                      strokeWidth: 1,
                      strokeDasharray: '3 3',
                    }}
                    content={<ChartTooltipContent />}
                  />
                  <Line
                    type="monotone"
                    dataKey="wonValue"
                    stroke="var(--color-wonValue)"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: 'var(--color-wonValue)',
                      strokeWidth: 2,
                      stroke: '#fff',
                    }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-white/60 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Detalhamento por Período</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700">
                    Período
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">
                    Valor Total Ganho
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">
                    Qtd. Ganhas
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">
                    Ticket Médio
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">
                    Taxa Conversão
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center h-32 text-gray-500"
                    >
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.map((row) => (
                    <TableRow
                      key={row.periodLabel}
                      className="hover:bg-gray-50/50"
                    >
                      <TableCell className="font-medium text-gray-900 capitalize">
                        {row.periodLabel}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {formatCurrency(row.wonValue)}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {row.wonCount}{' '}
                        <span className="text-xs text-gray-400">
                          / {row.totalCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {formatCurrency(row.ticketMedio)}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {row.taxaConversao.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
