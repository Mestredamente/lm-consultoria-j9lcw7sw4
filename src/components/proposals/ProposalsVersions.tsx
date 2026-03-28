import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
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
} from '@/components/ui/dialog'
import { Eye, RotateCcw, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export function ProposalsVersions({
  proposalId,
  onSuccess,
}: {
  proposalId: string
  onSuccess: () => void
}) {
  const { user } = useAuth()
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewVersion, setViewVersion] = useState<any>(null)
  const [restoring, setRestoring] = useState(false)

  const fetchVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('propostas_versoes')
        .select('*, usuarios(nome)')
        .eq('proposta_id', proposalId)
        .order('versao', { ascending: false })
      if (error) throw error
      setVersions(data || [])
    } catch (err: any) {
      toast.error('Erro ao buscar versões')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVersions()
  }, [proposalId])

  const handleRestore = async (version: any) => {
    if (!user) return
    try {
      setRestoring(true)
      // Snapshot current state before restoring
      await supabase.rpc('snapshot_proposta', {
        p_proposta_id: proposalId,
        p_usuario_id: user.id,
        p_resumo: `Antes de restaurar para v${version.versao}`,
      })

      const { proposta, itens, custos } = version.dados

      // Delete current items and costs
      await supabase
        .from('itens_proposta')
        .delete()
        .eq('proposta_id', proposalId)
      await supabase
        .from('custos_operacionais')
        .delete()
        .eq('proposta_id', proposalId)

      // Restore items
      if (itens && itens.length > 0) {
        const newItems = itens.map((i: any) => {
          const { id, ...rest } = i
          return { ...rest, proposta_id: proposalId }
        })
        await supabase.from('itens_proposta').insert(newItems)
      }

      // Restore costs
      if (custos && custos.length > 0) {
        const newCosts = custos.map((c: any) => {
          const { id, ...rest } = c
          return { ...rest, proposta_id: proposalId }
        })
        await supabase.from('custos_operacionais').insert(newCosts)
      }

      // Restore proposal details
      if (proposta) {
        const { id: _pid, ...propData } = proposta
        await supabase.from('propostas').update(propData).eq('id', proposalId)
      }

      // Log restore
      await supabase.from('historico_propostas').insert({
        proposta_id: proposalId,
        acao: `Restaurada para versão ${version.versao}`,
        usuario_id: user.id,
      })

      toast.success(`Versão ${version.versao} restaurada com sucesso!`)
      fetchVersions()
      onSuccess()
    } catch (err: any) {
      toast.error('Erro ao restaurar versão: ' + err.message)
    } finally {
      setRestoring(false)
    }
  }

  if (loading)
    return (
      <div className="p-4 text-center text-gray-500">Carregando versões...</div>
    )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Histórico de Versões
        </h3>
        <Badge variant="outline" className="text-gray-500">
          {versions.length} versões salvas
        </Badge>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Versão</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Resumo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-6 text-gray-500"
                >
                  Nenhuma versão salva. Edite a proposta para criar uma nova
                  versão.
                </TableCell>
              </TableRow>
            ) : (
              versions.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">v{v.versao}</TableCell>
                  <TableCell className="text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(v.created_at).toLocaleString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell>{v.usuarios?.nome || 'Usuário'}</TableCell>
                  <TableCell className="text-sm">
                    {v.resumo_mudancas || 'Edição manual'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewVersion(v)}
                    >
                      <Eye className="w-4 h-4 mr-1" /> Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(v)}
                      disabled={restoring}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" /> Restaurar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!viewVersion}
        onOpenChange={(open) => !open && setViewVersion(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualizando Versão {viewVersion?.versao}</DialogTitle>
          </DialogHeader>
          {viewVersion && (
            <div className="space-y-4 text-sm mt-4">
              <div>
                <h4 className="font-semibold text-gray-900 border-b pb-1 mb-2">
                  Detalhes da Proposta
                </h4>
                <pre className="bg-gray-50 p-3 rounded-md overflow-x-auto text-xs text-gray-600">
                  {JSON.stringify(viewVersion.dados.proposta, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 border-b pb-1 mb-2">
                  Serviços ({viewVersion.dados.itens?.length || 0})
                </h4>
                <pre className="bg-gray-50 p-3 rounded-md overflow-x-auto text-xs text-gray-600">
                  {JSON.stringify(viewVersion.dados.itens, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 border-b pb-1 mb-2">
                  Custos ({viewVersion.dados.custos?.length || 0})
                </h4>
                <pre className="bg-gray-50 p-3 rounded-md overflow-x-auto text-xs text-gray-600">
                  {JSON.stringify(viewVersion.dados.custos, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
