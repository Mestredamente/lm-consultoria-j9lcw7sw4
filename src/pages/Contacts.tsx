import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react'
import { useContacts, Contact } from '@/contexts/ContactsContext'
import { useCompanies } from '@/contexts/CompaniesContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ContactDialog } from '@/components/contacts/ContactDialog'

export default function Contacts() {
  const { contacts, deleteContact } = useContacts()
  const { companies } = useCompanies()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const handleCreateNew = () => {
    setContactToEdit(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (contact: Contact) => {
    setContactToEdit(contact)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este contato?')) {
      deleteContact(id)
    }
  }

  const getCompanyName = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId)
    return company ? company.name : 'Empresa não encontrada'
  }

  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase()
    const nameMatch = contact.name.toLowerCase().includes(searchLower)
    const companyName = getCompanyName(contact.companyId).toLowerCase()
    const companyMatch = companyName.includes(searchLower)

    return nameMatch || companyMatch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-black" />
            Contatos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie contatos individuais e suas vinculações
          </p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-black text-white hover:bg-gray-800 rounded-full px-6 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Contato
        </Button>
      </div>

      <div className="glass-card rounded-[24px] p-6 overflow-hidden">
        <div className="mb-6 max-w-md relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white/50 border-gray-200 rounded-xl"
          />
        </div>

        <div className="rounded-xl overflow-hidden border border-gray-100">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-semibold text-gray-700">
                  Nome
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Cargo
                </TableHead>
                <TableHead className="font-semibold text-gray-700 hidden md:table-cell">
                  Email
                </TableHead>
                <TableHead className="font-semibold text-gray-700 hidden lg:table-cell">
                  Telefone
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Empresa Vinculada
                </TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Nenhum contato encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="hover:bg-white/40 transition-colors border-b border-gray-100/50"
                  >
                    <TableCell className="font-medium text-gray-900">
                      {contact.name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {contact.position}
                    </TableCell>
                    <TableCell className="text-gray-500 hidden md:table-cell">
                      {contact.email}
                    </TableCell>
                    <TableCell className="text-gray-500 hidden lg:table-cell">
                      {contact.phone}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-gray-50 font-normal"
                      >
                        {getCompanyName(contact.companyId)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(contact)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(contact.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ContactDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        contactToEdit={contactToEdit}
      />
    </div>
  )
}
