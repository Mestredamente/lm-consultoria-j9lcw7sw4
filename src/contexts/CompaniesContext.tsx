import React, { createContext, useContext, useState, ReactNode } from 'react'

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
  addCompany: (company: Omit<Company, 'id'>) => void
  updateCompany: (id: string, data: Omit<Company, 'id'>) => void
  deleteCompany: (id: string) => void
}

const CompaniesContext = createContext<CompaniesContextType | undefined>(
  undefined,
)

const initialCompanies: Company[] = [
  {
    id: '1',
    name: 'Tech Inovações S.A.',
    cnpj: '12.345.678/0001-99',
    industry: 'Tecnologia',
    address: 'Av. Paulista, 1000 - São Paulo',
    website: 'https://techinovacoes.com.br',
    employees: 150,
    email: 'contato@techinovacoes.com.br',
    phone: '(11) 4002-8922',
  },
  {
    id: '2',
    name: 'Logística Global Brasil',
    cnpj: '98.765.432/0001-11',
    industry: 'Logística',
    address: 'Rodovia Anhanguera, km 15 - Campinas',
    website: 'https://logglobal.br',
    employees: 450,
    email: 'comercial@logglobal.br',
    phone: '(19) 3333-4444',
  },
]

export function CompaniesProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies)

  const addCompany = (companyData: Omit<Company, 'id'>) => {
    const newCompany: Company = {
      ...companyData,
      id: Math.random().toString(36).substring(2, 9),
    }
    setCompanies((prev) => [newCompany, ...prev])
  }

  const updateCompany = (id: string, data: Omit<Company, 'id'>) => {
    setCompanies((prev) =>
      prev.map((company) =>
        company.id === id ? { ...company, ...data } : company,
      ),
    )
  }

  const deleteCompany = (id: string) => {
    setCompanies((prev) => prev.filter((company) => company.id !== id))
  }

  return (
    <CompaniesContext.Provider
      value={{ companies, addCompany, updateCompany, deleteCompany }}
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
