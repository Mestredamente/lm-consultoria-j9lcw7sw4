import { Expand, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SalesFunnel() {
  return (
    <div className="glass-card p-6 rounded-[32px] h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800">Funil de Vendas</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full w-8 h-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full w-8 h-8">
            <Expand className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-900">$350,500</h3>
        <p className="text-sm text-gray-500">Total em Pipeline</p>
      </div>

      <div className="flex gap-2 mb-6">
        <span className="px-3 py-1 rounded-full bg-gray-200 text-xs font-medium text-gray-700">
          Ponderado
        </span>
        <span className="px-3 py-1 rounded-full bg-transparent border border-gray-300 text-xs font-medium text-gray-500">
          Total
        </span>
      </div>

      <div className="space-y-3 flex-1">
        <div className="bg-gray-100/50 rounded-2xl p-4 relative overflow-hidden group hover:bg-white/60 transition-colors">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">Qualificação</p>
              <p className="font-bold text-gray-800">92,350$</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Expand className="w-3 h-3 text-gray-600" />
            </div>
          </div>
          <div className="absolute left-0 bottom-0 h-1 bg-blue-500 w-[80%]" />
        </div>

        <div className="bg-gray-100/50 rounded-2xl p-4 relative overflow-hidden group hover:bg-white/60 transition-colors ml-4">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">Proposta de Valor</p>
              <p className="font-bold text-gray-800">67,120$</p>
            </div>
          </div>
          <div className="absolute left-0 bottom-0 h-1 bg-yellow-400 w-[60%]" />
        </div>

        <div className="bg-gray-100/50 rounded-2xl p-4 relative overflow-hidden group hover:bg-white/60 transition-colors ml-8">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">Negociação</p>
              <p className="font-bold text-gray-800">28,980$</p>
            </div>
          </div>
          <div className="absolute left-0 bottom-0 h-1 bg-green-500 w-[40%]" />
        </div>
      </div>
    </div>
  )
}
