import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BarChart3, Filter } from 'lucide-react'
import { subDays } from 'date-fns'
import { PropostasTab } from '@/components/reports/proposals/PropostasTab'
import { FunilTab } from '@/components/reports/proposals/FunilTab'
import { PerformanceTab } from '@/components/reports/proposals/PerformanceTab'
import { RentabilidadeTab } from '@/components/reports/proposals/RentabilidadeTab'

export default function ProposalsDashboard() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('90d')
  const [usuarioId, setUsuarioId] = useState('todos')
  const [empresaId, setEmpresaId] = useState('todas')
  const [tipoServico, setTipoServico] = useState('todos')

  const [usuarios, setUsuarios] = useState<any[]>([])
  const [empresas, setEmpresas] = useState<any[]>([])
  const [servicos, setServicos] = useState<string[]>([])

  useEffect(() => {
    supabase
      .from('usuarios')
      .select('id, nome')
      .then(({ data }) => setUsuarios(data || []))
    supabase
      .from('empresas')
      .select('id, nome')
      .then(({ data }) => setEmpresas(data || []))
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      let query = supabase
        .from('propostas')
        .select(
          `
        id, status, valor_total, created_at, responsavel_id, empresa_id, status_nf,
        usuarios(nome), empresas(nome),
        itens_proposta(tipo_servico, subtotal, valor_unitario, quantidade),
        custos_operacionais(tipo, valor),
        historico_propostas(acao, data_acao)
      `,
        )
        .order('created_at', { ascending: true })

      if (periodo === '30d')
        query = query.gte('created_at', subDays(new Date(), 30).toISOString())
      if (periodo === '90d')
        query = query.gte('created_at', subDays(new Date(), 90).toISOString())
      if (periodo === 'ano')
        query = query.gte('created_at', subDays(new Date(), 365).toISOString())

      const { data: props } = await query
      setData(props || [])

      const s = new Set<string>()
      props?.forEach((p) =>
        p.itens_proposta?.forEach(
          (i: any) => i.tipo_servico && s.add(i.tipo_servico),
        ),
      )
      setServicos(Array.from(s))
      setLoading(false)
    }
    fetchData()
  }, [periodo])

  const filteredData = useMemo(() => {
    return data.filter((p) => {
      if (usuarioId !== 'todos' && p.responsavel_id !== usuarioId) return false
      if (empresaId !== 'todas' && p.empresa_id !== empresaId) return false
      if (
        tipoServico !== 'todos' &&
        !p.itens_proposta?.some((i: any) => i.tipo_servico === tipoServico)
      )
        return false
      return true
    })
  }, [data, usuarioId, empresaId, tipoServico])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg shrink-0 text-white">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Dashboard Comercial
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Análise completa de desempenho, funil e rentabilidade das suas
              propostas.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="bg-gray-100 p-2 rounded-lg shrink-0">
          <Filter className="w-4 h-4 text-gray-600" />
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[150px] bg-white">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="ano">Último ano</SelectItem>
            <SelectItem value="todos">Todo o período</SelectItem>
          </SelectContent>
        </Select>
        <Select value={usuarioId} onValueChange={setUsuarioId}>
          <SelectTrigger className="w-[160px] bg-white">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Responsáveis</SelectItem>
            {usuarios.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nome || 'Sem nome'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={empresaId} onValueChange={setEmpresaId}>
          <SelectTrigger className="w-[160px] bg-white">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas Empresas</SelectItem>
            {empresas.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipoServico} onValueChange={setTipoServico}>
          <SelectTrigger className="w-[160px] bg-white">
            <SelectValue placeholder="Serviço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Serviços</SelectItem>
            {servicos.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-4">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <p>Processando dados do CRM...</p>
        </div>
      ) : (
        <Tabs defaultValue="propostas" className="w-full">
          <TabsList className="bg-white/50 border border-gray-200 p-1 rounded-xl mb-6 flex-wrap h-auto gap-2">
            <TabsTrigger
              value="propostas"
              className="rounded-lg px-6 data-[state=active]:bg-black data-[state=active]:text-white"
            >
              Propostas e Faturamento
            </TabsTrigger>
            <TabsTrigger
              value="funil"
              className="rounded-lg px-6 data-[state=active]:bg-black data-[state=active]:text-white"
            >
              Funil de Conversão
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="rounded-lg px-6 data-[state=active]:bg-black data-[state=active]:text-white"
            >
              Performance do Time
            </TabsTrigger>
            <TabsTrigger
              value="rentabilidade"
              className="rounded-lg px-6 data-[state=active]:bg-black data-[state=active]:text-white"
            >
              Análise de Rentabilidade
            </TabsTrigger>
          </TabsList>

          <TabsContent value="propostas" className="mt-0 outline-none">
            <PropostasTab data={filteredData} />
          </TabsContent>
          <TabsContent value="funil" className="mt-0 outline-none">
            <FunilTab data={filteredData} />
          </TabsContent>
          <TabsContent value="performance" className="mt-0 outline-none">
            <PerformanceTab data={filteredData} />
          </TabsContent>
          <TabsContent value="rentabilidade" className="mt-0 outline-none">
            <RentabilidadeTab data={filteredData} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
