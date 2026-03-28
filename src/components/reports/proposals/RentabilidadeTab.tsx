import { useMemo } from 'react'
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { Download, TrendingUp, DollarSign, Target } from 'lucide-react'
import { format } from 'date-fns'

export function RentabilidadeTab({ data }: { data: any[] }) {
  const services = useMemo(() => {
    const map: Record<string, any> = {}

    data.forEach((p) => {
      const propTotal = p.valor_total || 1
      const propCosts =
        p.custos_operacionais?.reduce(
          (s: number, c: any) => s + (c.valor || 0),
          0,
        ) || 0

      p.itens_proposta?.forEach((i: any) => {
        if (!i.tipo_servico) return
        if (!map[i.tipo_servico])
          map[i.tipo_servico] = {
            name: i.tipo_servico,
            count: 0,
            revenue: 0,
            cost: 0,
          }

        const sub = i.subtotal || i.quantidade * i.valor_unitario || 0
        const costShare = (sub / propTotal) * propCosts

        map[i.tipo_servico].count++
        map[i.tipo_servico].revenue += sub
        map[i.tipo_servico].cost += costShare
      })
    })

    return Object.values(map)
      .map((m) => {
        const margin =
          m.revenue > 0 ? ((m.revenue - m.cost) / m.revenue) * 100 : 0
        return {
          ...m,
          margin,
          avgTicket: m.count ? m.revenue / m.count : 0,
          avgCost: m.count ? m.cost / m.count : 0,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
  }, [data])

  const scatterData = services.map((s) => ({
    x: s.avgCost,
    y: s.avgTicket,
    z: s.count,
    name: s.name,
  }))
  const globalMargin =
    services.reduce((s, x) => s + x.margin, 0) / (services.length || 1)
  const topService = services[0]?.name || '-'
  const globalTicket =
    services.reduce((s, x) => s + x.avgTicket, 0) / (services.length || 1)

  const exportCSV = () => {
    const headers = [
      'Serviço',
      'Volume',
      'Faturamento',
      'Custo',
      'Margem %',
      'Ticket Médio',
    ]
    const csv = [
      headers,
      ...services.map((r) => [
        r.name,
        r.count,
        r.revenue.toFixed(2),
        r.cost.toFixed(2),
        r.margin.toFixed(1),
        r.avgTicket.toFixed(2),
      ]),
    ]
      .map((e) => e.join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rentabilidade_${format(new Date(), 'yyyyMMdd')}.csv`
    link.click()
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">
          Análise de Rentabilidade por Serviço
        </h2>
        <Button
          variant="outline"
          onClick={exportCSV}
          className="bg-white hover:bg-gray-50"
        >
          <Download className="w-4 h-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex-row justify-between items-center">
            <CardTitle className="text-sm font-medium text-gray-500">
              Margem Média Geral
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {globalMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex-row justify-between items-center">
            <CardTitle className="text-sm font-medium text-gray-500">
              Serviço Top Faturamento
            </CardTitle>
            <Target className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-gray-900 truncate"
              title={topService}
            >
              {topService}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 flex-row justify-between items-center">
            <CardTitle className="text-sm font-medium text-gray-500">
              Ticket Médio de Serviços
            </CardTitle>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {fmt(globalTicket)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle>Margem por Tipo de Serviço (%)</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={services}
                  margin={{ top: 20, right: 20, left: -20, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) =>
                      v.length > 15 ? v.substring(0, 15) + '...' : v
                    }
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar
                    dataKey="margin"
                    name="Margem %"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle>
              Dispersão: Custo vs Faturamento (Ticket Médio)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Custo"
                    tickFormatter={(v) => `R$${v}`}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Ticket"
                    tickFormatter={(v) => `R$${v}`}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ZAxis
                    type="number"
                    dataKey="z"
                    range={[100, 500]}
                    name="Volume"
                  />
                  <RechartsTooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(v: any, n: string) => [
                      n === 'Custo' || n === 'Ticket' ? fmt(v) : v,
                      n,
                    ]}
                  />
                  <Scatter
                    name="Serviços"
                    data={scatterData}
                    fill="#8b5cf6"
                    fillOpacity={0.8}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-gray-100 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-lg">
            Detalhamento Financeiro por Serviço
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Tipo de Serviço</TableHead>
                <TableHead className="text-center font-semibold">
                  Volume Ofertado
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Ticket Médio
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Custo Médio Alocado
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Faturamento Projetado
                </TableHead>
                <TableHead className="text-right font-semibold">
                  Margem Bruta
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum dado encontrado para o período.
                  </TableCell>
                </TableRow>
              ) : (
                services.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-gray-900">
                      {r.name}
                    </TableCell>
                    <TableCell className="text-center text-gray-600">
                      {r.count}
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-700">
                      {fmt(r.avgTicket)}
                    </TableCell>
                    <TableCell className="text-right text-red-600 font-medium">
                      {fmt(r.avgCost)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      {fmt(r.revenue)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold ${r.margin > 30 ? 'text-green-600' : r.margin >= 15 ? 'text-amber-600' : 'text-red-600'}`}
                    >
                      {r.margin.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
