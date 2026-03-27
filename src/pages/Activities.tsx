import { useState } from 'react'
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
} from 'lucide-react'
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useActivities, Atividade } from '@/contexts/ActivitiesContext'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarGrid } from '@/components/activities/CalendarGrid'
import { ActivityDialog } from '@/components/activities/ActivityDialog'
import { ActivityDetailsDialog } from '@/components/activities/ActivityDetailsDialog'

export default function Activities() {
  const { activities, usuarios, loading } = useActivities()
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedResponsible, setSelectedResponsible] = useState('all')
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Atividade | null>(
    null,
  )

  const handlePrev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }

  const handleNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }

  const filteredActivities = activities.filter(
    (a) =>
      selectedResponsible === 'all' || a.responsavel_id === selectedResponsible,
  )

  const dateLabel = () => {
    if (view === 'month')
      return format(currentDate, 'MMMM yyyy', { locale: ptBR })
    if (view === 'week')
      return `Semana de ${format(currentDate, 'dd MMM', { locale: ptBR })}`
    return format(currentDate, "dd 'de' MMMM, yyyy", { locale: ptBR })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh] text-muted-foreground animate-pulse">
        Carregando calendário...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-black" />
            Atividades
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie compromissos e tarefas do seu time
          </p>
        </div>
        <Button
          onClick={() => setIsNewOpen(true)}
          className="bg-black text-white hover:bg-gray-800 rounded-full px-6 shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" /> Nova Atividade
        </Button>
      </div>

      <div className="glass-card rounded-[24px] p-6 flex-1 flex flex-col min-h-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-xl border border-gray-200 w-full md:w-auto overflow-x-auto">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className={
                view === 'month'
                  ? 'bg-black text-white rounded-lg shadow'
                  : 'rounded-lg'
              }
            >
              Mês
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
              className={
                view === 'week'
                  ? 'bg-black text-white rounded-lg shadow'
                  : 'rounded-lg'
              }
            >
              Semana
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('day')}
              className={
                view === 'day'
                  ? 'bg-black text-white rounded-lg shadow'
                  : 'rounded-lg'
              }
            >
              Dia
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-48">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <Select
                value={selectedResponsible}
                onValueChange={setSelectedResponsible}
              >
                <SelectTrigger className="bg-white/50 border-gray-200 h-9 w-full">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                className="h-9 w-9 rounded-full border-gray-200 bg-white/50 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-gray-900 min-w-[150px] text-center capitalize text-sm sm:text-base">
                {dateLabel()}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="h-9 w-9 rounded-full border-gray-200 bg-white/50 shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <CalendarGrid
            currentDate={currentDate}
            view={view}
            activities={filteredActivities}
            onActivityClick={setSelectedActivity}
          />
        </div>
      </div>

      <ActivityDialog open={isNewOpen} onOpenChange={setIsNewOpen} />
      {selectedActivity && (
        <ActivityDetailsDialog
          activity={selectedActivity}
          open={!!selectedActivity}
          onOpenChange={(o) => !o && setSelectedActivity(null)}
        />
      )}
    </div>
  )
}
