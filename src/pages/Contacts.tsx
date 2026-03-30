import { useState, useEffect } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  AlertCircle,
  MoreVertical,
} from 'lucide-react'
import { toast } from 'sonner'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContactDialog } from '@/components/contacts/ContactDialog'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'

export default function Contacts() {
  const { contacts, deleteContact, loading, error } = useContacts()
  const { companies } = useCompanies()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all')
  const isMobile = useIsMobile()
  const [page, setPage] = useState(1)
  const [observerRef, inView] = useIntersectionObserver()

  useEffect(() => {
    if (inView) setPage((p) => p + 1)
  }, [inView])

  const handleCreateNew = () => {
    setContactToEdit(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (contact: Contact) => {
    setContactToEdit(contact)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este contato?')) {
      try {
        await deleteContact(id)
        toast.success('Contato deletado com sucesso')
      } catch (err: any) {
        toast.error(err.message || 'Erro ao deletar contato')
      }
    }
  }

  const getCompanyName = (companyId: string) => {
    if (!companyId) return 'Sem Empresa'
    const company = companies.find((c) => c.id === companyId)
    return company ? company.name : 'Empresa não encontrada'
  }

  const filteredContacts = contacts.filter((contact) => {
    const searchLower = searchTerm.toLowerCase()
    const nameMatch = contact.name.toLowerCase().includes(searchLower)
    const companyName = getCompanyName(contact.companyId).toLowerCase()
    const companySearchMatch = companyName.includes(searchLower)

    const matchesSearch = nameMatch || companySearchMatch
    const matchesCompany =
      selectedCompanyId === 'all' || contact.companyId === selectedCompanyId

    return matchesSearch && matchesCompany
  })

  const ITEMS_PER_PAGE = isMobile ? 10 : 20
  const displayedContacts = filteredContacts.slice(0, page * ITEMS_PER_PAGE)
  const hasMore = displayedContacts.length < filteredContacts.length

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in pb-8">
      <div className="flex flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
            <Users className="w-6 h-6 md:w-8 md:h-8 text-black" />
            Contatos
          </h1>
          <p className="text-muted-foreground mt-1 text-sm hidden md:block">
            Gerencie contatos individuais e suas vinculações
          </p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-black text-white hover:bg-gray-800 rounded-full px-4 py-2 md:px-6 shadow-lg h-auto"
        >
          <Plus className="w-5 h-5 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Novo Contato</span>
        </Button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm rounded-[24px] p-4 md:p-6 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base bg-white border-gray-200 rounded-xl"
            />
          </div>
          <Select
            value={selectedCompanyId}
            onValueChange={setSelectedCompanyId}
          >
            <SelectTrigger className="w-full md:w-[250px] h-12 text-base bg-white border-gray-200 rounded-xl">
              <SelectValue placeholder="Filtrar por empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {isMobile ? (
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
                Carregando contatos...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground bg-white/50 rounded-xl border border-gray-100">
                Nenhum contato encontrado.
              </div>
            ) : (
              <>
                {displayedContacts.map((contact) => (
                  <Card
                    key={contact.id}
                    className="overflow-hidden border-gray-100 shadow-sm"
                  >
                    <CardContent className="p-4 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 truncate mb-1">
                          {contact.name}
                        </h3>
                        <div className="space-y-1">
                          {contact.position && (
                            <p className="text-sm text-gray-600 truncate">
                              {contact.position}
                            </p>
                          )}
                          {contact.email && (
                            <p className="text-sm text-gray-500 truncate">
                              {contact.email}
                            </p>
                          )}
                          {contact.phone && (
                            <p className="text-sm text-gray-500 truncate">
                              {contact.phone}
                            </p>
                          )}
                        </div>
                        <div className="mt-3">
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-700 font-normal"
                          >
                            {getCompanyName(contact.companyId)}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 shrink-0"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleEdit(contact)}
                            className="py-3 text-base"
                          >
                            <Pencil className="w-5 h-5 mr-3 text-blue-600" />{' '}
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(contact.id)}
                            className="py-3 text-base text-red-600"
                          >
                            <Trash2 className="w-5 h-5 mr-3" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
                {hasMore && (
                  <div
                    ref={observerRef}
                    className="h-10 w-full flex items-center justify-center"
                  >
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-gray-100 bg-white">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700">
                    Nome
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Cargo
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Email
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
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
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-3 h-3 rounded-full animate-pulse bg-gray-400"></div>
                        <div className="w-3 h-3 rounded-full animate-pulse bg-gray-400 delay-75"></div>
                        <div className="w-3 h-3 rounded-full animate-pulse bg-gray-400 delay-150"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Nenhum contato encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {displayedContacts.map((contact) => (
                      <TableRow
                        key={contact.id}
                        className="hover:bg-gray-50 transition-colors border-b border-gray-100/50"
                      >
                        <TableCell className="font-medium text-gray-900">
                          {contact.name}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {contact.position || '-'}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {contact.email || '-'}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {contact.phone || '-'}
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
                    ))}
                    {hasMore && (
                      <TableRow ref={observerRef}>
                        <TableCell
                          colSpan={6}
                          className="h-16 text-center text-muted-foreground"
                        >
                          <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ContactDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        contactToEdit={contactToEdit}
      />
    </div>
  )
}
