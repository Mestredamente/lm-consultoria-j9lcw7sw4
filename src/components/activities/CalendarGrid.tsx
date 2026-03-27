import { useMemo } from 'react'
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Atividade, getActivityColor } from '@/contexts/ActivitiesContext'
import { cn } from '@/lib/utils'

interface CalendarGridProps {
  currentDate: Date
  view: 'month' | 'week' | 'day'
  activities: Atividade[]
  onActivityClick: (activity: Atividade) => void
}

export function CalendarGrid({
  currentDate,
  view,
  activities,
  onActivityClick,
}: CalendarGridProps) {
  const days = useMemo(() => {
    let start, end
    if (view === 'month') {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
    } else if (view === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 0 })
      end = endOfWeek(currentDate, { weekStartsOn: 0 })
    } else {
      start = currentDate
      end = currentDate
    }
    return eachDayOfInterval({ start, end })
  }, [currentDate, view])

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {(view === 'month' || view === 'week') && (
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div
              key={d}
              className="p-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>
      )}
      <div
        className={cn(
          'flex-1 overflow-y-auto',
          view === 'month' || view === 'week'
            ? 'grid grid-cols-7 auto-rows-[minmax(120px,1fr)]'
            : 'flex flex-col',
        )}
      >
        {days.map((day, idx) => {
          const dayActivities = activities
            .filter(
              (a) =>
                a.data_agendada && isSameDay(parseISO(a.data_agendada), day),
            )
            .sort(
              (a, b) =>
                new Date(a.data_agendada!).getTime() -
                new Date(b.data_agendada!).getTime(),
            )

          return (
            <div
              key={idx}
              className={cn(
                'border-r border-b border-gray-50 p-2 flex flex-col gap-1 min-h-[120px]',
                !isSameMonth(day, currentDate) &&
                  view === 'month' &&
                  'bg-gray-50/50',
                view === 'day' && 'min-h-[400px] p-6 border-none',
              )}
            >
              <div
                className={cn(
                  'text-sm font-medium mb-1 flex items-center justify-between',
                  !isSameMonth(day, currentDate) && view === 'month'
                    ? 'text-gray-400'
                    : 'text-gray-900',
                  view === 'day' && 'text-xl border-b pb-4 mb-4',
                )}
              >
                <span
                  className={cn(
                    isToday(day) &&
                      'bg-black text-white w-7 h-7 flex items-center justify-center rounded-full',
                  )}
                >
                  {format(day, 'd')}
                </span>
                {view === 'day' && (
                  <span className="text-gray-500 font-normal">
                    {format(day, "EEEE, d 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1">
                {dayActivities.map((act) => (
                  <button
                    key={act.id}
                    onClick={() => onActivityClick(act)}
                    className={cn(
                      'text-left px-2 py-1.5 rounded-md border text-xs font-medium transition-colors hover:opacity-80',
                      getActivityColor(act.tipo),
                      act.status === 'Concluída' && 'opacity-60 line-through',
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold opacity-70 text-[10px] whitespace-nowrap">
                        {format(parseISO(act.data_agendada!), 'HH:mm')}
                      </span>
                      <span className="truncate">{act.titulo}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
