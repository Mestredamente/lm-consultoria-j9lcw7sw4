import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  Plus,
  Eye,
  Loader2,
  UploadCloud,
} from 'lucide-react'
import { toast } from 'sonner'

export function ProposalDocuments({ proposalId }: { proposalId: string }) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [tipo, setTipo] = useState('Anexo')

  const fetchDocs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('proposta_id', proposalId)
        .order('data_upload', { ascending: false } as any)

      if (error) throw error
      setDocuments(data || [])
    } catch (e: any) {
      toast.error('Erro ao carregar documentos: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [proposalId])

  const handleUpload = async () => {
    if (!file) return toast.error('Selecione um arquivo')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('proposta_id', proposalId)
      formData.append('tipo_documento', tipo)

      const { data, error } = await supabase.functions.invoke(
        'upload-documento',
        {
          body: formData,
        },
      )

      if (error) throw error
      if (!data.success) throw new Error(data.error)

      toast.success('Documento enviado com sucesso')
      setIsOpen(false)
      setFile(null)
      fetchDocs()
    } catch (e: any) {
      toast.error('Erro no upload: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

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

  const handleDelete = async (id: string, caminho: string) => {
    if (!confirm('Deseja deletar este documento permanentemente?')) return
    try {
      await supabase.storage.from('documentos-propostas').remove([caminho])
      const { error } = await supabase.from('documentos').delete().eq('id', id)
      if (error) throw error
      toast.success('Documento deletado')
      fetchDocs()
    } catch (e: any) {
      toast.error('Erro ao deletar: ' + e.message)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    else return (bytes / 1048576).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Documentos Anexados</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Upload
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Tipo de Documento
                </label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Proposta">
                      Proposta (PDF Alternativo)
                    </SelectItem>
                    <SelectItem value="Contrato">Contrato</SelectItem>
                    <SelectItem value="Relatório">Relatório Prévio</SelectItem>
                    <SelectItem value="Anexo">Anexo Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors relative">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">
                  {file ? file.name : 'Clique ou arraste o arquivo aqui'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOCX, XLSX ou Imagens (Máx: 50MB)
                </p>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleUpload} disabled={!file || uploading}>
                  {uploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Enviar Arquivo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Arquivo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  {doc.nome_arquivo}
                </TableCell>
                <TableCell>{doc.tipo}</TableCell>
                <TableCell>{formatSize(doc.tamanho_bytes)}</TableCell>
                <TableCell>
                  {new Date(
                    doc.data_upload || doc.created_at,
                  ).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleView(doc)}
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(doc)}
                    title="Baixar"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(doc.id, doc.caminho_storage)}
                    title="Excluir"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && documents.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-6 text-gray-500"
                >
                  Nenhum documento anexado a esta proposta.
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
