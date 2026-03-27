import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { FinancialSummary } from './proposal-types'
import { cn } from '@/lib/utils'

interface Props {
  summary: FinancialSummary
  items: any[]
  costs: any[]
}

export function ResumoFinanceiro({ summary, items }: Props) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v || 0)

  const mc = (m: number) =>
    m > 35 ? 'text-green-600' : m >= 20 ? 'text-yellow-600' : 'text-red-600'

  const margem_bruta_pct =
    summary.valor_final_bruto > 0
      ? (summary.valor_markup / summary.valor_final_bruto) * 100
      : 0
  const lucro_liquido =
    summary.valor_final_liquido - summary.custo_total - summary.impostos
  const margem_liquida_pct =
    summary.valor_final_liquido > 0
      ? (lucro_liquido / summary.valor_final_liquido) * 100
      : 0
  const ticket_medio =
    items.length > 0 ? summary.valor_final_liquido / items.length : 0

  const Row = ({ label, value, tooltip, isBold, colorClass, isPct }: any) => (
    <div
      className={cn(
        'flex justify-between items-center py-1',
        isBold && 'font-bold border-t mt-2 pt-2',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {label}
        </span>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <span className={cn('text-sm font-medium', colorClass)}>
        {isPct ? `${value.toFixed(1)}%` : fmt(value)}
      </span>
    </div>
  )

  const Section = ({ title, children }: any) => (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-500 border-b pb-1 mb-2">
        {title}
      </h3>
      {children}
    </div>
  )

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="bg-gray-50/50 border-b pb-4">
        <CardTitle className="text-lg">Resumo Financeiro Detalhado</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-6">
            <Section title="Custos Operacionais">
              <Row
                label="Deslocamento"
                value={summary.detalhamento.deslocamento}
              />
              <Row label="Hospedagem" value={summary.detalhamento.hospedagem} />
              <Row
                label="Alimentação"
                value={summary.detalhamento.alimentacao}
              />
              <Row label="Testes" value={summary.detalhamento.testes} />
              <Row label="Materiais" value={summary.detalhamento.materiais} />
              <Row
                label="Subtotal Operacional"
                value={summary.total_custos_operacionais}
                isBold
              />
            </Section>

            <Section title="Serviços Profissionais">
              <Row
                label="Total Serviços"
                value={summary.total_servicos}
                tooltip="Soma de todos os serviços prestados"
              />
            </Section>

            <Section title="Custos Indiretos">
              <Row
                label="Overhead (15%)"
                value={summary.detalhamento.overhead}
                tooltip="Custos fixos do negócio diluídos"
              />
              <Row
                label="Contingência (5%)"
                value={summary.detalhamento.contingencia}
                tooltip="Margem de segurança para imprevistos"
              />
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Margem e Precificação">
              <Row label="Custo Total" value={summary.custo_total} isBold />
              <Row
                label={`Margem (${summary.margem_percentual}%)`}
                value={summary.valor_markup}
                colorClass={mc(summary.margem_percentual)}
                tooltip="Lucro bruto desejado sobre os custos"
              />
              <Row label="Valor Bruto" value={summary.valor_final_bruto} />
            </Section>

            <Section title="Impostos e Valor Final">
              <Row
                label="Impostos Estimados"
                value={summary.impostos}
                tooltip="Provisão para impostos sobre o faturamento"
              />
              <Row
                label="Valor Final Líquido"
                value={summary.valor_final_liquido}
                isBold
                colorClass="text-primary text-lg"
              />
            </Section>

            <Section title="Análise de Rentabilidade">
              <Row
                label="Margem Bruta %"
                value={margem_bruta_pct}
                isPct
                tooltip="Representatividade do markup no valor bruto"
              />
              <Row
                label="Margem Líquida %"
                value={margem_liquida_pct}
                isPct
                tooltip="Lucro real livre de custos e impostos"
              />
              <Row
                label="Ticket Médio/Serviço"
                value={ticket_medio}
                tooltip="Valor médio por item de serviço"
              />
            </Section>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
