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

export type TipoAtividade =
  | 'Ligação'
  | 'Email'
  | 'Reunião'
  | 'Tarefa Interna'
  | 'Acompanhamento'
export type StatusAtividade = 'Agendada' | 'Concluída' | 'Cancelada'

export interface Atividade {
  id: string
  tipo: TipoAtividade
  titulo: string
  descricao: string | null
  data_agendada: string | null
  data_conclusao: string | null
  status: StatusAtividade
  empresa_id: string | null
  contato_id: string | null
  oportunidade_id: string | null
  responsavel_id: string
}

export interface Usuario {
  id: string
  nome: string | null
  email: string | null
}

interface ActivitiesContextType {
  activities: Atividade[]
  usuarios: Usuario[]
  loading: boolean
  error: string | null
  addActivity: (activity: Omit<Atividade, 'id'>) => Promise<void>
  updateActivity: (id: string, activity: Partial<Atividade>) => Promise<void>
  deleteActivity: (id: string) => Promise<void>
  refreshActivities: () => Promise<void>
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(
  undefined,
)

export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Atividade[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, role } = useAuth()

  const fetchActivities = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('atividades')
        .select('*')
        .order('data_agendada', { ascending: true })

      if (role === 'vendedor') {
        query = query.eq('responsavel_id', user.id)
      }

      const [
        { data: actData, error: actErr },
        { data: usrData, error: usrErr },
      ] = await Promise.all([
        query,
        supabase.from('usuarios').select('id, nome, email'),
      ])

      if (actErr) throw actErr
      if (usrErr) throw usrErr

      if (actData) setActivities(actData as Atividade[])
      if (usrData) setUsuarios(usrData as Usuario[])
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, role])

  useEffect(() => {
    if (user) {
      fetchActivities()
    } else {
      setActivities([])
      setUsuarios([])
      setLoading(false)
    }
  }, [user, fetchActivities])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('public:atividades')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'atividades' },
        (payload) => {
          if (
            role === 'vendedor' &&
            payload.new &&
            payload.new.responsavel_id !== user.id
          )
            return

          if (payload.eventType === 'INSERT') {
            setActivities((prev) => {
              if (prev.some((a) => a.id === payload.new.id)) return prev
              return [...prev, payload.new as Atividade]
            })
            setTimeout(() => {
              setActivities((prev) =>
                [...prev].sort((a, b) => {
                  const dateA = a.data_agendada
                    ? new Date(a.data_agendada).getTime()
                    : Infinity
                  const dateB = b.data_agendada
                    ? new Date(b.data_agendada).getTime()
                    : Infinity
                  return dateA - dateB
                }),
              )
            }, 0)
          } else if (payload.eventType === 'UPDATE') {
            setActivities((prev) =>
              prev.map((a) =>
                a.id === payload.new.id
                  ? ({ ...a, ...payload.new } as Atividade)
                  : a,
              ),
            )
            setTimeout(() => {
              setActivities((prev) =>
                [...prev].sort((a, b) => {
                  const dateA = a.data_agendada
                    ? new Date(a.data_agendada).getTime()
                    : Infinity
                  const dateB = b.data_agendada
                    ? new Date(b.data_agendada).getTime()
                    : Infinity
                  return dateA - dateB
                }),
              )
            }, 0)
          } else if (payload.eventType === 'DELETE') {
            setActivities((prev) => prev.filter((a) => a.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, role])

  const addActivity = async (activity: Omit<Atividade, 'id'>) => {
    const { data, error: err } = await supabase
      .from('atividades')
      .insert(activity)
      .select()
      .single()
    if (err) throw err
    if (data) setActivities((prev) => [...prev, data as Atividade])
  }

  const updateActivity = async (id: string, activity: Partial<Atividade>) => {
    let query = supabase.from('atividades').update(activity).eq('id', id)

    if (role === 'vendedor') {
      query = query.eq('responsavel_id', user!.id)
    }

    const { data, error: err } = await query.select().single()
    if (err) throw err
    if (data)
      setActivities((prev) =>
        prev.map((a) => (a.id === id ? (data as Atividade) : a)),
      )
  }

  const deleteActivity = async (id: string) => {
    let query = supabase.from('atividades').delete().eq('id', id)

    if (role === 'vendedor') {
      query = query.eq('responsavel_id', user!.id)
    }

    const { error: err } = await query
    if (err) throw err
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <ActivitiesContext.Provider
      value={{
        activities,
        usuarios,
        loading,
        error,
        addActivity,
        updateActivity,
        deleteActivity,
        refreshActivities: fetchActivities,
      }}
    >
      {children}
    </ActivitiesContext.Provider>
  )
}

export const useActivities = () => {
  const context = useContext(ActivitiesContext)
  if (!context)
    throw new Error('useActivities must be used within ActivitiesProvider')
  return context
}

export const getActivityColor = (tipo: string) => {
  switch (tipo) {
    case 'Ligação':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Email':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Reunião':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'Tarefa Interna':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'Acompanhamento':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}
