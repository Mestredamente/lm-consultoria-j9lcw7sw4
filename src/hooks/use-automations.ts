import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export interface FluxoAutomacao {
  id: string
  nome: string
  gatilho: string
  acao: string
  empresa_id: string | null
  ativo: boolean
  detalhes_acao: any
  created_at: string
}

export interface LogExecucaoAutomacao {
  id: string
  fluxo_id: string
  usuario_id: string
  status: string
  detalhes: any
  created_at: string
  fluxos_automacao?: { nome: string }
}

export function useAutomations() {
  const [automations, setAutomations] = useState<FluxoAutomacao[]>([])
  const [logs, setLogs] = useState<LogExecucaoAutomacao[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchAutomations = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('fluxos_automacao')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAutomations(data as FluxoAutomacao[])
    }
    setLoading(false)
  }, [user])

  const fetchLogs = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('logs_execucao_automacao')
      .select('*, fluxos_automacao(nome)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setLogs(data as any[])
    }
  }, [user])

  useEffect(() => {
    fetchAutomations()
    fetchLogs()
  }, [fetchAutomations, fetchLogs])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('public:automacoes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fluxos_automacao' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAutomations((prev) => {
              if (prev.some((a) => a.id === payload.new.id)) return prev
              return [payload.new as FluxoAutomacao, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            setAutomations((prev) =>
              prev.map((a) =>
                a.id === payload.new.id ? { ...a, ...payload.new } : a,
              ),
            )
          } else if (payload.eventType === 'DELETE') {
            setAutomations((prev) =>
              prev.filter((a) => a.id !== payload.old.id),
            )
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'logs_execucao_automacao' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLogs((prev) => {
              if (prev.some((l) => l.id === payload.new.id)) return prev
              return [payload.new as any, ...prev]
            })

            setTimeout(() => {
              supabase
                .from('logs_execucao_automacao')
                .select('*, fluxos_automacao(nome)')
                .eq('id', payload.new.id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setLogs((prev) =>
                      prev.map((l) => (l.id === data.id ? (data as any) : l)),
                    )
                  }
                })
            }, 0)
          } else if (payload.eventType === 'UPDATE') {
            setLogs((prev) =>
              prev.map((l) =>
                l.id === payload.new.id ? { ...l, ...payload.new } : l,
              ),
            )
          } else if (payload.eventType === 'DELETE') {
            setLogs((prev) => prev.filter((l) => l.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const addAutomation = async (automation: Partial<FluxoAutomacao>) => {
    if (!user) return { error: 'Not authenticated' }
    const { data, error } = await supabase
      .from('fluxos_automacao')
      .insert({ ...automation, usuario_id: user.id })
      .select()
      .single()

    if (!error && data) {
      setAutomations((prev) => [data as FluxoAutomacao, ...prev])
    }
    return { data, error }
  }

  const updateAutomation = async (
    id: string,
    updates: Partial<FluxoAutomacao>,
  ) => {
    if (!user) return { error: 'Not authenticated' }
    const { error } = await supabase
      .from('fluxos_automacao')
      .update(updates)
      .eq('id', id)
      .eq('usuario_id', user.id)

    if (!error) {
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      )
    }
    return { error }
  }

  const deleteAutomation = async (id: string) => {
    if (!user) return { error: 'Not authenticated' }
    const { error } = await supabase
      .from('fluxos_automacao')
      .delete()
      .eq('id', id)
      .eq('usuario_id', user.id)

    if (!error) {
      setAutomations((prev) => prev.filter((a) => a.id !== id))
    }
    return { error }
  }

  return {
    automations,
    logs,
    loading,
    addAutomation,
    updateAutomation,
    deleteAutomation,
    fetchAutomations,
    fetchLogs,
  }
}
