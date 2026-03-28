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
import { format, subDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function PropostasReport() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('90d')

  useEffect(() => {
    fetchData()
  }, [periodo])

  const fetchData = async () => {
    setLoading(true)
    let query = supabase
      .from('propostas')
      .select('*, empresas(nome), usuarios(nome)')
      .order('created_at', { ascending: true })

    if (periodo === '30d')
      query = query.gte('created_at', subDays(new Date(), 30).toISOString())
    if (periodo === '90d')
      query = query.gte('created_at', subDays(new Date(), 90).toISOString())
    if (periodo === 'ano')
      query = query.gte('created_at', subDays(new Date(), 365).toISOString())

    const { data: props } = await query
    setData(props || [])
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

  const exportCSV = () => {
    const headers = [
      'ID',
      'Número',
      'Data Emissão',
      'Empresa',
      'Valor Total',
      'Status',
    ]
    const rows = data.map((p) => [
      p.id,
      p.numero_proposta,
      p.data_emissao,
      `"${p.empresas?.nome || ''}"`,
      p.valor_total,
      p.status,
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-2 rounded-lg">
            <Filter className="w-4 h-4 text-gray-600" />
          </div>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="ano">Último ano</SelectItem>
              <SelectItem value="todos">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={exportCSV}
          className="bg-black hover:bg-gray-800 text-white shadow-sm"
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
              Taxa de Conversão
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
            Evolução do Pipeline (Valor Financeiro)
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
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-lg">Detalhamento Analítico</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Número</TableHead>
                  <TableHead className="font-semibold">Data Emissão</TableHead>
                  <TableHead className="font-semibold">Empresa</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">
                    Valor Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-gray-500"
                    >
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-gray-500"
                    >
                      Nenhuma proposta encontrada no período.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.slice(0, 20).map((p) => (
                    <TableRow key={p.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium text-gray-900">
                        {p.numero_proposta}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(p.data_emissao).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-gray-900">
                        {p.empresas?.nome || '-'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            p.status === 'Aceita'
                              ? 'bg-green-100 text-green-800'
                              : p.status === 'Rejeitada'
                                ? 'bg-red-100 text-red-800'
                                : p.status === 'Enviada'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {fmt(p.valor_total)}
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
