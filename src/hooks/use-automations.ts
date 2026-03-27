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

export function useAutomations() {
  const [automations, setAutomations] = useState<FluxoAutomacao[]>([])
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

  useEffect(() => {
    fetchAutomations()
  }, [fetchAutomations])

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
    loading,
    addAutomation,
    updateAutomation,
    deleteAutomation,
    fetchAutomations,
  }
}
