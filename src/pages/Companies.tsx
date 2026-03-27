import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
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
  const { companies, deleteCompany, loading, error, refreshCompanies } =
    useCompanies()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleCreateNew = () => {
    setCompanyToEdit(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (company: Company) => {
    setCompanyToEdit(company)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta empresa?')) {
      setIsDeleting(id)
      try {
        await deleteCompany(id)
        toast.success('Empresa deletada com sucesso!')
      } catch (err: any) {
        toast.error(err.message || 'Erro ao deletar a empresa')
      } finally {
        setIsDeleting(null)
      }
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="font-medium">Erro ao carregar empresas: {error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshCompanies()}
            className="border-red-200 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Tentar novamente
          </Button>
        </div>
      )}

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
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                      <p>Carregando diretório de empresas...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : companies.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Building2 className="w-12 h-12 text-gray-300" />
                      <p className="text-lg font-medium text-gray-900">
                        Nenhuma empresa encontrada
                      </p>
                      <p className="text-sm">
                        Clique em "Nova Empresa" para adicionar ao seu
                        diretório.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow
                    key={company.id}
                    className="hover:bg-white/40 transition-colors border-b border-gray-100/50"
                  >
                    <TableCell className="font-medium text-gray-900">
                      <Link
                        to={`/companies/${company.id}`}
                        className="hover:underline text-black font-semibold"
                      >
                        {company.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {company.industry ? (
                        <Badge
                          variant="outline"
                          className="bg-gray-50 font-normal"
                        >
                          {company.industry}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 hidden md:table-cell">
                      {company.website ? (
                        <a
                          href={
                            company.website.startsWith('http')
                              ? company.website
                              : `https://${company.website}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-blue-600 truncate max-w-[200px] inline-block"
                        >
                          {company.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 hidden sm:table-cell">
                      {company.employees > 0 ? (
                        company.employees.toLocaleString()
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-8 w-8 text-gray-500 hover:text-black hover:bg-gray-100"
                        >
                          <Link to={`/companies/${company.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
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
                          disabled={isDeleting === company.id}
                          onClick={() => handleDelete(company.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {isDeleting === company.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
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
