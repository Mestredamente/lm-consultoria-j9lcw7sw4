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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Eye, Send, FileText, CheckCircle, XCircle } from 'lucide-react'

export function FunilReport() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: props } = await supabase
      .from('propostas')
      .select('status, valor_total')
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

    data.forEach((p) => {
      const s = p.status as keyof typeof counts
      if (counts[s] !== undefined) {
        counts[s]++
        values[s] += p.valor_total || 0
      }
    })

    const total = data.length
    // In a classic sales funnel, stages include the ones below it.
    // For specific status tracking, we show exactly where they are currently.
    // To show a true funnel (reduction), we calculate cumulative.

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
        count:
          counts.Enviada +
          counts.Visualizada +
          counts.Aceita +
          counts.Rejeitada,
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
        count: counts.Visualizada + counts.Aceita + counts.Rejeitada,
        value: values.Visualizada + values.Aceita + values.Rejeitada,
        color: '#a855f7',
        icon: Eye,
      },
      {
        name: 'Aceitas',
        count: counts.Aceita,
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
    }
  }, [data])

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v)
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        Carregando dados do funil...
      </div>
    )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-blue-800">
              Taxa de Envio
            </CardTitle>
            <Send className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {funnelData.total > 0
                ? pct(funnelData.funnelSteps[1].count / funnelData.total)
                : '0%'}
            </div>
            <p className="text-xs text-blue-600 mt-1">do total criado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-purple-800">
              Taxa de Visualização
            </CardTitle>
            <Eye className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              {funnelData.funnelSteps[1].count > 0
                ? pct(
                    funnelData.funnelSteps[2].count /
                      funnelData.funnelSteps[1].count,
                  )
                : '0%'}
            </div>
            <p className="text-xs text-purple-600 mt-1">dos emails enviados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-green-800">
              Taxa de Fechamento
            </CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {funnelData.funnelSteps[2].count > 0
                ? pct(
                    funnelData.funnelSteps[3].count /
                      funnelData.funnelSteps[2].count,
                  )
                : '0%'}
            </div>
            <p className="text-xs text-green-600 mt-1">
              das propostas visualizadas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle>Funil de Conversão Cumulativo</CardTitle>
            <CardDescription>
              Sobrevivência das propostas em cada etapa
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
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
                  formatter={(val: number, name: string, props: any) => [
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
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle>Status Atual do Pipeline</CardTitle>
            <CardDescription>
              Onde as propostas estão paradas hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-gray-100">
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

            <div className="mt-6 bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-start gap-3">
              <div className="bg-amber-100 p-1.5 rounded-md mt-0.5">
                <XCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-900">
                  Análise de Rejeição
                </h4>
                <p className="text-sm text-amber-800 mt-1">
                  Ocorreram{' '}
                  <strong>
                    {funnelData.currentStatus.find(
                      (s) => s.name === 'Rejeitada',
                    )?.count || 0}
                  </strong>{' '}
                  perdas documentadas, representando{' '}
                  <strong>
                    {fmt(
                      funnelData.currentStatus.find(
                        (s) => s.name === 'Rejeitada',
                      )?.value || 0,
                    )}
                  </strong>{' '}
                  a menos no faturamento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
