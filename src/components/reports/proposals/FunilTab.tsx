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
  FunnelChart,
  Funnel,
  LabelList,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { Button } from '@/components/ui/button'
import { Download, Eye, CheckCircle, Clock } from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'

export function FunilTab({ data }: { data: any[] }) {
  const funnel = useMemo(() => {
    const counts = { Rascunho: 0, Enviada: 0, Visualizada: 0, Aceita: 0 }
    let sumDays = 0,
      accepteds = 0,
      rejected = 0

    data.forEach((p) => {
      if (p.status === 'Rascunho') counts.Rascunho++
      const sent = ['Enviada', 'Visualizada', 'Aceita', 'Rejeitada'].includes(
        p.status,
      )
      const viewed = ['Visualizada', 'Aceita', 'Rejeitada'].includes(p.status)
      if (sent) counts.Enviada++
      if (viewed) counts.Visualizada++
      if (p.status === 'Aceita') {
        counts.Aceita++
        accepteds++
        const created =
          p.historico_propostas?.find((h: any) => h.acao === 'Criada')
            ?.data_acao || p.created_at
        const accepted = p.historico_propostas?.find(
          (h: any) => h.acao === 'Aceita',
        )?.data_acao
        if (created && accepted)
          sumDays += differenceInDays(parseISO(accepted), parseISO(created))
      }
      if (p.status === 'Rejeitada') rejected++
    })

    const chartData = [
      { name: 'Criadas/Rascunho', value: data.length, fill: '#94a3b8' },
      { name: 'Enviadas', value: counts.Enviada, fill: '#3b82f6' },
      { name: 'Visualizadas', value: counts.Visualizada, fill: '#a855f7' },
      { name: 'Aceitas', value: counts.Aceita, fill: '#22c55e' },
    ]

    return {
      chartData,
      viewRate: counts.Enviada
        ? (counts.Visualizada / counts.Enviada) * 100
        : 0,
      acceptRate: counts.Enviada ? (counts.Aceita / counts.Enviada) * 100 : 0,
      avgDays: accepteds ? sumDays / accepteds : 0,
      rejected,
    }
  }, [data])

  const exportCSV = () => {
    const headers = ['Estágio', 'Quantidade']
    const csv = [headers, ...funnel.chartData.map((r) => [r.name, r.value])]
      .map((e) => e.join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `funil_${format(new Date(), 'yyyyMMdd')}.csv`
    link.click()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">
          Análise de Funil e Conversão
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
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm">
          <CardHeader className="pb-2 flex-row justify-between items-center">
            <CardTitle className="text-sm font-medium text-blue-800">
              Taxa de Visualização
            </CardTitle>
            <Eye className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {funnel.viewRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 shadow-sm">
          <CardHeader className="pb-2 flex-row justify-between items-center">
            <CardTitle className="text-sm font-medium text-green-800">
              Taxa de Aceitação
            </CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">
              {funnel.acceptRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm">
          <CardHeader className="pb-2 flex-row justify-between items-center">
            <CardTitle className="text-sm font-medium text-amber-800">
              Tempo Médio (Aceite)
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">
              {Math.round(funnel.avgDays)} dias
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle>Funil de Retenção</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <RechartsTooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Funnel
                    dataKey="value"
                    data={funnel.chartData}
                    isAnimationActive
                  >
                    <LabelList
                      position="right"
                      fill="#475569"
                      stroke="none"
                      dataKey="name"
                      fontSize={13}
                      fontWeight={500}
                    />
                    {funnel.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <CardTitle className="text-lg">Detalhamento dos Estágios</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold">Estágio</TableHead>
                  <TableHead className="text-right font-semibold">
                    Volume Retido
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funnel.chartData.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-gray-900 flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: row.fill }}
                      />
                      {row.name}
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-700">
                      {row.value}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-red-50/50 hover:bg-red-50/80">
                  <TableCell className="font-medium text-red-900 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm" />
                    Perdidas / Rejeitadas
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-700">
                    {funnel.rejected}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
