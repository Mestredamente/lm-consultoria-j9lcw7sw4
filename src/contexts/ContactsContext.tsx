import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

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
  addContact: (contact: Omit<Contact, 'id'>) => Promise<void>
  updateContact: (id: string, contact: Omit<Contact, 'id'>) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  loading: boolean
}

const ContactsContext = createContext<ContactsContextType | undefined>(
  undefined,
)

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchContacts()
    } else {
      setContacts([])
      setLoading(false)
    }
  }, [user])

  const fetchContacts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('contatos')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setContacts(
        data.map((d) => ({
          id: d.id,
          name: d.nome,
          position: d.cargo || '',
          email: d.email || '',
          phone: d.telefone || '',
          companyId: d.empresa_id || '',
          linkedin: d.linkedin || '',
          notes: d.notas || '',
        })),
      )
    }
    setLoading(false)
  }

  const addContact = async (contactData: Omit<Contact, 'id'>) => {
    if (!user) return
    const { data, error } = await supabase
      .from('contatos')
      .insert({
        usuario_id: user.id,
        nome: contactData.name,
        cargo: contactData.position,
        email: contactData.email,
        telefone: contactData.phone,
        empresa_id: contactData.companyId,
        linkedin: contactData.linkedin,
        notas: contactData.notes,
      })
      .select()
      .single()

    if (!error && data) {
      setContacts((prev) => [
        {
          id: data.id,
          name: data.nome,
          position: data.cargo || '',
          email: data.email || '',
          phone: data.telefone || '',
          companyId: data.empresa_id || '',
          linkedin: data.linkedin || '',
          notes: data.notas || '',
        },
        ...prev,
      ])
    }
  }

  const updateContact = async (
    id: string,
    contactData: Omit<Contact, 'id'>,
  ) => {
    const { error } = await supabase
      .from('contatos')
      .update({
        nome: contactData.name,
        cargo: contactData.position,
        email: contactData.email,
        telefone: contactData.phone,
        empresa_id: contactData.companyId,
        linkedin: contactData.linkedin,
        notas: contactData.notes,
      })
      .eq('id', id)

    if (!error) {
      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === id ? { ...contact, ...contactData } : contact,
        ),
      )
    }
  }

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from('contatos').delete().eq('id', id)

    if (!error) {
      setContacts((prev) => prev.filter((contact) => contact.id !== id))
    }
  }

  return (
    <ContactsContext.Provider
      value={{ contacts, addContact, updateContact, deleteContact, loading }}
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
