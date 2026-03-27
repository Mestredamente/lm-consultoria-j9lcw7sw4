import { useState } from 'react'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { useCompanies, Company } from '@/contexts/CompaniesContext'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CompanyDialog } from '@/components/companies/CompanyDialog'

export default function Companies() {
  const { companies, deleteCompany } = useCompanies()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null)

  const handleCreateNew = () => {
    setCompanyToEdit(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (company: Company) => {
    setCompanyToEdit(company)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta empresa?')) {
      deleteCompany(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-black" />
            Empresas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o diretório de empresas e organizações
          </p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-black text-white hover:bg-gray-800 rounded-full px-6 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Empresa
        </Button>
      </div>

      <div className="glass-card rounded-[24px] p-6 overflow-hidden">
        <div className="rounded-xl overflow-hidden border border-gray-100">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-semibold text-gray-700">
                  Nome
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Setor
                </TableHead>
                <TableHead className="font-semibold text-gray-700 hidden md:table-cell">
                  Website
                </TableHead>
                <TableHead className="font-semibold text-gray-700 hidden sm:table-cell">
                  Nº de Funcionários
                </TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Nenhuma empresa cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow
                    key={company.id}
                    className="hover:bg-white/40 transition-colors border-b border-gray-100/50"
                  >
                    <TableCell className="font-medium text-gray-900">
                      {company.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-gray-50 font-normal"
                      >
                        {company.industry}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 hidden md:table-cell">
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline text-blue-600"
                      >
                        {company.website.replace(/^https?:\/\//, '')}
                      </a>
                    </TableCell>
                    <TableCell className="text-gray-500 hidden sm:table-cell">
                      {company.employees.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(company)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(company.id)}
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

      <CompanyDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        companyToEdit={companyToEdit}
      />
    </div>
  )
}
