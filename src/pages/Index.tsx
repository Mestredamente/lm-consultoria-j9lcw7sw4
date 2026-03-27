import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCompanies } from '@/contexts/CompaniesContext'
import { useContacts } from '@/contexts/ContactsContext'
import { useOportunidades } from '@/contexts/OportunidadesContext'
import { useActivities, getActivityColor } from '@/contexts/ActivitiesContext'
import { subDays, isToday, parseISO, isAfter } from 'date-fns'
import {
  Building2,
  Users,
  CircleDollarSign,
  Target,
  Calendar,
  Clock,
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'

export default function Index() {
  const { role } = useAuth()
  const [period, setPeriod] = useState<'30' | '90' | '365'>('30')

  const { companies, loading: loadingCompanies } = useCompanies()
  const { contacts, loading: loadingContacts } = useContacts()
  const { oportunidades, loading: loadingOportunidades } = useOportunidades()
  const { activities, loading: loadingActivities } = useActivities()

  const loading =
    loadingCompanies ||
    loadingContacts ||
    loadingOportunidades ||
    loadingActivities

  const thresholdDate = useMemo(
    () => subDays(new Date(), parseInt(period)),
    [period],
  )

  const {
    totalEmpresas,
    totalContatos,
    valorAberto,
    taxaConversao,
    pipelineData,
  } = useMemo(() => {
    const filteredCompanies = companies.filter((c) =>
      c.createdAt ? isAfter(parseISO(c.createdAt), thresholdDate) : true,
    )
    const filteredContacts = contacts.filter((c) =>
      c.createdAt ? isAfter(parseISO(c.createdAt), thresholdDate) : true,
    )
    const filteredOportunidades = oportunidades.filter((o) =>
      o.created_at ? isAfter(parseISO(o.created_at), thresholdDate) : true,
    )

    const openOps = filteredOportunidades.filter(
      (o) => !['Ganho', 'Perdido'].includes(o.estagio),
    )
    const valorAberto = openOps.reduce(
      (acc, o) => acc + (o.valor_estimado || 0),
      0,
    )

    const ganhas = filteredOportunidades.filter(
      (o) => o.estagio === 'Ganho',
    ).length
    const taxaConversao =
      filteredOportunidades.length > 0
        ? Math.round((ganhas / filteredOportunidades.length) * 100)
        : 0

    const estagios = [
      'Prospecção',
      'Qualificação',
      'Proposta',
      'Negociação',
      'Fechamento',
    ]
    const pipelineData = estagios.map((estagio) => {
      const ops = openOps.filter((o) => o.estagio === estagio)
      const valor = ops.reduce((acc, o) => acc + (o.valor_estimado || 0), 0)
      return { estagio, valor }
    })

    return {
      totalEmpresas: filteredCompanies.length,
      totalContatos: filteredContacts.length,
      valorAberto,
      taxaConversao,
      pipelineData,
    }
  }, [companies, contacts, oportunidades, thresholdDate])

  const atividadesHoje = useMemo(() => {
    return activities.filter(
      (a) => a.data_agendada && isToday(parseISO(a.data_agendada)),
    )
  }, [activities])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const chartConfig = {
    valor: {
      label: 'Valor (R$)',
      color: 'hsl(var(--primary))',
    },
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6 w-full max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] col-span-1 lg:col-span-2" />
          <Skeleton className="h-[400px] col-span-1" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {role === 'vendedor'
              ? 'Meu Painel de Vendas'
              : role === 'gerente'
                ? 'Painel da Equipe'
                : 'Visão Geral do Negócio'}
          </h1>
          <p className="text-muted-foreground">
            {role === 'vendedor'
              ? 'Acompanhe suas metas, oportunidades e atividades diárias'
              : 'Visão consolidada do negócio e pipeline de vendas'}
          </p>
        </div>

        <Select value={period} onValueChange={(val: any) => setPeriod(val)}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Empresas
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmpresas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              no período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Contatos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContatos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              no período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Oportunidades em Aberto
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(valorAberto)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              em{' '}
              {pipelineData.reduce(
                (acc, curr) => acc + (curr.valor > 0 ? 1 : 0),
                0,
              )}{' '}
              estágios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Conversão
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaConversao}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              oportunidades ganhas / total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline por Estágio</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart
                data={pipelineData}
                margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="estagio"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  tickFormatter={(val) =>
                    `R$ ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`
                  }
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="valor"
                  fill="var(--color-valor)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 flex flex-col h-[400px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Atividades de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-4">
              {atividadesHoje.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-10">
                  <Calendar className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm">
                    Nenhuma atividade programada para hoje.
                  </p>
                </div>
              ) : (
                atividadesHoje.map((atividade) => (
                  <div
                    key={atividade.id}
                    className="flex items-start gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div
                      className={`p-2 rounded-full mt-1 ${getActivityColor(atividade.tipo)}`}
                    >
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 leading-tight">
                        {atividade.titulo}
                      </p>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-xs text-muted-foreground">
                          {atividade.tipo}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span className="text-xs font-medium text-gray-600">
                          {atividade.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
