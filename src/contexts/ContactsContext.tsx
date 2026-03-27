import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface Contact {
  id: string
  name: string
  position: string
  email: string
  phone: string
  companyId: string
  linkedin?: string
  notes?: string
}

interface ContactsContextType {
  contacts: Contact[]
  addContact: (contact: Omit<Contact, 'id'>) => void
  updateContact: (id: string, contact: Omit<Contact, 'id'>) => void
  deleteContact: (id: string) => void
}

const ContactsContext = createContext<ContactsContextType | undefined>(
  undefined,
)

const initialContacts: Contact[] = [
  {
    id: '1',
    name: 'Roberto Silva',
    position: 'CTO',
    email: 'roberto@techinovacoes.com.br',
    phone: '(11) 99999-1234',
    companyId: '1',
    linkedin: 'https://linkedin.com/in/robertosilva',
    notes: 'Decisor principal para infraestrutura.',
  },
  {
    id: '2',
    name: 'Ana Souza',
    position: 'Diretora de Operações',
    email: 'ana@logglobal.br',
    phone: '(19) 98888-5678',
    companyId: '2',
    linkedin: 'https://linkedin.com/in/anasouza',
    notes: 'Responsável pela expansão regional.',
  },
]

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)

  const addContact = (contactData: Omit<Contact, 'id'>) => {
    const newContact: Contact = {
      ...contactData,
      id: Math.random().toString(36).substring(2, 9),
    }
    setContacts((prev) => [newContact, ...prev])
  }

  const updateContact = (id: string, data: Omit<Contact, 'id'>) => {
    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === id ? { ...contact, ...data } : contact,
      ),
    )
  }

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((contact) => contact.id !== id))
  }

  return (
    <ContactsContext.Provider
      value={{ contacts, addContact, updateContact, deleteContact }}
    >
      {children}
    </ContactsContext.Provider>
  )
}

export function useContacts() {
  const context = useContext(ContactsContext)
  if (context === undefined) {
    throw new Error('useContacts must be used within a ContactsProvider')
  }
  return context
}
