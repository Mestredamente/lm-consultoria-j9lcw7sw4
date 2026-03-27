import { ServiceRow, CostItem, getCostSubtotal } from './proposal-types'

export function ProposalStep4({
  services,
  costs,
}: {
  services: ServiceRow[]
  costs: CostItem[]
}) {
  const totalServices = services
    .filter((s) => s.checked)
    .reduce((acc, s) => acc + s.quantidade * s.valor_unitario, 0)
  const totalCosts = costs.reduce((acc, c) => acc + getCostSubtotal(c), 0)
  const finalValue = totalServices + totalCosts

  return (
    <div className="max-w-md mx-auto py-8 space-y-8 fade-in">
      <div className="text-center space-y-2">
        <h3 className="font-bold text-2xl text-foreground">
          Resumo do Orçamento
        </h3>
        <p className="text-sm text-muted-foreground">
          Confira a composição final dos valores da sua proposta antes de
          salvar.
        </p>
      </div>

      <div className="space-y-4 bg-muted/20 p-6 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 bg-primary h-full"></div>

        <div className="flex justify-between items-center pb-3 border-b border-border/50">
          <span className="text-sm text-muted-foreground font-medium">
            Total de Serviços
          </span>
          <span className="font-semibold text-foreground">
            R$ {totalServices.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center pb-3 border-b border-border/50">
          <span className="text-sm text-muted-foreground font-medium">
            Total de Custos
          </span>
          <span className="font-semibold text-foreground">
            R$ {totalCosts.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="font-bold text-lg text-foreground">Valor Final</span>
          <span className="font-bold text-3xl text-primary tracking-tight">
            R$ {finalValue.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}
