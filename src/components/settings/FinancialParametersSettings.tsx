import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Edit2 } from 'lucide-react'

const DEFAULT_PARAMS = [
  {
    chave: 'OVERHEAD_PERCENTUAL',
    tipo: 'percentual',
    descricao: 'Percentual de custos indiretos',
    valor: '15',
  },
  {
    chave: 'CONTINGENCIA_PERCENTUAL',
    tipo: 'percentual',
    descricao: 'Margem de segurança para imprevistos',
    valor: '10',
  },
  {
    chave: 'ALIQUOTA_IMPOSTOS',
    tipo: 'percentual',
    descricao: 'Impostos sobre o faturamento',
    valor: '16.33',
  },
  {
    chave: 'MARGEM_PADRAO',
    tipo: 'percentual',
    descricao: 'Margem de lucro desejada padrão',
    valor: '40',
  },
  {
    chave: 'TAXA_CAMBIO',
    tipo: 'taxa',
    descricao: 'Taxa de câmbio USD para BRL',
    valor: '5.00',
  },
  {
    chave: 'DESCONTO_MAXIMO',
    tipo: 'percentual',
    descricao: 'Desconto máximo permitido',
    valor: '15',
  },
]

export function FinancialParametersSettings() {
  const { user } = useAuth()
  const [params, setParams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingParam, setEditingParam] = useState<any>(null)
  const [editValue, setEditValue] = useState('')

  const fetchParams = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('parametros_financeiros')
        .select('*')
        .eq('usuario_id', user.id)
      if (error) throw error

      let currentParams = data || []

      // Auto-create missing params
      if (currentParams.length < DEFAULT_PARAMS.length) {
        const missing = DEFAULT_PARAMS.filter(
          (dp) => !currentParams.find((cp) => cp.chave === dp.chave),
        )
        if (missing.length > 0) {
          const inserts = missing.map((m) => ({ ...m, usuario_id: user.id }))
          await supabase.from('parametros_financeiros').insert(inserts)
          const { data: refreshed } = await supabase
            .from('parametros_financeiros')
            .select('*')
            .eq('usuario_id', user.id)
          currentParams = refreshed || []
        }
      }

      setParams(currentParams.sort((a, b) => a.chave.localeCompare(b.chave)))
    } catch (err: any) {
      toast.error('Erro ao carregar parâmetros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParams()
  }, [user])

  const handleSave = async () => {
    if (!editingParam || !user) return

    const val = parseFloat(editValue)
    if (isNaN(val) || val < 0) {
      toast.error('Valor inválido')
      return
    }
    if (editingParam.tipo === 'percentual' && val > 100) {
      toast.error('Percentual não pode ser maior que 100')
      return
    }

    try {
      const { error } = await supabase
        .from('parametros_financeiros')
        .update({ valor: editValue })
        .eq('id', editingParam.id)

      if (error) throw error
      toast.success('Parâmetro atualizado com sucesso!')
      setEditingParam(null)
      fetchParams()
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message)
    }
  }

  if (loading)
    return (
      <div className="p-4 text-center text-gray-500">
        Carregando parâmetros...
      </div>
    )

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Parâmetros Financeiros
        </h3>
        <p className="text-sm text-gray-500">
          Configure as taxas e margens padrão utilizadas nos cálculos das
          propostas.
        </p>
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Chave</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor Atual</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {params.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-xs text-gray-600">
                  {p.chave}
                </TableCell>
                <TableCell className="text-sm">{p.descricao}</TableCell>
                <TableCell>
                  <Badge type={p.tipo} />
                </TableCell>
                <TableCell className="font-semibold text-gray-900">
                  {p.tipo === 'percentual' ? `${p.valor}%` : p.valor}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingParam(p)
                      setEditValue(p.valor || '')
                    }}
                  >
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!editingParam}
        onOpenChange={(open) => !open && setEditingParam(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Parâmetro</DialogTitle>
          </DialogHeader>
          {editingParam && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Chave</Label>
                <Input
                  value={editingParam.chave}
                  disabled
                  className="bg-gray-50 font-mono text-xs"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <p className="text-sm text-gray-500 mb-2">
                  {editingParam.descricao}
                </p>
              </div>
              <div>
                <Label>
                  Novo Valor (
                  {editingParam.tipo === 'percentual' ? '%' : 'Numérico'})
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingParam(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Badge({ type }: { type: string }) {
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full border ${
        type === 'percentual'
          ? 'bg-purple-50 text-purple-700 border-purple-200'
          : 'bg-gray-50 text-gray-700 border-gray-200'
      }`}
    >
      {type}
    </span>
  )
}
