import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { FinancialSummary } from './proposal-types'
import { useIsMobile } from '@/hooks/use-mobile'

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#6366f1',
  '#14b8a6',
]

export function GraficosProposal({ summary }: { summary: FinancialSummary }) {
  const isMobile = useIsMobile()

  const pieData = [
    { name: 'Deslocamento', value: summary.detalhamento.deslocamento },
    { name: 'Hospedagem', value: summary.detalhamento.hospedagem },
    { name: 'Alimentação', value: summary.detalhamento.alimentacao },
    { name: 'Testes', value: summary.detalhamento.testes },
    { name: 'Materiais', value: summary.detalhamento.materiais },
    { name: 'Serviços', value: summary.detalhamento.servicos },
    { name: 'Overhead', value: summary.detalhamento.overhead },
  ].filter((d) => d.value > 0)

  const pieConfig = pieData.reduce((acc, curr, i) => {
    acc[curr.name] = { label: curr.name, color: COLORS[i % COLORS.length] }
    return acc
  }, {} as any)

  const barData = [
    {
      name: 'Valores',
      Custo: summary.custo_total,
      Margem: summary.valor_markup,
      Final: summary.valor_final_liquido,
    },
  ]
  const barConfig = {
    Custo: { label: 'Custo', color: '#ef4444' },
    Margem: { label: 'Margem', color: '#10b981' },
    Final: { label: 'Valor Final', color: '#3b82f6' },
  }

  const lineData = [10, 20, 30, 40, 50, 60].map((m) => {
    const mkp = summary.custo_total * (m / 100)
    const bruto = summary.custo_total + mkp
    const imp = bruto * 0.15
    return { margem: `${m}%`, valor: bruto + imp }
  })
  const lineConfig = {
    valor: { label: 'Valor Final', color: '#8b5cf6' },
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v)

  const chartHeight = isMobile ? 220 : 250

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-center text-gray-700 uppercase tracking-wider">
            Distribuição de Custos
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 px-2" style={{ height: chartHeight }}>
          {pieData.length > 0 ? (
            <ChartContainer config={pieConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={isMobile ? 35 : 45}
                    outerRadius={isMobile ? 65 : 80}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent valueFormatter={fmt} />}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: isMobile ? '10px' : '11px',
                      paddingTop: '10px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              Sem dados de custo
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-center text-gray-700 uppercase tracking-wider">
            Composição do Valor
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 px-2" style={{ height: chartHeight }}>
          <ChartContainer config={barConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                {!isMobile && <XAxis dataKey="name" hide />}
                <YAxis
                  tickFormatter={(val) => `R${(val / 1000).toFixed(0)}k`}
                  fontSize={isMobile ? 10 : 11}
                  axisLine={false}
                  tickLine={false}
                  width={isMobile ? 40 : 50}
                />
                <ChartTooltip
                  content={<ChartTooltipContent valueFormatter={fmt} />}
                />
                <Bar
                  dataKey="Custo"
                  fill="var(--color-Custo)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={isMobile ? 30 : 40}
                />
                <Bar
                  dataKey="Margem"
                  fill="var(--color-Margem)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={isMobile ? 30 : 40}
                />
                <Bar
                  dataKey="Final"
                  fill="var(--color-Final)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={isMobile ? 30 : 40}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: isMobile ? '10px' : '11px',
                    paddingTop: '10px',
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-100 md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-center text-gray-700 uppercase tracking-wider">
            Simulação de Margem
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 px-2" style={{ height: chartHeight }}>
          <ChartContainer config={lineConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="margem"
                  fontSize={isMobile ? 10 : 11}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                  tickMargin={5}
                />
                <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                <ChartTooltip
                  content={<ChartTooltipContent valueFormatter={fmt} />}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="var(--color-valor)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--color-valor)' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
