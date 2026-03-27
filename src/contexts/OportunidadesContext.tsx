import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export type EstagioOportunidade =
  | 'Prospecção'
  | 'Qualificação'
  | 'Proposta'
  | 'Negociação'
  | 'Fechamento'
  | 'Ganho'
  | 'Perdido'

export interface Oportunidade {
  id: string
  nome: string
  empresa_id: string | null
  contato_id: string | null
  valor_estimado: number | null
  data_fechamento_prevista: string | null
  probabilidade_percentual: number | null
  estagio: EstagioOportunidade
  responsavel_id: string
  descricao: string | null
  created_at: string
  updated_at: string
  empresas?: { nome: string } | null
  contatos?: { nome: string } | null
}

interface OportunidadesContextType {
  oportunidades: Oportunidade[]
  loading: boolean
  error: string | null
  addOportunidade: (data: Partial<Oportunidade>) => Promise<void>
  updateOportunidade: (id: string, data: Partial<Oportunidade>) => Promise<void>
  deleteOportunidade: (id: string) => Promise<void>
  refreshOportunidades: () => Promise<void>
}

const OportunidadesContext = createContext<
  OportunidadesContextType | undefined
>(undefined)

export function OportunidadesProvider({ children }: { children: ReactNode }) {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchOportunidades = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('oportunidades')
        .select(
          `
          *,
          empresas (nome),
          contatos (nome)
        `,
        )
        .eq('responsavel_id', user.id)
        .order('created_at', { ascending: false })

      if (err) throw err
      if (data) setOportunidades(data as any)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchOportunidades()
    } else {
      setOportunidades([])
      setLoading(false)
    }
  }, [user, fetchOportunidades])

  const addOportunidade = async (data: Partial<Oportunidade>) => {
    if (!user) throw new Error('Usuário não autenticado')
    const { data: novaOportunidade, error: err } = await supabase
      .from('oportunidades')
      .insert({
        ...data,
        responsavel_id: user.id,
      })
      .select(
        `
        *,
        empresas (nome),
        contatos (nome)
      `,
      )
      .single()

    if (err) throw err
    if (novaOportunidade) {
      setOportunidades((prev) => [novaOportunidade as any, ...prev])
    }
  }

  const updateOportunidade = async (
    id: string,
    data: Partial<Oportunidade>,
  ) => {
    if (!user) throw new Error('Usuário não autenticado')

    // Removing joined fields if passed in data
    const { empresas, contatos, ...updateData } = data as any

    const { data: updatedOportunidade, error: err } = await supabase
      .from('oportunidades')
      .update(updateData)
      .eq('id', id)
      .eq('responsavel_id', user.id)
      .select(
        `
        *,
        empresas (nome),
        contatos (nome)
      `,
      )
      .single()

    if (err) throw err

    if (updatedOportunidade) {
      setOportunidades((prev) =>
        prev.map((op) => (op.id === id ? (updatedOportunidade as any) : op)),
      )
    }
  }

  const deleteOportunidade = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado')
    const { error: err } = await supabase
      .from('oportunidades')
      .delete()
      .eq('id', id)
      .eq('responsavel_id', user.id)

    if (err) throw err
    setOportunidades((prev) => prev.filter((op) => op.id !== id))
  }

  return (
    <OportunidadesContext.Provider
      value={{
        oportunidades,
        loading,
        error,
        addOportunidade,
        updateOportunidade,
        deleteOportunidade,
        refreshOportunidades: fetchOportunidades,
      }}
    >
      {children}
    </OportunidadesContext.Provider>
  )
}

export function useOportunidades() {
  const context = useContext(OportunidadesContext)
  if (!context)
    throw new Error(
      'useOportunidades must be used within OportunidadesProvider',
    )
  return context
}
