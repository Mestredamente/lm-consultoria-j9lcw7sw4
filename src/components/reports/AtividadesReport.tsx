import React, { useState, useMemo } from 'react'
import {
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Activity as ActivityIcon,
  Target,
} from 'lucide-react'
import { useActivities } from '@/contexts/ActivitiesContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { PieChart, Pie, Cell } from 'recharts'
import { format, parseISO, isAfter, subDays } from 'date-fns'

const COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#8b5cf6',
  '#ef4444',
  '#64748b',
]

export default function AtividadesReport() {
  const { activities, usuarios, loading } = useActivities()

  const [periodo, setPeriodo] = useState<string>('30')
  const [responsavelId, setResponsavelId] = useState<string>('all')
  const [tipo, setTipo] = useState<string>('all')

  const filteredActivities = useMemo(() => {
    let filtered = activities

    if (periodo !== 'all') {
      const threshold = subDays(new Date(), parseInt(periodo))
      filtered = filtered.filter((a) => {
        const dateStr = a.data_agendada || a.created_at
        if (!dateStr) return true
        return isAfter(parseISO(dateStr), threshold)
      })
    }
    if (responsavelId !== 'all') {
      filtered = filtered.filter((a) => a.responsavel_id === responsavelId)
    }
    if (tipo !== 'all') {
      filtered = filtered.filter((a) => a.tipo === tipo)
    }

    return filtered
  }, [activities, periodo, responsavelId, tipo])

  const stats = useMemo(() => {
    const total = filteredActivities.length
    const concluidas = filteredActivities.filter(
      (a) => a.status === 'Concluída',
    ).length
    const pendentes = filteredActivities.filter(
      (a) => a.status !== 'Concluída' && a.status !== 'Cancelada',
    ).length
    const taxaConclusao = total > 0 ? (concluidas / total) * 100 : 0

    const tipoMap: Record<string, number> = {}
    const respMap: Record<
      string,
      { total: number; concluidas: number; pendentes: number }
    > = {}

    filteredActivities.forEach((a) => {
      tipoMap[a.tipo] = (tipoMap[a.tipo] || 0) + 1
      if (!respMap[a.responsavel_id]) {
        respMap[a.responsavel_id] = { total: 0, concluidas: 0, pendentes: 0 }
      }
      respMap[a.responsavel_id].total += 1
      if (a.status === 'Concluída') respMap[a.responsavel_id].concluidas += 1
      else if (a.status !== 'Cancelada')
        respMap[a.responsavel_id].pendentes += 1
    })

    const dadosPorTipo = Object.keys(tipoMap).map((k, i) => ({
      name: k,
      value: tipoMap[k],
      fill: COLORS[i % COLORS.length],
    }))

    const dadosPorResponsavel = Object.keys(respMap)
      .map((k) => {
        const user = usuarios.find((u) => u.id === k)
        const data = respMap[k]
        return {
          id: k,
          nome: user?.nome || user?.email || 'Desconhecido',
          ...data,
          taxa: data.total > 0 ? (data.concluidas / data.total) * 100 : 0,
        }
      })
      .sort((a, b) => b.total - a.total)

    return {
      total,
      concluidas,
      pendentes,
      taxaConclusao,
      dadosPorTipo,
      dadosPorResponsavel,
    }
  }, [filteredActivities, usuarios])

  const handleExportCsv = () => {
    const headers = [
      'Responsável',
      'Total Atividades',
      'Concluídas',
      'Pendentes',
      'Taxa Conclusão (%)',
    ]
    const rows = stats.dadosPorResponsavel.map((row) => [
      `"${row.nome}"`,
      row.total,
      row.concluidas,
      row.pendentes,
      row.taxa.toFixed(2),
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio-atividades-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">
        Carregando...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Performance da Equipe
        </h2>
        <Button
          onClick={handleExportCsv}
          variant="outline"
          className="bg-white rounded-xl shadow-sm border-gray-200"
        >
          <Download className="w-4 h-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      <div className="glass-card rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 border-white/60">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mr-2 shrink-0">
          <Filter className="w-4 h-4" /> Filtros:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="bg-white/70 border-gray-200 rounded-xl">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
          <Select value={responsavelId} onValueChange={setResponsavelId}>
            <SelectTrigger className="bg-white/70 border-gray-200 rounded-xl">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os responsáveis</SelectItem>
              {usuarios.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nome || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="bg-white/70 border-gray-200 rounded-xl">
              <SelectValue placeholder="Tipo de Atividade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {[
                'Ligação',
                'Email',
                'Reunião',
                'Tarefa Interna',
                'Acompanhamento',
              ].map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-white/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total de Atividades
              </p>
              <ActivityIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {stats.total}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Concluídas
              </p>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {stats.concluidas}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Pendentes
              </p>
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {stats.pendentes}
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/60 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground">
                Taxa de Conclusão
              </p>
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {stats.taxaConclusao.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card border-white/60 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Atividades por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.dadosPorTipo.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                Sem dados.
              </div>
            ) : (
              <ChartContainer
                config={{ value: { label: 'Quantidade' } }}
                className="h-[250px] w-full"
              >
                <PieChart>
                  <Pie
                    data={stats.dadosPorTipo}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {stats.dadosPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-white/60 shadow-sm overflow-hidden lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              Performance por Responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold">Responsável</TableHead>
                  <TableHead className="font-semibold text-right">
                    Total
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Concluídas
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Pendentes
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Conclusão
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.dadosPorResponsavel.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center h-32 text-gray-500"
                    >
                      Sem dados.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.dadosPorResponsavel.map((row) => (
                    <TableRow key={row.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium text-gray-900">
                        {row.nome}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {row.total}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {row.concluidas}
                      </TableCell>
                      <TableCell className="text-right text-orange-500">
                        {row.pendentes}
                      </TableCell>
                      <TableCell className="text-right text-purple-600">
                        {row.taxa.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
