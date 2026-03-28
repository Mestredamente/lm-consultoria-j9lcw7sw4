import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Button } from '@/components/ui/button'
import {
  Download,
  Filter,
  TrendingUp,
  CheckCircle,
  FileText,
  Target,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, subDays, parseISO, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChartContainer } from '@/components/ui/chart'

export function PropostasReport() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('90d')
  const [usuarioId, setUsuarioId] = useState('todos')
  const [empresaId, setEmpresaId] = useState('todas')
  const [tipoServico, setTipoServico] = useState('todos')

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
    let query = supabase
      .from('propostas')
      .select(
        '*, empresas(nome), usuarios(nome), itens_proposta(tipo_servico), custos_operacionais(valor)',
      )
      .order('created_at', { ascending: true })

    if (periodo === '30d')
      query = query.gte('created_at', subDays(new Date(), 30).toISOString())
    if (periodo === '90d')
      query = query.gte('created_at', subDays(new Date(), 90).toISOString())
    if (periodo === 'ano')
      query = query.gte('created_at', subDays(new Date(), 365).toISOString())

    if (usuarioId !== 'todos') query = query.eq('responsavel_id', usuarioId)
    if (empresaId !== 'todas') query = query.eq('empresa_id', empresaId)

    const { data: props } = await query

    let filtered = props || []
    if (tipoServico !== 'todos') {
      filtered = filtered.filter((p) =>
        p.itens_proposta?.some((i: any) => i.tipo_servico === tipoServico),
      )
    }

    setData(filtered)
    setLoading(false)
  }

  const kpis = useMemo(() => {
    const total = data.length
    const valor_total = data.reduce((acc, p) => acc + (p.valor_total || 0), 0)
    const aceitas = data.filter((p) => p.status === 'Aceita')
    const valor_aceito = aceitas.reduce(
      (acc, p) => acc + (p.valor_total || 0),
      0,
    )
    const taxa = total > 0 ? (aceitas.length / total) * 100 : 0
    const media = total > 0 ? valor_total / total : 0

    return {
      total,
      valor_total,
      aceitas: aceitas.length,
      valor_aceito,
      taxa,
      media,
    }
  }, [data])

  const chartData = useMemo(() => {
    const grouped = data.reduce(
      (acc, p) => {
        const date = format(parseISO(p.created_at), 'dd/MM', { locale: ptBR })
        if (!acc[date]) acc[date] = { date, Propostas: 0, Valor: 0 }
        acc[date].Propostas += 1
        acc[date].Valor += p.valor_total || 0
        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(grouped)
  }, [data])

  const tableData = useMemo(() => {
    const grouped = data.reduce(
      (acc, p) => {
        const month = format(startOfMonth(parseISO(p.created_at)), 'MMM yyyy', {
          locale: ptBR,
        })
        if (!acc[month]) {
          acc[month] = {
            periodo: month,
            total: 0,
            valorTotal: 0,
            aceitas: 0,
            valorAceito: 0,
            custosTotais: 0,
          }
        }
        acc[month].total += 1
        acc[month].valorTotal += p.valor_total || 0
        if (p.status === 'Aceita') {
          acc[month].aceitas += 1
          acc[month].valorAceito += p.valor_total || 0
        }
        const custos =
          p.custos_operacionais?.reduce(
            (sum: number, c: any) => sum + (c.valor || 0),
            0,
          ) || 0
        acc[month].custosTotais += custos

        return acc
      },
      {} as Record<string, any>,
    )

    return Object.values(grouped).map((g: any) => {
      const margem =
        g.valorTotal > 0
          ? ((g.valorTotal - g.custosTotais) / g.valorTotal) * 100
          : 0
      return {
        ...g,
        taxaAceitacao: g.total > 0 ? (g.aceitas / g.total) * 100 : 0,
        valorMedio: g.total > 0 ? g.valorTotal / g.total : 0,
        margemMedia: margem,
      }
    })
  }, [data])

  const exportCSV = () => {
    const headers = [
      'Período',
      'Nº Propostas',
      'Valor Total',
      'Propostas Aceitas',
      'Valor Aceito',
      'Taxa de Aceitação (%)',
      'Valor Médio',
      'Margem Média (%)',
    ]
    const rows = tableData.map((r: any) => [
      r.periodo,
      r.total,
      r.valorTotal.toFixed(2),
      r.aceitas,
      r.valorAceito.toFixed(2),
      r.taxaAceitacao.toFixed(2),
      r.valorMedio.toFixed(2),
      r.margemMedia.toFixed(2),
    ])
    const csv = [headers, ...rows].map((e) => e.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_propostas_${format(new Date(), 'yyyyMMdd')}.csv`
    link.click()
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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
            <SelectTrigger className="w-[140px] bg-white">
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
            <SelectTrigger className="w-[140px] bg-white">
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

          <Select value={tipoServico} onValueChange={setTipoServico}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Serviço" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Serviços</SelectItem>
              <SelectItem value="Consultoria">Consultoria</SelectItem>
              <SelectItem value="Treinamento">Treinamento</SelectItem>
              <SelectItem value="Coaching">Coaching</SelectItem>
              <SelectItem value="Diagnóstico">Diagnóstico</SelectItem>
              <SelectItem value="Palestra">Palestra</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={exportCSV}
          className="bg-black hover:bg-gray-800 text-white shadow-sm shrink-0"
        >
          <Download className="w-4 h-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">
              Volume Total
            </CardTitle>
            <FileText className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{kpis.total}</div>
            <p className="text-xs text-gray-500 mt-1">propostas emitidas</p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">
              Valor em Pipeline
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {fmt(kpis.valor_total)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              soma de todas propostas
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">
              Taxa de Aceitação
            </CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {kpis.taxa.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {kpis.aceitas} propostas aceitas
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-500">
              Ticket Médio
            </CardTitle>
            <Target className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {fmt(kpis.media)}
            </div>
            <p className="text-xs text-gray-500 mt-1">por proposta enviada</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            Evolução de Propostas (Valor Financeiro)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] pt-4">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              Carregando gráfico...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-gray-400">
              Dados insuficientes para o período.
            </div>
          ) : (
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#888' }}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis
                    tickFormatter={(val) =>
                      `R$ ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`
                    }
                    tick={{ fontSize: 12, fill: '#888' }}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip
                    formatter={(value: number) => [fmt(value), 'Valor Total']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #eee',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Valor"
                    stroke="#0f172a"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 6, fill: '#0f172a' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-lg">Consolidado por Período</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Período</TableHead>
                  <TableHead className="font-semibold text-center">
                    Nº Propostas
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Valor Total
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Aceitas
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Valor Aceito
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Taxa Aceit.
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Ticket Médio
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Margem Média
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : tableData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      Nenhuma proposta encontrada no período.
                    </TableCell>
                  </TableRow>
                ) : (
                  tableData.map((r: any) => (
                    <TableRow key={r.periodo} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium text-gray-900 capitalize">
                        {r.periodo}
                      </TableCell>
                      <TableCell className="text-center text-gray-600">
                        {r.total}
                      </TableCell>
                      <TableCell className="text-right text-gray-900 font-medium">
                        {fmt(r.valorTotal)}
                      </TableCell>
                      <TableCell className="text-center text-green-600 font-medium">
                        {r.aceitas}
                      </TableCell>
                      <TableCell className="text-right text-green-700 font-semibold">
                        {fmt(r.valorAceito)}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {r.taxaAceitacao.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {fmt(r.valorMedio)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          r.margemMedia > 35
                            ? 'text-green-600'
                            : r.margemMedia >= 20
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {r.margemMedia.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
