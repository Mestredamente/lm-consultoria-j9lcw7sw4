import { useState, useEffect } from 'react'
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
  MoreVertical,
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
import { useIsMobile } from '@/hooks/use-mobile'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'

export default function Companies() {
  const { companies, deleteCompany, loading, error, refreshCompanies } =
    useCompanies()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const [page, setPage] = useState(1)
  const [observerRef, inView] = useIntersectionObserver()

  useEffect(() => {
    if (inView) setPage((p) => p + 1)
  }, [inView])

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

  const ITEMS_PER_PAGE = isMobile ? 10 : 20
  const displayedCompanies = companies.slice(0, page * ITEMS_PER_PAGE)
  const hasMore = displayedCompanies.length < companies.length

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in pb-8">
      <div className="flex flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
            <Building2 className="w-6 h-6 md:w-8 md:h-8 text-black" />
            Empresas
          </h1>
          <p className="text-muted-foreground mt-1 text-sm hidden md:block">
            Gerencie o diretório de empresas e organizações
          </p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="bg-black text-white hover:bg-gray-800 rounded-full px-4 py-2 md:px-6 shadow-lg h-auto"
        >
          <Plus className="w-5 h-5 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Nova Empresa</span>
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="font-medium text-sm md:text-base">
              Erro ao carregar empresas: {error}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshCompanies()}
            className="border-red-200 text-red-700 hover:bg-red-100 h-10 md:h-8 px-4"
          >
            <RefreshCw className="w-4 h-4 md:mr-2" />{' '}
            <span className="hidden md:inline">Tentar novamente</span>
          </Button>
        </div>
      )}

      <div className="bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm rounded-[24px] p-4 md:p-6 overflow-hidden">
        {isMobile ? (
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-black mb-4" />
                <p>Carregando diretório de empresas...</p>
              </div>
            ) : companies.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground bg-white/50 rounded-xl border border-gray-100">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-900">
                  Nenhuma empresa encontrada
                </p>
              </div>
            ) : (
              <>
                {displayedCompanies.map((company) => (
                  <Card
                    key={company.id}
                    className="overflow-hidden border-gray-100 shadow-sm"
                  >
                    <CardContent className="p-4 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/companies/${company.id}`}
                          className="font-semibold text-lg text-gray-900 hover:underline truncate block mb-1"
                        >
                          {company.name}
                        </Link>
                        <div className="space-y-1 mb-3">
                          {company.website && (
                            <a
                              href={
                                company.website.startsWith('http')
                                  ? company.website
                                  : `https://${company.website}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-blue-600 truncate block"
                            >
                              {company.website.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                          <p className="text-sm text-gray-500">
                            {company.employees > 0
                              ? `${company.employees} funcionários`
                              : 'Tamanho não informado'}
                          </p>
                        </div>
                        {company.industry && (
                          <Badge
                            variant="outline"
                            className="bg-gray-50 font-normal"
                          >
                            {company.industry}
                          </Badge>
                        )}
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
                          <DropdownMenuItem asChild className="py-3 text-base">
                            <Link to={`/companies/${company.id}`}>
                              <Eye className="w-5 h-5 mr-3 text-gray-600" />{' '}
                              Visualizar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(company)}
                            className="py-3 text-base"
                          >
                            <Pencil className="w-5 h-5 mr-3 text-blue-600" />{' '}
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(company.id)}
                            disabled={isDeleting === company.id}
                            className="py-3 text-base text-red-600"
                          >
                            {isDeleting === company.id ? (
                              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5 mr-3" />
                            )}
                            Excluir
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
                    <Loader2 className="w-5 h-5 text-black animate-spin" />
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
                    Setor
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Website
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
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
                  <>
                    {displayedCompanies.map((company) => (
                      <TableRow
                        key={company.id}
                        className="hover:bg-gray-50 transition-colors border-b border-gray-100/50"
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
                        <TableCell className="text-gray-500">
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
                        <TableCell className="text-gray-500">
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
                    ))}
                    {hasMore && (
                      <TableRow ref={observerRef}>
                        <TableCell
                          colSpan={5}
                          className="h-16 text-center text-muted-foreground"
                        >
                          <Loader2 className="w-5 h-5 text-black animate-spin mx-auto" />
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

      <CompanyDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        companyToEdit={companyToEdit}
      />
    </div>
  )
}
