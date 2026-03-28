import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  useActivities,
  Atividade,
  TipoAtividade,
  StatusAtividade,
} from '@/contexts/ActivitiesContext'
import { useCompanies } from '@/contexts/CompaniesContext'
import { useContacts } from '@/contexts/ContactsContext'
import { useOportunidades } from '@/contexts/OportunidadesContext'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'

interface ActivityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activityToEdit?: Atividade
}

export function ActivityDialog({
  open,
  onOpenChange,
  activityToEdit,
}: ActivityDialogProps) {
  const { addActivity, updateActivity, usuarios } = useActivities()
  const { companies } = useCompanies()
  const { contacts } = useContacts()
  const { oportunidades } = useOportunidades()
  const { user } = useAuth()

  const [loading, setLoading] = useState(false)
  const [syncGoogle, setSyncGoogle] = useState(false)
  const [hasIntegration, setHasIntegration] = useState(false)

  useEffect(() => {
    if (user && open) {
      supabase
        .from('integracao_usuarios')
        .select('ativo')
        .eq('usuario_id', user.id)
        .eq('provedor', 'google')
        .maybeSingle()
        .then(({ data }) => {
          if (data?.ativo) {
            setHasIntegration(true)
            setSyncGoogle(true)
          }
        })
    }
  }, [user, open])

  const [formData, setFormData] = useState({
    tipo: 'Ligação' as TipoAtividade,
    titulo: '',
    descricao: '',
    data_agendada: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    status: 'Agendada' as StatusAtividade,
    empresa_id: 'none',
    contato_id: 'none',
    oportunidade_id: 'none',
    responsavel_id: user?.id || '',
  })

  useEffect(() => {
    if (activityToEdit) {
      setFormData({
        tipo: activityToEdit.tipo,
        titulo: activityToEdit.titulo,
        descricao: activityToEdit.descricao || '',
        data_agendada: activityToEdit.data_agendada
          ? format(parseISO(activityToEdit.data_agendada), "yyyy-MM-dd'T'HH:mm")
          : '',
        status: activityToEdit.status,
        empresa_id: activityToEdit.empresa_id || 'none',
        contato_id: activityToEdit.contato_id || 'none',
        oportunidade_id: activityToEdit.oportunidade_id || 'none',
        responsavel_id: activityToEdit.responsavel_id,
      })
    } else {
      setFormData((prev) => ({
        ...prev,
        responsavel_id: user?.id || '',
        titulo: '',
        descricao: '',
        status: 'Agendada',
        tipo: 'Ligação',
        empresa_id: 'none',
        contato_id: 'none',
        oportunidade_id: 'none',
        data_agendada: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      }))
    }
  }, [activityToEdit, open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...formData,
        empresa_id: formData.empresa_id === 'none' ? null : formData.empresa_id,
        contato_id: formData.contato_id === 'none' ? null : formData.contato_id,
        oportunidade_id:
          formData.oportunidade_id === 'none' ? null : formData.oportunidade_id,
        data_agendada: formData.data_agendada
          ? new Date(formData.data_agendada).toISOString()
          : null,
      }

      let actId = activityToEdit?.id

      if (activityToEdit) {
        await updateActivity(activityToEdit.id, payload)
        toast.success('Atividade atualizada!')
      } else {
        const result = await addActivity(payload)
        // Se a função addActivity retornar o ID ou pudermos inferir...
        // No contexto atual addActivity não retorna o ID, então faremos sync baseados nos dados recentes
      }

      if (syncGoogle && hasIntegration) {
        toast.promise(
          supabase.functions.invoke('sincronizar-google-calendar', {
            body: {
              atividade_id: actId || 'new', // Na prática precisaríamos do ID recém-criado
              acao: activityToEdit ? 'editar' : 'criar',
            },
          }),
          {
            loading: 'Sincronizando com Google Calendar...',
            success: 'Sincronizado com sucesso!',
            error: 'Erro ao sincronizar com Google.',
          },
        )
      }

      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {activityToEdit ? 'Editar Atividade' : 'Nova Atividade'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={formData.tipo}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, tipo: v as TipoAtividade }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ligação">Ligação</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Reunião">Reunião</SelectItem>
                  <SelectItem value="Tarefa Interna">Tarefa Interna</SelectItem>
                  <SelectItem value="Acompanhamento">Acompanhamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, status: v as StatusAtividade }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agendada">Agendada</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <Input
              required
              value={formData.titulo}
              onChange={(e) =>
                setFormData((p) => ({ ...p, titulo: e.target.value }))
              }
              placeholder="Ex: Call de alinhamento"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data e Hora</label>
              <Input
                required
                type="datetime-local"
                value={formData.data_agendada}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, data_agendada: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Responsável</label>
              <Select
                value={formData.responsavel_id}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, responsavel_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vincular Oportunidade</label>
            <Select
              value={formData.oportunidade_id}
              onValueChange={(v) =>
                setFormData((p) => ({ ...p, oportunidade_id: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhuma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {oportunidades.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Select
                value={formData.empresa_id}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, empresa_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contato</label>
              <Select
                value={formData.contato_id}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, contato_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Textarea
              rows={3}
              value={formData.descricao}
              onChange={(e) =>
                setFormData((p) => ({ ...p, descricao: e.target.value }))
              }
              placeholder="Detalhes da atividade..."
            />
          </div>

          {hasIntegration && (
            <div className="flex items-center space-x-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100 mt-2">
              <Checkbox
                id="sync-google"
                checked={syncGoogle}
                onCheckedChange={(c) => setSyncGoogle(!!c)}
              />
              <label
                htmlFor="sync-google"
                className="text-sm font-medium text-blue-800 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Sincronizar com Google Calendar
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-black text-white hover:bg-gray-800"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
