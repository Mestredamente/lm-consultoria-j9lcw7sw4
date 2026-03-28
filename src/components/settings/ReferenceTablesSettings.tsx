import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const CONFIGS = {
  consultores: {
    title: 'Consultores',
    table: 'consultores',
    cols: [
      { key: 'nome', label: 'Nome' },
      { key: 'especialidade', label: 'Especialidade' },
      { key: 'taxa_horaria_senior', label: 'Taxa Sênior' },
    ],
  },
  rotas: {
    title: 'Rotas Aéreas',
    table: 'rotas_aereas',
    cols: [
      { key: 'origem', label: 'Origem' },
      { key: 'destino', label: 'Destino' },
      { key: 'valor_passagem', label: 'Valor Médio' },
    ],
  },
  hoteis: {
    title: 'Hotéis',
    table: 'hoteis_regioes',
    cols: [
      { key: 'regiao', label: 'Região' },
      { key: 'valor_diaria_media', label: 'Valor Diária' },
    ],
  },
  per_diem: {
    title: 'Per Diem',
    table: 'per_diem_regioes',
    cols: [
      { key: 'regiao', label: 'Região' },
      { key: 'valor_diario', label: 'Valor Diário' },
    ],
  },
  testes: {
    title: 'Testes Psicológicos',
    table: 'testes_psicologicos',
    cols: [
      { key: 'nome', label: 'Nome' },
      { key: 'valor_unitario', label: 'Valor Unitário' },
    ],
  },
  materiais: {
    title: 'Materiais',
    table: 'materiais',
    cols: [
      { key: 'nome', label: 'Nome' },
      { key: 'categoria', label: 'Categoria' },
      { key: 'valor_unitario', label: 'Valor Unitário' },
    ],
  },
}

export function ReferenceTablesSettings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('consultores')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingParam] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const conf = CONFIGS[activeTab as keyof typeof CONFIGS]

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    const { data: res } = await supabase
      .from(conf.table)
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
    setData(res || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [activeTab, user])

  const handleOpenModal = (item?: any) => {
    setEditingParam(item || null)
    if (item) setFormData(item)
    else {
      const init: any = {}
      conf.cols.forEach((c) => (init[c.key] = ''))
      setFormData(init)
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!user) return
    try {
      const payload = { ...formData, usuario_id: user.id }
      if (editingItem) {
        await supabase.from(conf.table).update(payload).eq('id', editingItem.id)
        toast.success('Atualizado com sucesso!')
      } else {
        await supabase.from(conf.table).insert([payload])
        toast.success('Criado com sucesso!')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (e: any) {
      toast.error('Erro: ' + e.message)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await supabase.from(conf.table).delete().eq('id', deletingId)
      toast.success('Removido com sucesso!')
      fetchData()
    } catch (e: any) {
      toast.error('Erro ao remover: ' + e.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Tabelas de Referência
        </h3>
        <p className="text-sm text-gray-500">
          Gerencie os cadastros base para composição de custos operacionais e
          serviços das propostas.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto bg-gray-50 border p-1 rounded-lg">
          {Object.entries(CONFIGS).map(([k, v]) => (
            <TabsTrigger
              key={k}
              value={k}
              className="data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm"
            >
              {v.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex justify-end">
        <Button
          onClick={() => handleOpenModal()}
          size="sm"
          className="shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Registro
        </Button>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              {conf.cols.map((c) => (
                <TableHead key={c.key} className="text-gray-600 font-semibold">
                  {c.label}
                </TableHead>
              ))}
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={conf.cols.length + 1}
                  className="text-center py-8 text-gray-500"
                >
                  Carregando dados...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={conf.cols.length + 1}
                  className="text-center py-8 text-gray-400"
                >
                  Nenhum registro encontrado para {conf.title.toLowerCase()}.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50/50">
                  {conf.cols.map((c) => (
                    <TableCell key={c.key} className="text-gray-700">
                      {row[c.key]}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => handleOpenModal(row)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                        onClick={() => setDeletingId(row.id)}
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar' : 'Novo'} Registro - {conf.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {conf.cols.map((c) => (
              <div key={c.key} className="space-y-1.5">
                <Label>{c.label}</Label>
                <Input
                  type={
                    c.key.includes('valor') || c.key.includes('taxa')
                      ? 'number'
                      : 'text'
                  }
                  step="0.01"
                  value={formData[c.key] || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, [c.key]: e.target.value })
                  }
                  placeholder={`Digite ${c.label.toLowerCase()}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Tem certeza que deseja remover
              este registro permanentemente?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
