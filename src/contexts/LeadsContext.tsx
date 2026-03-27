import React, { createContext, useContext, useState, ReactNode } from 'react'

export type LeadStatus =
  | 'Novo'
  | 'Qualificado'
  | 'Em Negociação'
  | 'Perdido'
  | 'Ganho'

export interface Lead {
  id: string
  company: string
  contact: string
  email: string
  phone: string
  segment: string
  size: string
  source: string
  status: LeadStatus
  createdAt: Date
}

interface LeadsContextType {
  leads: Lead[]
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void
  updateLeadStatus: (id: string, status: LeadStatus) => void
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined)

const initialLeads: Lead[] = [
  {
    id: '1',
    company: 'TechSolutions Ltd',
    contact: 'Roberto Silva',
    email: 'roberto@techsolutions.com',
    phone: '(11) 99999-1234',
    segment: 'Tecnologia',
    size: '51-200',
    source: 'LinkedIn',
    status: 'Novo',
    createdAt: new Date('2023-10-01'),
  },
  {
    id: '2',
    company: 'Varejo Express',
    contact: 'Ana Souza',
    email: 'ana@varejoexpress.com.br',
    phone: '(21) 98888-5678',
    segment: 'Varejo',
    size: '201+',
    source: 'Indicação',
    status: 'Qualificado',
    createdAt: new Date('2023-10-03'),
  },
  {
    id: '3',
    company: 'Indústrias Metal',
    contact: 'Carlos Oliveira',
    email: 'carlos@indmetal.com',
    phone: '(31) 97777-4321',
    segment: 'Indústria',
    size: '11-50',
    source: 'Site',
    status: 'Em Negociação',
    createdAt: new Date('2023-10-05'),
  },
]

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)

  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    }
    setLeads((prev) => [newLead, ...prev])
  }

  const updateLeadStatus = (id: string, status: LeadStatus) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, status } : lead)),
    )
  }

  return (
    <LeadsContext.Provider value={{ leads, addLead, updateLeadStatus }}>
      {children}
    </LeadsContext.Provider>
  )
}

export function useLeads() {
  const context = useContext(LeadsContext)
  if (context === undefined) {
    throw new Error('useLeads must be used within a LeadsProvider')
  }
  return context
}
