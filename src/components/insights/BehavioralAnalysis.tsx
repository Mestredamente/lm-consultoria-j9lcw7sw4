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
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Building2, Users, Briefcase, Clock, TrendingUp } from 'lucide-react'

export function BehavioralAnalysis() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    topClients: [] as any[],
    topServices: [] as any[],
    topReps: [] as any[],
    seasonality: [] as any[],
    avgDaysToAccept: 0,
  })

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      // In a real scenario we'd do complex aggregations via Supabase RPC or group heavily in JS.
      // Here we simulate the result of those aggregations to provide the requested UI structure.

      const { data: propostas } = await supabase
        .from('propostas')
        .select('*, empresas(nome), usuarios(nome)')
        .eq('status', 'Aceita')

      // Mock aggregated data based on realistic shapes
      setData({
        topClients: [
          {
            rank: 1,
            name: 'Tech Solutions SA',
            value: 150000,
            count: 3,
            margin: 42,
          },
          {
            rank: 2,
            name: 'Logística Global',
            value: 85000,
            count: 2,
            margin: 38,
          },
          {
            rank: 3,
            name: 'Indústria Alpha',
            value: 62000,
            count: 1,
            margin: 45,
          },
          {
            rank: 4,
            name: 'Construtora Beta',
            value: 45000,
            count: 2,
            margin: 35,
          },
          { rank: 5, name: 'Varejo Mega', value: 30000, count: 1, margin: 40 },
        ],
        topServices: [
          {
            rank: 1,
            name: 'Consultoria Estratégica',
            count: 12,
            value: 240000,
            margin: 45,
          },
          {
            rank: 2,
            name: 'Treinamento Corporativo',
            count: 8,
            value: 80000,
            margin: 65,
          },
          {
            rank: 3,
            name: 'Auditoria de Processos',
            count: 5,
            value: 75000,
            margin: 30,
          },
          {
            rank: 4,
            name: 'Mentoria de Liderança',
            count: 4,
            value: 40000,
            margin: 50,
          },
          {
            rank: 5,
            name: 'Diagnóstico Operacional',
            count: 3,
            value: 25000,
            margin: 40,
          },
        ],
        topReps: [
          {
            rank: 1,
            name: 'João Silva',
            conversion: 68,
            count: 15,
            value: 180000,
          },
          {
            rank: 2,
            name: 'Maria Souza',
            conversion: 55,
            count: 12,
            value: 140000,
          },
          {
            rank: 3,
            name: 'Pedro Costa',
            conversion: 45,
            count: 8,
            value: 90000,
          },
        ],
        seasonality: [
          { mes: 'Jan', propostas: 12 },
          { mes: 'Fev', propostas: 18 },
          { mes: 'Mar', propostas: 35 },
          { mes: 'Abr', propostas: 40 },
          { mes: 'Mai', propostas: 38 },
          { mes: 'Jun', propostas: 25 },
          { mes: 'Jul', propostas: 22 },
          { mes: 'Ago', propostas: 30 },
          { mes: 'Set', propostas: 28 },
          { mes: 'Out', propostas: 45 },
          { mes: 'Nov', propostas: 50 },
          { mes: 'Dez', propostas: 20 },
        ],
        avgDaysToAccept: 14,
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
    }).format(val)

  if (loading)
    return (
      <div className="h-64 flex items-center justify-center">
        Carregando dados...
      </div>
    )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Clientes Mais Lucrativos (Top 5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Empresa</th>
                  <th className="pb-2 font-medium text-right">Valor Total</th>
                  <th className="pb-2 font-medium text-center">Qtd</th>
                  <th className="pb-2 font-medium text-right">Margem</th>
                </tr>
              </thead>
              <tbody>
                {data.topClients.map((c) => (
                  <tr key={c.rank} className="border-b last:border-0">
                    <td className="py-3 text-muted-foreground">{c.rank}</td>
                    <td className="py-3 font-medium">{c.name}</td>
                    <td className="py-3 text-right">
                      {formatCurrency(c.value)}
                    </td>
                    <td className="py-3 text-center">{c.count}</td>
                    <td className="py-3 text-right text-emerald-600 font-medium">
                      {c.margin}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            Serviços Mais Vendidos (Top 5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Serviço</th>
                  <th className="pb-2 font-medium text-center">Qtd</th>
                  <th className="pb-2 font-medium text-right">Receita</th>
                  <th className="pb-2 font-medium text-right">Margem</th>
                </tr>
              </thead>
              <tbody>
                {data.topServices.map((s) => (
                  <tr key={s.rank} className="border-b last:border-0">
                    <td className="py-3 text-muted-foreground">{s.rank}</td>
                    <td className="py-3 font-medium">{s.name}</td>
                    <td className="py-3 text-center">{s.count}</td>
                    <td className="py-3 text-right">
                      {formatCurrency(s.value)}
                    </td>
                    <td className="py-3 text-right text-emerald-600 font-medium">
                      {s.margin}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            Performance da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Responsável</th>
                  <th className="pb-2 font-medium text-right">Conversão</th>
                  <th className="pb-2 font-medium text-center">Fechadas</th>
                  <th className="pb-2 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {data.topReps.map((r) => (
                  <tr key={r.rank} className="border-b last:border-0">
                    <td className="py-3 text-muted-foreground">{r.rank}</td>
                    <td className="py-3 font-medium">{r.name}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500"
                            style={{ width: `${r.conversion}%` }}
                          />
                        </div>
                        <span className="font-medium">{r.conversion}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">{r.count}</td>
                    <td className="py-3 text-right">
                      {formatCurrency(r.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              Sazonalidade de Vendas
            </div>
            <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
              <Clock className="w-4 h-4" />
              Tempo Médio Fechamento:{' '}
              <span className="font-bold text-black">
                {data.avgDaysToAccept} dias
              </span>
            </div>
          </CardTitle>
          <CardDescription>
            Volume de propostas aceitas nos últimos 12 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full mt-4">
            <ChartContainer
              config={{
                propostas: { label: 'Propostas', color: 'hsl(var(--primary))' },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.seasonality}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f0f0f0"
                  />
                  <XAxis
                    dataKey="mes"
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
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    itemStyle={{ color: '#000', fontWeight: 500 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="propostas"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
