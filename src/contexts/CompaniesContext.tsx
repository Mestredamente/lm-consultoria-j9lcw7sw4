import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
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
}

interface CompaniesContextType {
  companies: Company[]
  addCompany: (company: Omit<Company, 'id'>) => Promise<void>
  updateCompany: (id: string, data: Omit<Company, 'id'>) => Promise<void>
  deleteCompany: (id: string) => Promise<void>
  loading: boolean
}

const CompaniesContext = createContext<CompaniesContextType | undefined>(
  undefined,
)

export function CompaniesProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchCompanies()
    } else {
      setCompanies([])
      setLoading(false)
    }
  }, [user])

  const fetchCompanies = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
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
        })),
      )
    }
    setLoading(false)
  }

  const addCompany = async (companyData: Omit<Company, 'id'>) => {
    if (!user) return
    const { data, error } = await supabase
      .from('empresas')
      .insert({
        usuario_id: user.id,
        nome: companyData.name,
        cnpj: companyData.cnpj,
        setor: companyData.industry,
        endereco: companyData.address,
        website: companyData.website,
        num_funcionarios: companyData.employees,
        email: companyData.email,
        telefone: companyData.phone,
      })
      .select()
      .single()

    if (!error && data) {
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
        },
        ...prev,
      ])
    }
  }

  const updateCompany = async (id: string, data: Omit<Company, 'id'>) => {
    const { error } = await supabase
      .from('empresas')
      .update({
        nome: data.name,
        cnpj: data.cnpj,
        setor: data.industry,
        endereco: data.address,
        website: data.website,
        num_funcionarios: data.employees,
        email: data.email,
        telefone: data.phone,
      })
      .eq('id', id)

    if (!error) {
      setCompanies((prev) =>
        prev.map((company) =>
          company.id === id ? { ...company, ...data } : company,
        ),
      )
    }
  }

  const deleteCompany = async (id: string) => {
    const { error } = await supabase.from('empresas').delete().eq('id', id)

    if (!error) {
      setCompanies((prev) => prev.filter((company) => company.id !== id))
    }
  }

  return (
    <CompaniesContext.Provider
      value={{ companies, addCompany, updateCompany, deleteCompany, loading }}
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
