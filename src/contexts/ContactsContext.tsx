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

export interface Contact {
  id: string
  name: string
  position: string
  email: string
  phone: string
  companyId: string
  linkedin?: string
  notes?: string
  createdAt: string
}

interface ContactsContextType {
  contacts: Contact[]
  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => Promise<void>
  updateContact: (
    id: string,
    contact: Omit<Contact, 'id' | 'createdAt'>,
  ) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  refreshContacts: () => Promise<void>
  loading: boolean
  error: string | null
}

const ContactsContext = createContext<ContactsContextType | undefined>(
  undefined,
)

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, role } = useAuth()

  const fetchContacts = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('contatos')
        .select('*')
        .order('created_at', { ascending: false })

      if (role === 'vendedor') {
        query = query.eq('usuario_id', user.id)
      }

      const { data, error: err } = await query

      if (err) throw err

      if (data) {
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
            createdAt: d.created_at || new Date().toISOString(),
          })),
        )
      }
    } catch (err: any) {
      console.error('Error fetching contacts:', err)
      setError(err.message || 'Falha ao carregar contatos')
    } finally {
      setLoading(false)
    }
  }, [user, role])

  useEffect(() => {
    if (user) {
      fetchContacts()
    } else {
      setContacts([])
      setLoading(false)
    }
  }, [user, fetchContacts])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('public:contatos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contatos' },
        (payload) => {
          if (
            role === 'vendedor' &&
            payload.new &&
            payload.new.usuario_id !== user.id
          )
            return

          if (payload.eventType === 'INSERT') {
            setContacts((prev) => {
              if (prev.some((c) => c.id === payload.new.id)) return prev
              return [
                {
                  id: payload.new.id,
                  name: payload.new.nome,
                  position: payload.new.cargo || '',
                  email: payload.new.email || '',
                  phone: payload.new.telefone || '',
                  companyId: payload.new.empresa_id || '',
                  linkedin: payload.new.linkedin || '',
                  notes: payload.new.notas || '',
                  createdAt: payload.new.created_at || new Date().toISOString(),
                },
                ...prev,
              ]
            })
          } else if (payload.eventType === 'UPDATE') {
            setContacts((prev) =>
              prev.map((c) =>
                c.id === payload.new.id
                  ? {
                      ...c,
                      name: payload.new.nome,
                      position: payload.new.cargo || '',
                      email: payload.new.email || '',
                      phone: payload.new.telefone || '',
                      companyId: payload.new.empresa_id || '',
                      linkedin: payload.new.linkedin || '',
                      notes: payload.new.notas || '',
                    }
                  : c,
              ),
            )
          } else if (payload.eventType === 'DELETE') {
            setContacts((prev) => prev.filter((c) => c.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, role])

  const addContact = async (contactData: Omit<Contact, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('Usuário não autenticado')

    const { data, error: err } = await supabase
      .from('contatos')
      .insert({
        usuario_id: user.id,
        nome: contactData.name,
        cargo: contactData.position || null,
        email: contactData.email || null,
        telefone: contactData.phone || null,
        empresa_id: contactData.companyId || null,
        linkedin: contactData.linkedin || null,
        notas: contactData.notes || null,
      })
      .select()
      .single()

    if (err) throw err

    if (data) {
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
          createdAt: data.created_at || new Date().toISOString(),
        },
        ...prev,
      ])
    }
  }

  const updateContact = async (
    id: string,
    contactData: Omit<Contact, 'id' | 'createdAt'>,
  ) => {
    if (!user) throw new Error('Usuário não autenticado')

    let query = supabase
      .from('contatos')
      .update({
        nome: contactData.name,
        cargo: contactData.position || null,
        email: contactData.email || null,
        telefone: contactData.phone || null,
        empresa_id: contactData.companyId || null,
        linkedin: contactData.linkedin || null,
        notas: contactData.notes || null,
      })
      .eq('id', id)

    if (role === 'vendedor') {
      query = query.eq('usuario_id', user.id)
    }

    const { error: err } = await query

    if (err) throw err

    setContacts((prev) =>
      prev.map((contact) =>
        contact.id === id ? { ...contact, ...contactData } : contact,
      ),
    )
  }

  const deleteContact = async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado')

    let query = supabase.from('contatos').delete().eq('id', id)

    if (role === 'vendedor') {
      query = query.eq('usuario_id', user.id)
    }

    const { error: err } = await query

    if (err) throw err

    setContacts((prev) => prev.filter((contact) => contact.id !== id))
  }

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        addContact,
        updateContact,
        deleteContact,
        refreshContacts: fetchContacts,
        loading,
        error,
      }}
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
