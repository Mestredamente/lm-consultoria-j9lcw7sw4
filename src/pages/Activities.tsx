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
import { useIsMobile } from '@/hooks/use-mobile'

export default function Activities() {
  const { activities, usuarios, loading } = useActivities()
  const isMobile = useIsMobile()
  const [view, setView] = useState<'month' | 'week' | 'day'>(
    isMobile ? 'day' : 'month',
  )
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
      <div className="flex flex-col items-center justify-center h-[80vh] text-muted-foreground gap-4">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
        <span>Carregando calendário...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-100px)] space-y-4 md:space-y-6 animate-in fade-in">
      <div className="flex flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
            <CalendarIcon className="w-6 h-6 md:w-8 md:h-8 text-black" />
            Atividades
          </h1>
          <p className="text-muted-foreground mt-1 text-sm hidden md:block">
            Gerencie compromissos e tarefas do seu time
          </p>
        </div>
        <Button
          onClick={() => setIsNewOpen(true)}
          className="bg-black text-white hover:bg-gray-800 rounded-full px-4 py-2 md:px-6 shadow-lg h-auto"
        >
          <Plus className="w-5 h-5 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Nova Atividade</span>
        </Button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-[24px] border border-white/50 shadow-sm p-4 md:p-6 flex-1 flex flex-col min-h-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 md:mb-6">
          <div className="flex items-center gap-1.5 md:gap-2 bg-white/80 p-1 md:p-1.5 rounded-xl border border-gray-200 w-full md:w-auto overflow-x-auto shadow-sm">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className={
                view === 'month'
                  ? 'bg-black text-white rounded-lg shadow px-4 md:px-3 text-base md:text-sm h-10 md:h-8 flex-1 md:flex-none'
                  : 'rounded-lg text-gray-600 px-4 md:px-3 text-base md:text-sm h-10 md:h-8 flex-1 md:flex-none'
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
                  ? 'bg-black text-white rounded-lg shadow px-4 md:px-3 text-base md:text-sm h-10 md:h-8 flex-1 md:flex-none'
                  : 'rounded-lg text-gray-600 px-4 md:px-3 text-base md:text-sm h-10 md:h-8 flex-1 md:flex-none'
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
                  ? 'bg-black text-white rounded-lg shadow px-4 md:px-3 text-base md:text-sm h-10 md:h-8 flex-1 md:flex-none'
                  : 'rounded-lg text-gray-600 px-4 md:px-3 text-base md:text-sm h-10 md:h-8 flex-1 md:flex-none'
              }
            >
              Dia
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-48">
              <Filter className="w-5 h-5 md:w-4 md:h-4 text-gray-400 shrink-0" />
              <Select
                value={selectedResponsible}
                onValueChange={setSelectedResponsible}
              >
                <SelectTrigger className="bg-white border-gray-200 h-12 md:h-9 w-full text-base">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="py-3 md:py-1">
                    Todos
                  </SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem
                      key={u.id}
                      value={u.id}
                      className="py-3 md:py-1"
                    >
                      {u.nome || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto gap-3 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrev}
                className="h-10 w-10 md:h-8 md:w-8 rounded-lg shrink-0 hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5 md:w-4 md:h-4 text-gray-700" />
              </Button>
              <span className="font-bold text-gray-900 min-w-[150px] text-center capitalize text-base">
                {dateLabel()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="h-10 w-10 md:h-8 md:w-8 rounded-lg shrink-0 hover:bg-gray-100"
              >
                <ChevronRight className="w-5 h-5 md:w-4 md:h-4 text-gray-700" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-white rounded-xl border border-gray-100 shadow-inner">
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
