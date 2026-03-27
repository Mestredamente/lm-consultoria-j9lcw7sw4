import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  Globe,
  Users,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Pencil,
  FileText,
  Calendar,
} from 'lucide-react'
import { useCompanies } from '@/contexts/CompaniesContext'
import { useContacts } from '@/contexts/ContactsContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CompanyDialog } from '@/components/companies/CompanyDialog'

export default function CompanyDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { companies } = useCompanies()
  const { contacts } = useContacts()

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const company = companies.find((c) => c.id === id)

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Empresa não encontrada
        </h2>
        <Button
          onClick={() => navigate('/companies')}
          className="bg-black text-white hover:bg-gray-800"
        >
          Voltar para Empresas
        </Button>
      </div>
    )
  }

  const linkedContacts = contacts.filter((c) => c.companyId === id)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/">Início</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/companies">Empresas</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{company.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-gray-200 shadow-sm shrink-0">
            <Building2 className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {company.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                {company.industry}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                CNPJ: {company.cnpj}
              </span>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setIsEditDialogOpen(true)}
          className="bg-black text-white hover:bg-gray-800 rounded-full px-6 shadow-md w-full sm:w-auto shrink-0"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-1 border-white/60 shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Informações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900">Website</p>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {company.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Funcionários
                </p>
                <p className="text-sm text-gray-500">
                  {company.employees.toLocaleString()} pessoas
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900">
                  Email Principal
                </p>
                <a
                  href={`mailto:${company.email}`}
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  {company.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Telefone</p>
                <p className="text-sm text-gray-500">{company.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Endereço</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {company.address}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-2 border-white/60 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <Tabs defaultValue="contacts" className="w-full flex-1 flex flex-col">
            <div className="px-6 pt-4 border-b border-gray-100/50 bg-white/20">
              <TabsList className="bg-transparent h-auto p-0 gap-6 flex-wrap">
                <TabsTrigger
                  value="contacts"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none px-0 pb-3 font-medium text-gray-500 data-[state=active]:text-gray-900"
                >
                  Contatos Vinculados
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-gray-100 text-gray-600 border-0"
                  >
                    {linkedContacts.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="opportunities"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none px-0 pb-3 font-medium text-gray-500 data-[state=active]:text-gray-900"
                >
                  Oportunidades
                </TabsTrigger>
                <TabsTrigger
                  value="activities"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-black rounded-none px-0 pb-3 font-medium text-gray-500 data-[state=active]:text-gray-900"
                >
                  Atividades
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-0 flex-1">
              <TabsContent
                value="contacts"
                className="m-0 p-0 outline-none h-full"
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">
                          Nome
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          Cargo
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 hidden sm:table-cell">
                          Email
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700 hidden md:table-cell">
                          Telefone
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linkedContacts.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="h-48 text-center text-muted-foreground"
                          >
                            <div className="flex flex-col items-center justify-center text-center space-y-3">
                              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                                <Users className="w-6 h-6 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500">
                                Nenhum contato vinculado a esta empresa.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        linkedContacts.map((contact) => (
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
                            <TableCell className="text-gray-500 hidden sm:table-cell">
                              {contact.email}
                            </TableCell>
                            <TableCell className="text-gray-500 hidden md:table-cell">
                              {contact.phone}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent
                value="opportunities"
                className="m-0 p-8 outline-none h-full flex flex-col items-center justify-center min-h-[300px]"
              >
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2 shadow-sm">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Vazio por enquanto
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Nenhuma oportunidade vinculada a esta empresa foi registrada
                    ainda.
                  </p>
                </div>
              </TabsContent>

              <TabsContent
                value="activities"
                className="m-0 p-8 outline-none h-full flex flex-col items-center justify-center min-h-[300px]"
              >
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2 shadow-sm">
                    <Calendar className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Vazio por enquanto
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm">
                    Nenhuma atividade vinculada a esta empresa foi registrada
                    ainda.
                  </p>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      <CompanyDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        companyToEdit={company}
      />
    </div>
  )
}
