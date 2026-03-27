export interface ServiceRow {
  id: string
  tipo: string
  descricao: string
  quantidade: number
  valor_unitario: number
  checked: boolean
  isCustom?: boolean
}

export type CostCategory =
  | 'Deslocamento'
  | 'Hospedagem'
  | 'Alimentação'
  | 'Testes Psicológicos'
  | 'Materiais'

export interface CostItem {
  id: string
  type: CostCategory
  origem?: string
  destino?: string
  valor_passagem?: number
  transporte_local?: number
  num_noites?: number
  valor_diaria?: number
  num_dias?: number
  valor_dia?: number
  tipo_teste?: string
  num_participantes?: number
  valor_unitario?: number
  descricao?: string
  quantidade?: number
}

export const TIPOS_SERVICO = [
  'Consultoria Estratégica',
  'Treinamento Corporativo',
  'Coaching Executivo para empresários e líderes',
  'Diagnóstico Organizacional',
  'Palestra/Workshop',
  'Desenvolvimento de líderes e equipe',
  'Avaliação de Desempenho e feedback',
  'Sucessão familiar',
  'Seleção de vagas estratégicas',
  'Mapeamento e fortalecimento da cultura',
  'Indicadores de RH',
  'Onboarding e trilha do colaborador',
  'Endomarketing',
  'Implantação de processo e procedimetnos de RH',
  'Gestão de admissão e desligamento',
  'Descrição de cargos e remuneração',
  'Compliance trabalhista',
]

export const COST_CATEGORIES: CostCategory[] = [
  'Deslocamento',
  'Hospedagem',
  'Alimentação',
  'Testes Psicológicos',
  'Materiais',
]

export const MOCK_CIDADES = [
  'São Paulo - SP',
  'Rio de Janeiro - RJ',
  'Belo Horizonte - MG',
  'Curitiba - PR',
  'Porto Alegre - RS',
  'Brasília - DF',
  'Salvador - BA',
  'Fortaleza - CE',
  'Recife - PE',
  'Manaus - AM',
]

export const MOCK_TESTES = [
  'Palográfico',
  'Quati',
  'BFP',
  'Atenção Concentrada',
  'DISC',
  'G-36',
]

export const MOCK_EMPRESAS = [
  { id: '1', nome: 'Tech Solutions SA' },
  { id: '2', nome: 'Indústria Global' },
]

export const MOCK_CONTATOS = [
  { id: '1', empresa_id: '1', nome: 'João Silva' },
  { id: '2', empresa_id: '2', nome: 'Carlos Souza' },
]

export const MOCK_OPORTUNIDADES = [
  { id: '1', empresa_id: '1', nome: 'Transformação Digital 2026' },
]

export function getCostSubtotal(c: CostItem) {
  switch (c.type) {
    case 'Deslocamento':
      return (c.valor_passagem || 0) + (c.transporte_local || 0)
    case 'Hospedagem':
      return (c.num_noites || 0) * (c.valor_diaria || 0)
    case 'Alimentação':
      return (c.num_dias || 0) * (c.valor_dia || 0)
    case 'Testes Psicológicos':
      return (c.num_participantes || 0) * (c.valor_unitario || 0)
    case 'Materiais':
      return (c.quantidade || 0) * (c.valor_unitario || 0)
    default:
      return 0
  }
}

export interface FinancialSummary {
  detalhamento: {
    servicos: number
    deslocamento: number
    hospedagem: number
    alimentacao: number
    testes: number
    materiais: number
    overhead: number
    contingencia: number
  }
  total_servicos: number
  total_custos_operacionais: number
  custo_total: number
  margem_percentual: number
  valor_markup: number
  valor_final_bruto: number
  impostos: number
  valor_final_liquido: number
  custos_indiretos: number
  valor_contingencia: number
}

export function calcularCustosProposal(
  services: ServiceRow[],
  costs: CostItem[],
  overheadPercent: number = 15,
  contingencyPercent: number = 5,
  marginPercent: number = 40,
  taxPercent: number = 15,
): FinancialSummary {
  const total_servicos = services
    .filter((s) => s.checked)
    .reduce((acc, s) => acc + s.quantidade * s.valor_unitario, 0)

  let deslocamento = 0
  let hospedagem = 0
  let alimentacao = 0
  let testes = 0
  let materiais = 0

  costs.forEach((c) => {
    const sub = getCostSubtotal(c)
    switch (c.type) {
      case 'Deslocamento':
        deslocamento += sub
        break
      case 'Hospedagem':
        hospedagem += sub
        break
      case 'Alimentação':
        alimentacao += sub
        break
      case 'Testes Psicológicos':
        testes += sub
        break
      case 'Materiais':
        materiais += sub
        break
    }
  })

  const total_custos_operacionais =
    deslocamento + hospedagem + alimentacao + testes + materiais
  const custo_base = total_servicos + total_custos_operacionais

  const custos_indiretos = custo_base * (overheadPercent / 100)
  const valor_contingencia =
    (custo_base + custos_indiretos) * (contingencyPercent / 100)

  const custo_total = custo_base + custos_indiretos + valor_contingencia

  const valor_markup = custo_total * (marginPercent / 100)
  const valor_final_bruto = custo_total + valor_markup
  const impostos = valor_final_bruto * (taxPercent / 100)
  const valor_final_liquido = valor_final_bruto + impostos

  return {
    detalhamento: {
      servicos: total_servicos,
      deslocamento,
      hospedagem,
      alimentacao,
      testes,
      materiais,
      overhead: custos_indiretos,
      contingencia: valor_contingencia,
    },
    total_servicos,
    total_custos_operacionais,
    custo_total,
    margem_percentual: marginPercent,
    valor_markup,
    valor_final_bruto,
    impostos,
    valor_final_liquido,
    custos_indiretos,
    valor_contingencia,
  }
}
