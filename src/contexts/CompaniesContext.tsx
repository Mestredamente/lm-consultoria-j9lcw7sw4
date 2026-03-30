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

export interface Company {
  id: string
  name: string
  cnpj: string
  industry: string
  address: string
  website: string
  employees: number
  email: string
  phone: string
  createdAt: string
}

interface CompaniesContextType {
  companies: Company[]
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => Promise<void>
  updateCompany: (
    id: string,
    data: Omit<Company, 'id' | 'createdAt'>,
  ) => Promise<void>
  deleteCompany: (id: string) => Promise<void>
  refreshCompanies: () => Promise<void>
  loading: boolean
  error: string | null
}

const CompaniesContext = createContext<CompaniesContextType | undefined>(
  undefined,
)

export function CompaniesProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, role } = useAuth()

  const fetchCompanies = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false })

      if (role === 'vendedor') {
        query = query.eq('usuario_id', user.id)
      }

      const { data, error: err } = await query

      if (err) throw err

      if (data) {
        setCompanies(
          data.map((d) => ({
            id: d.id,
            name: d.nome,
            cnpj: d.cnpj || '',
            industry: d.setor || '',
            address: d.endereco || '',
            website: d.website || '',
            employees: d.num_funcionarios || 0,
            email: d.email || '',
            phone: d.telefone || '',
            createdAt: d.created_at || new Date().toISOString(),
          })),
        )
      }
    } catch (err: any) {
      console.error('Error fetching companies:', err)
      setError(err.message || 'Falha ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }, [user, role])

  useEffect(() => {
    if (user) {
      fetchCompanies()
    } else {
      setCompanies([])
      setLoading(false)
    }
  }, [user, fetchCompanies])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('public:empresas')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'empresas' },
        (payload) => {
          if (
            role === 'vendedor' &&
            payload.new &&
            payload.new.usuario_id !== user.id
          )
            return

          if (payload.eventType === 'INSERT') {
            setCompanies((prev) => {
              if (prev.some((c) => c.id === payload.new.id)) return prev
              return [
                {
                  id: payload.new.id,
                  name: payload.new.nome,
                  cnpj: payload.new.cnpj || '',
                  industry: payload.new.setor || '',
                  address: payload.new.endereco || '',
                  website: payload.new.website || '',
                  employees: payload.new.num_funcionarios || 0,
                  email: payload.new.email || '',
                  phone: payload.new.telefone || '',
                  createdAt: payload.new.created_at || new Date().toISOString(),
                },
                ...prev,
              ]
            })
          } else if (payload.eventType === 'UPDATE') {
            setCompanies((prev) =>
              prev.map((c) =>
                c.id === payload.new.id
                  ? {
                      ...c,
                      name: payload.new.nome,
                      cnpj: payload.new.cnpj || '',
                      industry: payload.new.setor || '',
                      address: payload.new.endereco || '',
                      website: payload.new.website || '',
                      employees: payload.new.num_funcionarios || 0,
                      email: payload.new.email || '',
                      phone: payload.new.telefone || '',
                    }
                  : c,
              ),
            )
          } else if (payload.eventType === 'DELETE') {
            setCompanies((prev) => prev.filter((c) => c.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, role])

  const addCompany = async (companyData: Omit<Company, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('Usuário não autenticado')

    const { data, error: err } = await supabase
      .from('empresas')
      .insert({
        usuario_id: user.id,
        nome: companyData.name,
        cnpj: companyData.cnpj || null,
        setor: companyData.industry || null,
        endereco: companyData.address || null,
        website: companyData.website || null,
        num_funcionarios: companyData.employees || 0,
        email: companyData.email || null,
        telefone: companyData.phone || null,
      })
      .select()
      .single()

    if (err) throw err

    if (data) {
      setCompanies((prev) => [
        {
          id: data.id,
          name: data.nome,
          cnpj: data.cnpj || '',
          industry: data.setor || '',
          address: data.endereco || '',
          website: data.website || '',
          employees: data.num_funcionarios || 0,
          email: data.email || '',
          phone: data.telefone || '',
          createdAt: data.created_at || new Date().toISOString(),
        },
        ...prev,
      ])
    }
  }

  const updateCompany = async (
    id: string,
    data: Omit<Company, 'id' | 'createdAt'>,
  ) => {
    if (!user) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('empresas')
      .update({
        nome: data.name,
        cnpj: data.cnpj || null,
        setor: data.industry || null,
        endereco: data.address || null,
        website: data.website || null,
        num_funcionarios: data.employees || 0,
        email: data.email || null,
        telefone: data.phone || null,
      })
      .eq('id', id)

    if (role === 'vendedor') {
      query = query.eq('usuario_id', user.id)
    }

    const { error: err } = await query

    if (err) throw err

    setCompanies((prev) =>
      prev.map((company) =>
        company.id === id ? { ...company, ...data } : company,
      ),
    )
  }

  const deleteCompany = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado')

    let query = supabase.from('empresas').delete().eq('id', id)

    if (role === 'vendedor') {
      query = query.eq('usuario_id', user.id)
    }

    const { error: err } = await query

    if (err) throw err

    setCompanies((prev) => prev.filter((company) => company.id !== id))
  }

  return (
    <CompaniesContext.Provider
      value={{
        companies,
        addCompany,
        updateCompany,
        deleteCompany,
        refreshCompanies: fetchCompanies,
        loading,
        error,
      }}
    >
      {children}
    </CompaniesContext.Provider>
  )
}

export function useCompanies() {
  const context = useContext(CompaniesContext)
  if (context === undefined) {
    throw new Error('useCompanies must be used within a CompaniesProvider')
  }
  return context
}
