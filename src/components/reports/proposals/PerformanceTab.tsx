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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { format } from 'date-fns'

export function PerformanceTab({ data }: { data: any[] }) {
  const reps = useMemo(() => {
    const map: Record<string, any> = {}
    data.forEach((p) => {
      const rep = p.usuarios?.nome || 'Desconhecido'
      if (!map[rep])
        map[rep] = { rep, count: 0, value: 0, acceptedCount: 0, costs: 0 }

      map[rep].count++
      map[rep].value += p.valor_total || 0
      if (p.status === 'Aceita') map[rep].acceptedCount++
      const custo =
        p.custos_operacionais?.reduce(
          (sum: number, c: any) => sum + (c.valor || 0),
          0,
        ) || 0
      map[rep].costs += custo
    })

    return Object.values(map)
      .map((m) => ({
        ...m,
        acceptRate: m.count ? (m.acceptedCount / m.count) * 100 : 0,
        avgValue: m.count ? m.value / m.count : 0,
        margin: m.value ? ((m.value - m.costs) / m.value) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
  }, [data])

  const exportCSV = () => {
    const headers = [
      'Responsável',
      'Propostas',
      'Valor Total',
      'Aceitas',
      'Taxa Aceitação %',
      'Valor Médio',
      'Margem Média %',
    ]
    const csv = [
      headers,
      ...reps.map((r) => [
        r.rep,
        r.count,
        r.value.toFixed(2),
        r.acceptedCount,
        r.acceptRate.toFixed(1),
        r.avgValue.toFixed(2),
        r.margin.toFixed(1),
      ]),
    ]
      .map((e) => e.join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `performance_${format(new Date(), 'yyyyMMdd')}.csv`
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
          Performance da Equipe Comercial
        </h2>
        <Button
          variant="outline"
          onClick={exportCSV}
          className="bg-white hover:bg-gray-50"
        >
          <Download className="w-4 h-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle>Valor Total por Responsável</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reps}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    type="number"
                    tickFormatter={(v) =>
                      `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`
                    }
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="rep"
                    width={100}
                    tick={{ fill: '#334155', fontWeight: 500, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(val: number) => [fmt(val), 'Valor Total']}
                  />
                  <Bar
                    dataKey="value"
                    fill="#0f172a"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle>Taxa de Conversão por Responsável</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={reps} outerRadius="70%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="rep"
                    tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                  />
                  <Radar
                    name="Taxa de Aceitação (%)"
                    dataKey="acceptRate"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="#3b82f6"
                    fillOpacity={0.4}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-gray-100 overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-lg">
            Ranking Comercial Consolidado
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-center w-20">
                  Rank
                </TableHead>
                <TableHead className="font-semibold">Responsável</TableHead>
                <TableHead className="font-semibold text-center">
                  Propostas
                </TableHead>
                <TableHead className="font-semibold text-right">
                  Valor Total
                </TableHead>
                <TableHead className="font-semibold text-right">
                  Ticket Médio
                </TableHead>
                <TableHead className="font-semibold text-right">
                  Conversão
                </TableHead>
                <TableHead className="font-semibold text-right">
                  Margem
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reps.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum dado encontrado para o período.
                  </TableCell>
                </TableRow>
              ) : (
                reps.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center font-bold text-gray-500">
                      #{i + 1}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {r.rep}
                    </TableCell>
                    <TableCell className="text-center text-gray-600">
                      {r.count}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">
                      {fmt(r.value)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {fmt(r.avgValue)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-blue-600">
                      {r.acceptRate.toFixed(1)}%
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${r.margin > 30 ? 'text-green-600' : 'text-amber-600'}`}
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
