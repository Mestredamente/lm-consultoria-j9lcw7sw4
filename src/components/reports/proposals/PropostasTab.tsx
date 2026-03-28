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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function PropostasTab({ data }: { data: any[] }) {
  const aggregated = useMemo(() => {
    const map: Record<string, any> = {}
    data.forEach((p) => {
      const month = format(parseISO(p.created_at), 'MMM yyyy', { locale: ptBR })
      if (!map[month])
        map[month] = {
          month,
          count: 0,
          value: 0,
          acceptedCount: 0,
          acceptedValue: 0,
          costs: 0,
        }

      map[month].count++
      map[month].value += p.valor_total || 0
      if (p.status === 'Aceita') {
        map[month].acceptedCount++
        map[month].acceptedValue += p.valor_total || 0
      }
      const custo =
        p.custos_operacionais?.reduce(
          (sum: number, c: any) => sum + (c.valor || 0),
          0,
        ) || 0
      map[month].costs += custo
    })

    return Object.values(map).map((m) => ({
      ...m,
      acceptRate: m.count ? (m.acceptedCount / m.count) * 100 : 0,
      avgValue: m.count ? m.value / m.count : 0,
      margin: m.value ? ((m.value - m.costs) / m.value) * 100 : 0,
    }))
  }, [data])

  const exportCSV = () => {
    const headers = [
      'Mês',
      'Propostas',
      'Valor Total',
      'Aceitas',
      'Valor Aceito',
      'Taxa Aceitação %',
      'Valor Médio',
      'Margem Média %',
    ]
    const rows = aggregated.map((r) => [
      r.month,
      r.count,
      r.value.toFixed(2),
      r.acceptedCount,
      r.acceptedValue.toFixed(2),
      r.acceptRate.toFixed(1),
      r.avgValue.toFixed(2),
      r.margin.toFixed(1),
    ])
    const csv = [headers, ...rows].map((e) => e.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `propostas_${format(new Date(), 'yyyyMMdd')}.csv`
    link.click()
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={exportCSV}
          className="bg-white shadow-sm hover:bg-gray-50"
        >
          <Download className="w-4 h-4 mr-2" /> Exportar CSV
        </Button>
      </div>
      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle>Evolução ao Longo do Tempo</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ChartContainer config={{}} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={aggregated}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v) =>
                    `R$ ${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`
                  }
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="value"
                  name="Valor (R$)"
                  stroke="#0f172a"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="count"
                  name="Propostas"
                  stroke="#3b82f6"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-100">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-lg">Consolidado Mensal</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Período</TableHead>
                <TableHead className="font-semibold text-center">
                  Propostas
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
              {aggregated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum dado encontrado para o período.
                  </TableCell>
                </TableRow>
              ) : (
                aggregated.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-gray-900 capitalize">
                      {r.month}
                    </TableCell>
                    <TableCell className="text-center text-gray-600">
                      {r.count}
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900">
                      {fmt(r.value)}
                    </TableCell>
                    <TableCell className="text-center text-green-600 font-medium">
                      {r.acceptedCount}
                    </TableCell>
                    <TableCell className="text-right text-green-700 font-semibold">
                      {fmt(r.acceptedValue)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {r.acceptRate.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {fmt(r.avgValue)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${r.margin > 30 ? 'text-green-600' : r.margin >= 15 ? 'text-amber-600' : 'text-red-600'}`}
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
