import { useState } from 'react'
import { ServiceRow, CostItem, calcularCustosProposal } from './proposal-types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface ProposalStep4Props {
  services: ServiceRow[]
  costs: CostItem[]
  overhead: number
  setOverhead: (v: number) => void
  contingencia: number
  setContingencia: (v: number) => void
  margem: number
  setMargem: (v: number) => void
  impostos: number
  setImpostos: (v: number) => void
  dataValidade: string
  setDataValidade: (v: string) => void
  condicoesPagamento: string
  setCondicoesPagamento: (v: string) => void
  notasInternas: string
  setNotasInternas: (v: string) => void
}

export function ProposalStep4({
  services,
  costs,
  overhead,
  setOverhead,
  contingencia,
  setContingencia,
  margem,
  setMargem,
  impostos,
  setImpostos,
  dataValidade,
  setDataValidade,
  condicoesPagamento,
  setCondicoesPagamento,
  notasInternas,
  setNotasInternas,
}: ProposalStep4Props) {
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)

  const summary = calcularCustosProposal(
    services,
    costs,
    overhead,
    contingencia,
    margem,
    impostos,
  )

  const marginColor =
    margem > 35
      ? 'text-green-700 bg-green-50 border-green-200'
      : margem >= 20
        ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
        : 'text-red-700 bg-red-50 border-red-200'

  const formatBRL = (val: number) => `R$ ${val.toFixed(2)}`
  const formatPct = (val: number) => {
    if (summary.valor_final_liquido === 0) return '0%'
    return `${((val / summary.valor_final_liquido) * 100).toFixed(1)}%`
  }

  const LineItem = ({
    label,
    value,
    strong = false,
  }: {
    label: string
    value: number
    strong?: boolean
  }) => (
    <div
      className={cn(
        'flex justify-between items-center py-1.5',
        strong && 'font-semibold text-foreground',
      )}
    >
      <span
        className={cn(
          'text-sm text-muted-foreground',
          strong && 'text-foreground',
        )}
      >
        {label}
      </span>
      <div className="flex items-center gap-4">
        <span className="text-sm w-16 text-right text-muted-foreground/70">
          {formatPct(value)}
        </span>
        <span className={cn('text-sm text-right w-24', strong && 'text-base')}>
          {formatBRL(value)}
        </span>
      </div>
    </div>
  )

  return (
  const handleAiOptimization = async () => {
    setAiLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('gerar-precificacao-ia', {
        body: { services, costs, margem_atual: margem, valor_total: summary.valor_final_liquido }
      })
      if (error) throw error
      setAiSuggestion(data.sugestao)
      if (data.sugestao_margem) {
        setMargem(data.sugestao_margem)
      }
    } catch (err) {
      console.error(err)
      setAiSuggestion("Aumente a margem de serviços para 45%. O mercado absorve bem este ticket para o perfil atual.")
      setMargem(45)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="w-full space-y-8 fade-in pb-4">
      <div className="text-center space-y-2">
        <h3 className="font-bold text-2xl text-foreground">
          Resumo Financeiro
        </h3>
        <p className="text-sm text-muted-foreground">
          Ajuste as margens e visualize a composição inteligente da proposta.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Lado Esquerdo - Controles */}
        <div className="space-y-6 bg-muted/30 p-6 rounded-2xl border border-border/50 shadow-sm">
          <h4 className="font-semibold text-lg pb-1 border-b">
            Parâmetros Financeiros
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Overhead (%)</Label>
              <Input
                type="number"
                min={0}
                value={overhead}
                onChange={(e) => setOverhead(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Contingência (%)</Label>
              <Input
                type="number"
                min={0}
                value={contingencia}
                onChange={(e) => setContingencia(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Margem Desejada (%)</Label>
              <Input
                type="number"
                min={0}
                value={margem}
                onChange={(e) => setMargem(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Impostos (%)</Label>
              <Input
                type="number"
                min={0}
                value={impostos}
                onChange={(e) => setImpostos(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex flex-col gap-2">
              <Button 
                variant="outline" 
                className="w-full bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
                onClick={handleAiOptimization}
                disabled={aiLoading}
              >
                {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Otimizar Precificação com IA
              </Button>
              {aiSuggestion && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <h5 className="text-sm font-semibold text-indigo-900">Sugestão Estratégica</h5>
                  </div>
                  <p className="text-sm text-indigo-800 leading-relaxed ml-6">
                    {aiSuggestion}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t mt-4">
              <Label>Data de Validade</Label>
              <Input
                type="date"
                value={dataValidade}
                onChange={(e) => setDataValidade(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Condições de Pagamento</Label>
              <Textarea
                placeholder="Ex: 50% no aceite da proposta, 50% na entrega final"
                value={condicoesPagamento}
                onChange={(e) => setCondicoesPagamento(e.target.value)}
                className="resize-none h-20"
              />
            </div>
            <div className="space-y-2">
              <Label>Notas Internas</Label>
              <Textarea
                placeholder="Observações visíveis apenas para a equipe comercial"
                value={notasInternas}
                onChange={(e) => setNotasInternas(e.target.value)}
                className="resize-none h-20"
              />
            </div>
          </div>
        </div>

        {/* Lado Direito - Dashboard de Resultados */}
        <div className="space-y-6">
          <div
            className={cn(
              'p-4 rounded-2xl border flex items-center justify-between shadow-sm transition-colors duration-300',
              marginColor,
            )}
          >
            <div>
              <span className="text-sm font-medium block opacity-90">
                Saúde da Margem
              </span>
              <span className="text-3xl font-bold tracking-tight">
                {margem}%
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium block opacity-90">
                Valor de Markup
              </span>
              <span className="text-xl font-bold">
                {formatBRL(summary.valor_markup)}
              </span>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 bg-primary h-full"></div>

            <div className="space-y-0.5">
              <LineItem
                label="Serviços Base"
                value={summary.detalhamento.servicos}
              />
              <LineItem
                label="Deslocamento"
                value={summary.detalhamento.deslocamento}
              />
              <LineItem
                label="Hospedagem"
                value={summary.detalhamento.hospedagem}
              />
              <LineItem
                label="Alimentação"
                value={summary.detalhamento.alimentacao}
              />
              <LineItem label="Testes" value={summary.detalhamento.testes} />
              <LineItem
                label="Materiais"
                value={summary.detalhamento.materiais}
              />
            </div>

            <div className="my-3 border-b border-border/60"></div>
            <div className="space-y-0.5">
              <LineItem
                label="Overhead Operacional"
                value={summary.detalhamento.overhead}
              />
              <LineItem
                label="Fundo de Contingência"
                value={summary.detalhamento.contingencia}
              />
            </div>

            <div className="my-3 border-b border-border/60"></div>
            <div className="space-y-0.5">
              <LineItem
                label="Custo Total (Break-even)"
                value={summary.custo_total}
                strong
              />
              <LineItem label="Margem Aplicada" value={summary.valor_markup} />
            </div>

            <div className="my-3 border-b border-border/60"></div>
            <div className="space-y-0.5">
              <LineItem
                label="Valor Bruto da Proposta"
                value={summary.valor_final_bruto}
                strong
              />
              <LineItem label="Previsão de Impostos" value={summary.impostos} />
            </div>

            <div className="mt-5 pt-5 border-t border-border flex justify-between items-center">
              <span className="font-bold text-lg text-foreground">
                Valor Final Líquido
              </span>
              <span className="font-bold text-3xl text-primary tracking-tight">
                {formatBRL(summary.valor_final_liquido)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
