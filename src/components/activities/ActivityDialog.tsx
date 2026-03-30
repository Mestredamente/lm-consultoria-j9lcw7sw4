import { useState, useEffect, useRef } from 'react'
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
import { useIsMobile } from '@/hooks/use-mobile'
import { Loader2 } from 'lucide-react'

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
  const isMobile = useIsMobile()

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
        await addActivity(payload)
        toast.success('Atividade criada!')
      }

      if (syncGoogle && hasIntegration) {
        toast.promise(
          supabase.functions.invoke('sincronizar-google-calendar', {
            body: {
              atividade_id: actId || 'new',
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

  const handleInputFocus = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement
    >,
  ) => {
    if (isMobile) {
      setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-[500px] border-white/60 bg-white flex flex-col h-[90vh] md:h-auto max-h-[90vh]">
        <DialogHeader className="p-4 md:p-6 border-b border-gray-100 pb-4 sticky top-0 bg-white z-10">
          <DialogTitle className="text-xl md:text-2xl font-bold pr-8">
            {activityToEdit ? 'Editar Atividade' : 'Nova Atividade'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 pb-24 md:pb-6 scrollbar-thin scrollbar-thumb-gray-200">
          <form
            id="activity-form"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-base md:text-sm font-medium">Tipo</label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, tipo: v as TipoAtividade }))
                  }
                >
                  <SelectTrigger
                    className="h-12 md:h-10 text-base"
                    onFocus={handleInputFocus as any}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ligação" className="py-3">
                      Ligação
                    </SelectItem>
                    <SelectItem value="Email" className="py-3">
                      Email
                    </SelectItem>
                    <SelectItem value="Reunião" className="py-3">
                      Reunião
                    </SelectItem>
                    <SelectItem value="Tarefa Interna" className="py-3">
                      Tarefa Interna
                    </SelectItem>
                    <SelectItem value="Acompanhamento" className="py-3">
                      Acompanhamento
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-base md:text-sm font-medium">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, status: v as StatusAtividade }))
                  }
                >
                  <SelectTrigger
                    className="h-12 md:h-10 text-base"
                    onFocus={handleInputFocus as any}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Agendada" className="py-3">
                      Agendada
                    </SelectItem>
                    <SelectItem value="Concluída" className="py-3">
                      Concluída
                    </SelectItem>
                    <SelectItem value="Cancelada" className="py-3">
                      Cancelada
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-base md:text-sm font-medium">
                Título *
              </label>
              <Input
                required
                className="h-12 md:h-10 text-base"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, titulo: e.target.value }))
                }
                onFocus={handleInputFocus}
                placeholder="Ex: Call de alinhamento"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-base md:text-sm font-medium">
                  Data e Hora *
                </label>
                <Input
                  required
                  type="datetime-local"
                  className="h-12 md:h-10 text-base bg-white"
                  value={formData.data_agendada}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      data_agendada: e.target.value,
                    }))
                  }
                  onFocus={handleInputFocus}
                />
              </div>
              <div className="space-y-2">
                <label className="text-base md:text-sm font-medium">
                  Responsável
                </label>
                <Select
                  value={formData.responsavel_id}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, responsavel_id: v }))
                  }
                >
                  <SelectTrigger
                    className="h-12 md:h-10 text-base"
                    onFocus={handleInputFocus as any}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.map((u) => (
                      <SelectItem key={u.id} value={u.id} className="py-3">
                        {u.nome || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-base md:text-sm font-medium">
                Vincular Oportunidade
              </label>
              <Select
                value={formData.oportunidade_id}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, oportunidade_id: v }))
                }
              >
                <SelectTrigger
                  className="h-12 md:h-10 text-base"
                  onFocus={handleInputFocus as any}
                >
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="py-3">
                    Nenhuma
                  </SelectItem>
                  {oportunidades.map((o) => (
                    <SelectItem key={o.id} value={o.id} className="py-3">
                      {o.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-base md:text-sm font-medium">
                  Empresa
                </label>
                <Select
                  value={formData.empresa_id}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, empresa_id: v }))
                  }
                >
                  <SelectTrigger
                    className="h-12 md:h-10 text-base"
                    onFocus={handleInputFocus as any}
                  >
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="py-3">
                      Nenhuma
                    </SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="py-3">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-base md:text-sm font-medium">
                  Contato
                </label>
                <Select
                  value={formData.contato_id}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, contato_id: v }))
                  }
                >
                  <SelectTrigger
                    className="h-12 md:h-10 text-base"
                    onFocus={handleInputFocus as any}
                  >
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="py-3">
                      Nenhum
                    </SelectItem>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="py-3">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-base md:text-sm font-medium">
                Descrição
              </label>
              <Textarea
                rows={3}
                className="text-base md:text-sm p-3 min-h-[100px]"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, descricao: e.target.value }))
                }
                onFocus={handleInputFocus}
                placeholder="Detalhes da atividade..."
              />
            </div>

            {hasIntegration && (
              <div className="flex items-center space-x-3 bg-blue-50/50 p-4 md:p-3 rounded-xl md:rounded-lg border border-blue-100 mt-2">
                <Checkbox
                  id="sync-google"
                  className="w-5 h-5 md:w-4 md:h-4"
                  checked={syncGoogle}
                  onCheckedChange={(c) => setSyncGoogle(!!c)}
                />
                <label
                  htmlFor="sync-google"
                  className="text-base md:text-sm font-medium text-blue-800 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Sincronizar com Google Calendar
                </label>
              </div>
            )}
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-row items-center gap-3 sticky bottom-0 z-10 w-full mt-auto">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-12 md:h-10 text-base"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="activity-form"
            disabled={loading}
            className="flex-1 bg-black text-white hover:bg-gray-800 h-12 md:h-10 text-base"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 md:w-4 md:h-4 mr-2 animate-spin" />
            ) : null}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
