import { ArrowLeft, ArrowRight, Expand, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

export function TaskSchedule() {
  return (
    <div className="glass-card p-6 rounded-[32px] h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Agenda de Tarefas</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full w-8 h-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full w-8 h-8">
            <Expand className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-8 h-8 bg-transparent border-gray-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-8 h-8 bg-transparent border-gray-300"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <span className="font-semibold text-lg">Outubro</span>
          <div className="w-8"></div>
        </div>

        <Calendar
          mode="single"
          selected={new Date()}
          className="rounded-md w-full"
          classNames={{
            head_row: 'flex w-full justify-between mb-2',
            head_cell:
              'text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]',
            row: 'flex w-full justify-between mt-2',
            cell: cn(
              'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent',
              'first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md',
            ),
            day: cn(
              'h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-lg hover:bg-gray-100 transition-colors',
            ),
            day_selected:
              'bg-blue-600 text-primary-foreground hover:bg-blue-600 hover:text-primary-foreground focus:bg-blue-600 focus:text-primary-foreground',
          }}
        />

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          <div className="bg-blue-600 text-white text-xs px-3 py-2 rounded-xl min-w-[100px]">
            <span className="block font-bold">11:00</span>
            Reunião...
          </div>
          <div className="bg-yellow-400 text-black text-xs px-3 py-2 rounded-xl min-w-[100px]">
            <span className="block font-bold">14:30</span>
            Almoço...
          </div>
        </div>
      </div>
    </div>
  )
}
