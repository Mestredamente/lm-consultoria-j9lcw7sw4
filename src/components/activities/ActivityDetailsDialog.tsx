import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Atividade,
  useActivities,
  getActivityColor,
} from '@/contexts/ActivitiesContext'
import { useCompanies } from '@/contexts/CompaniesContext'
import { useContacts } from '@/contexts/ContactsContext'
import { useOportunidades } from '@/contexts/OportunidadesContext'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ActivityDialog } from './ActivityDialog'
import {
  Pencil,
  CalendarIcon,
  Building2,
  User,
  Target,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  activity: Atividade
  open: boolean
  onOpenChange: (o: boolean) => void
}

export function ActivityDetailsDialog({ activity, open, onOpenChange }: Props) {
  const { updateActivity, deleteActivity, usuarios } = useActivities()
  const { companies } = useCompanies()
  const { contacts } = useContacts()
  const { oportunidades } = useOportunidades()
  const [isEditOpen, setIsEditOpen] = useState(false)

  const empresa = companies.find((c) => c.id === activity.empresa_id)
  const contato = contacts.find((c) => c.id === activity.contato_id)
  const oportunidade = oportunidades.find(
    (o) => o.id === activity.oportunidade_id,
  )
  const responsavel = usuarios.find((u) => u.id === activity.responsavel_id)

  const handleComplete = async () => {
    try {
      await updateActivity(activity.id, {
        status: 'Concluída',
        data_conclusao: new Date().toISOString(),
      })
      toast.success('Atividade marcada como concluída!')
      onOpenChange(false)
    } catch (err) {
      toast.error('Erro ao atualizar')
    }
  }

  const handleDelete = async () => {
    if (confirm('Deseja realmente excluir esta atividade?')) {
      try {
        await deleteActivity(activity.id)
        toast.success('Excluída com sucesso!')
        onOpenChange(false)
      } catch (err) {
        toast.error('Erro ao excluir')
      }
    }
  }

  return (
    <>
      <Dialog open={open && !isEditOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <Badge
                className={getActivityColor(activity.tipo)}
                variant="outline"
              >
                {activity.tipo}
              </Badge>
              <Badge
                variant="outline"
                className={
                  activity.status === 'Concluída'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : activity.status === 'Cancelada'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-gray-100 text-gray-700'
                }
              >
                {activity.status}
              </Badge>
            </div>
            <DialogTitle className="text-xl mt-4 mb-2">
              {activity.titulo}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <span>
                {activity.data_agendada
                  ? format(
                      parseISO(activity.data_agendada),
                      "dd 'de' MMMM, HH:mm",
                      { locale: ptBR },
                    )
                  : 'Sem data'}
              </span>
            </div>
            {empresa && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span>{empresa.name}</span>
              </div>
            )}
            {contato && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <User className="w-4 h-4 text-gray-400" />
                <span>{contato.name}</span>
              </div>
            )}
            {oportunidade && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Target className="w-4 h-4 text-gray-400" />
                <span>{oportunidade.nome}</span>
              </div>
            )}
            {responsavel && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                  {responsavel.nome?.[0] ||
                    responsavel.email?.[0]?.toUpperCase()}
                </div>
                <span>
                  Responsável: {responsavel.nome || responsavel.email}
                </span>
              </div>
            )}

            {activity.descricao && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                  Descrição
                </h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                  {activity.descricao}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between gap-2 pt-4 border-t border-gray-100">
            <Button
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" /> Excluir
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                <Pencil className="w-4 h-4 mr-2" /> Editar
              </Button>
              {activity.status !== 'Concluída' && (
                <Button
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={handleComplete}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Concluir
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ActivityDialog
        open={isEditOpen}
        onOpenChange={(o) => {
          setIsEditOpen(o)
          if (!o) onOpenChange(false)
        }}
        activityToEdit={activity}
      />
    </>
  )
}
