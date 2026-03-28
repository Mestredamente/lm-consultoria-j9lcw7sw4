import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { DollarSign, ShieldCheck, Target, TrendingUp } from 'lucide-react'

export function RevenueForecast() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    forecastData: [] as any[],
    expectedRevenue30d: 0,
    confidenceScore: 0,
    pipeline: [] as any[],
  })

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      // In a real app, we'd fetch historical data and active pipeline to calculate
      // moving average and expected value (value * probability).
      // Mocking the result for demonstration as requested.

      setData({
        forecastData: [
          { data: 'Dez/23', real: 120000, previsto: 115000 },
          { data: 'Jan/24', real: 145000, previsto: 130000 },
          { data: 'Fev/24', real: 130000, previsto: 140000 },
          { data: 'Mar/24', real: 180000, previsto: 160000 },
          { data: 'Abr/24', real: 165000, previsto: 175000 },
          { data: 'Mai/24', real: 190000, previsto: 180000 },
          { data: 'Jun/24 (Proj)', real: null, previsto: 205000 },
          { data: 'Jul/24 (Proj)', real: null, previsto: 220000 },
          { data: 'Ago/24 (Proj)', real: null, previsto: 235000 },
        ],
        expectedRevenue30d: 205000,
        confidenceScore: 82,
        pipeline: [
          {
            id: 1,
            cliente: 'Tech Solutions',
            valor: 85000,
            status: 'Visualizada',
            prob: 80,
          },
          {
            id: 2,
            cliente: 'Indústria Alpha',
            valor: 120000,
            status: 'Enviada',
            prob: 60,
          },
          {
            id: 3,
            cliente: 'Varejo Mega',
            valor: 45000,
            status: 'Visualizada',
            prob: 90,
          },
          {
            id: 4,
            cliente: 'Construtora Beta',
            valor: 60000,
            status: 'Enviada',
            prob: 40,
          },
        ],
      })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)

  if (loading)
    return (
      <div className="h-64 flex items-center justify-center">
        Carregando previsão...
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-gray-900 to-black text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 font-medium mb-1">
                  Receita Prevista (30 dias)
                </p>
                <h3 className="text-4xl font-bold">
                  {formatCurrency(data.expectedRevenue30d)}
                </h3>
                <p className="text-sm text-emerald-400 mt-2 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" /> +12% em relação ao mês
                  anterior
                </p>
              </div>
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-800 font-medium mb-1">
                  Confiança da Previsão
                </p>
                <h3 className="text-4xl font-bold text-emerald-900">
                  {data.confidenceScore}%
                </h3>
                <p className="text-sm text-emerald-600 mt-2">
                  Baseado em regressão linear histórica
                </p>
              </div>
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              Projeção de Faturamento (90 dias)
            </CardTitle>
            <CardDescription>
              Comparativo entre receita realizada e tendência linear prevista
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ChartContainer
                config={{
                  real: { label: 'Realizado', color: '#10b981' },
                  previsto: { label: 'Previsto', color: '#94a3b8' },
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.forecastData}>
                    <defs>
                      <linearGradient
                        id="colorReal"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="data"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12 }}
                      dx={-10}
                      tickFormatter={(v) => `R${v / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="real"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorReal)"
                    />
                    <Line
                      type="dashed"
                      dataKey="previsto"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              Pipeline em Andamento
            </CardTitle>
            <CardDescription>
              Receita esperada = Valor × Probabilidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {data.pipeline.map((p) => {
                const expected = p.valor * (p.prob / 100)
                return (
                  <div
                    key={p.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">{p.cliente}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        {p.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Prob. {p.prob}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Original: {formatCurrency(p.valor)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-emerald-600 font-medium mb-1">
                          Esperado
                        </p>
                        <p className="font-bold text-gray-900">
                          {formatCurrency(expected)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
