import { useMemo } from 'react'
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isBefore,
  startOfDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  useActivities,
  getActivityColor,
  Atividade,
} from '@/contexts/ActivitiesContext'
import { useCompanies } from '@/contexts/CompaniesContext'
import { useContacts } from '@/contexts/ContactsContext'
import { useAuth } from '@/hooks/use-auth'
import {
  CheckCircle2,
  CalendarDays,
  Clock,
  Building2,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function MyAgenda() {
  const { activities, updateActivity, loading } = useActivities()
  const { companies } = useCompanies()
  const { contacts } = useContacts()
  const { user } = useAuth()
  const { toast } = useToast()

  const myActivities = useMemo(
    () => activities.filter((a) => a.responsavel_id === user?.id),
    [activities, user?.id],
  )

  const groups = useMemo(() => {
    const now = new Date()
    const todayStart = startOfDay(now)

    const result = {
      overdue: [] as Atividade[],
      today: [] as Atividade[],
      tomorrow: [] as Atividade[],
      upcoming: [] as Atividade[],
      completed: [] as Atividade[],
    }

    myActivities.forEach((a) => {
      if (a.status === 'Concluída') {
        result.completed.push(a)
        return
      }
      if (a.status === 'Cancelada') return

      if (!a.data_agendada) {
        result.upcoming.push(a)
        return
      }

      const date = parseISO(a.data_agendada)

      if (isBefore(date, todayStart)) {
        result.overdue.push(a)
      } else if (isToday(date)) {
        result.today.push(a)
      } else if (isTomorrow(date)) {
        result.tomorrow.push(a)
      } else {
        result.upcoming.push(a)
      }
    })

    const sortByDate = (a: Atividade, b: Atividade) => {
      if (!a.data_agendada) return 1
      if (!b.data_agendada) return -1
      return (
        new Date(a.data_agendada).getTime() -
        new Date(b.data_agendada).getTime()
      )
    }

    const sortByDateDesc = (a: Atividade, b: Atividade) => {
      if (!a.data_conclusao) return 1
      if (!b.data_conclusao) return -1
      return (
        new Date(b.data_conclusao).getTime() -
        new Date(a.data_conclusao).getTime()
      )
    }

    result.overdue.sort(sortByDate)
    result.today.sort(sortByDate)
    result.tomorrow.sort(sortByDate)
    result.upcoming.sort(sortByDate)
    result.completed.sort(sortByDateDesc)

    return result
  }, [myActivities])

  const handleComplete = async (id: string) => {
    try {
      await updateActivity(id, {
        status: 'Concluída',
        data_conclusao: new Date().toISOString(),
      })
      toast({
        title: 'Sucesso',
        description: 'Atividade marcada como concluída.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar atividade.',
        variant: 'destructive',
      })
    }
  }

  const ActivityCard = ({ activity }: { activity: Atividade }) => {
    const empresa = companies.find((c) => c.id === activity.empresa_id)
    const contato = contacts.find((c) => c.id === activity.contato_id)

    return (
      <Card className="hover:shadow-md transition-shadow border-white/60 glass-card">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn('font-medium', getActivityColor(activity.tipo))}
              >
                {activity.tipo}
              </Badge>
              {activity.data_agendada && (
                <span className="flex items-center text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                  <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  {format(parseISO(activity.data_agendada), 'HH:mm', {
                    locale: ptBR,
                  })}
                </span>
              )}
            </div>

            <div>
              <h4 className="font-bold text-gray-900 text-base leading-snug">
                {activity.titulo}
              </h4>
              {activity.descricao && (
                <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {activity.descricao}
                </p>
              )}
            </div>

            {(empresa || contato) && (
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-3 mt-1 border-t border-gray-100/50">
                {empresa && (
                  <span className="flex items-center">
                    <Building2 className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                    {empresa.name}
                  </span>
                )}
                {contato && (
                  <span className="flex items-center">
                    <User className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                    {contato.name}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100/50">
            {activity.status !== 'Concluída' ? (
              <Button
                onClick={() => handleComplete(activity.id)}
                variant="outline"
                className="w-full sm:w-auto bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Concluir
              </Button>
            ) : (
              <div className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50/80 px-3 py-2 rounded-md border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Concluída
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const Section = ({
    title,
    items,
    emptyText,
    highlight = false,
  }: {
    title: string
    items: Atividade[]
    emptyText?: string
    highlight?: boolean
  }) => {
    if (items.length === 0 && !emptyText) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h3
            className={cn(
              'text-lg font-bold flex items-center',
              highlight ? 'text-gray-900' : 'text-gray-600',
            )}
          >
            {title}
          </h3>
          <Badge
            variant="secondary"
            className="bg-white shadow-sm border border-gray-200 text-gray-600"
          >
            {items.length}
          </Badge>
        </div>

        {items.length === 0 ? (
          <div className="bg-gray-50/50 border border-gray-200 border-dashed rounded-xl p-8 text-center text-sm text-gray-500">
            {emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <ActivityCard key={a.id} activity={a} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-[50vh] flex items-center justify-center text-gray-400 animate-pulse">
        Carregando sua agenda...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-sm shrink-0 text-white">
          <CalendarDays className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Minha Agenda
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Acompanhe suas tarefas e compromissos do dia.
          </p>
        </div>
      </div>

      <div className="space-y-10">
        <Section title="⚠️ Em Atraso" items={groups.overdue} />
        <Section
          title="Hoje"
          items={groups.today}
          emptyText="Nenhuma atividade pendente para hoje. Bom trabalho!"
          highlight
        />
        <Section title="Amanhã" items={groups.tomorrow} />
        <Section title="Próximos Dias" items={groups.upcoming} />

        {groups.completed.length > 0 && (
          <div className="pt-8 border-t border-gray-200/60">
            <Section
              title="Recentes Concluídas"
              items={groups.completed.slice(0, 5)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
