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
