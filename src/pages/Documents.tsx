import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Download,
  Trash,
  Share2,
  Search,
  FileImage,
  File,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

export default function DocumentsGallery() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('Todos')

  const fetchDocs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('documentos')
        .select('*, propostas(numero_proposta)')
        .order('data_upload', { ascending: false } as any)

      if (filterType !== 'Todos') {
        query = query.eq('tipo', filterType)
      }

      if (searchTerm) {
        query = query.ilike('nome_arquivo', `%${searchTerm}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setDocuments(data || [])
    } catch (e: any) {
      toast.error('Erro ao carregar galeria: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [filterType, searchTerm])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('public:documentos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documentos' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setDocuments((prev) => {
              if (prev.some((d) => d.id === payload.new.id)) return prev
              return [payload.new, ...prev]
            })

            setTimeout(() => {
              supabase
                .from('documentos')
                .select('*, propostas(numero_proposta)')
                .eq('id', payload.new.id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setDocuments((prev) =>
                      prev.map((d) => (d.id === data.id ? data : d)),
                    )
                  }
                })
            }, 0)
          } else if (payload.eventType === 'UPDATE') {
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === payload.new.id ? { ...d, ...payload.new } : d,
              ),
            )
          } else if (payload.eventType === 'DELETE') {
            setDocuments((prev) => prev.filter((d) => d.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const handleDownload = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('documentos-propostas')
        .download(doc.caminho_storage)
      if (error) throw error
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.nome_arquivo
      a.click()
    } catch (e: any) {
      toast.error('Erro ao baixar: ' + e.message)
    }
  }

  const handleView = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('documentos-propostas')
        .createSignedUrl(doc.caminho_storage, 3600)
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (e: any) {
      toast.error('Erro ao abrir documento: ' + e.message)
    }
  }

  const handleShare = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documentos-propostas')
        .createSignedUrl(path, 7 * 24 * 60 * 60) // 7 days
      if (error) throw error
      await navigator.clipboard.writeText(data.signedUrl)
      toast.success(
        'Link copiado para a área de transferência (expira em 7 dias)',
      )
    } catch (err: any) {
      toast.error('Erro ao gerar link de compartilhamento: ' + err.message)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    else return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const getIcon = (fileName: string) => {
    if (fileName.endsWith('.pdf'))
      return <FileText className="w-8 h-8 text-red-500" />
    if (
      fileName.endsWith('.png') ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg')
    )
      return <FileImage className="w-8 h-8 text-blue-500" />
    return <File className="w-8 h-8 text-gray-500" />
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Galeria de Documentos
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie todos os arquivos e anexos da organização.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 bg-white">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Tipos</SelectItem>
              <SelectItem value="Proposta">Propostas</SelectItem>
              <SelectItem value="Contrato">Contratos</SelectItem>
              <SelectItem value="Relatório">Relatórios</SelectItem>
              <SelectItem value="Anexo">Anexos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed rounded-lg text-gray-500">
          Nenhum documento encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="hover:shadow-md transition-shadow flex flex-col"
            >
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {getIcon(doc.nome_arquivo)}
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {doc.tipo}
                  </span>
                </div>

                <h3
                  className="font-semibold text-gray-900 truncate mb-1"
                  title={doc.nome_arquivo}
                >
                  {doc.nome_arquivo}
                </h3>

                <p className="text-sm text-gray-500 mt-auto">
                  {formatSize(doc.tamanho_bytes)} •{' '}
                  {new Date(
                    doc.data_upload || doc.created_at,
                  ).toLocaleDateString('pt-BR')}
                </p>
                {doc.propostas && (
                  <p className="text-xs text-blue-600 mt-1 truncate">
                    Ref: {doc.propostas.numero_proposta}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleView(doc)}
                    className="flex-1 text-gray-600 hover:text-primary"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(doc)}
                    className="flex-1 text-gray-600 hover:text-primary"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleShare(doc.caminho_storage)}
                    className="flex-1 text-gray-600 hover:text-primary"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
