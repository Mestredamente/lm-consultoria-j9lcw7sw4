import { TrendingUp, Users, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function Metrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="flex items-center justify-between p-1 px-2 pr-6 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gray-100 p-3 rounded-full">
            <TrendingUp className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">$1,980,130</p>
            <p className="text-xs text-gray-500">Valores Ganhos</p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="bg-yellow-300/50 hover:bg-yellow-300/60 text-yellow-800 border-0"
        >
          +11% sem
        </Badge>
      </div>

      <div className="flex items-center justify-between p-1 px-2 pr-6 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gray-100 p-3 rounded-full">
            <Users className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">+89</p>
            <p className="text-xs text-gray-500">Novos Clientes</p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="bg-blue-200/50 hover:bg-blue-200/60 text-blue-800 border-0"
        >
          +12 hoje
        </Badge>
      </div>

      <div className="flex items-center justify-between p-1 px-2 pr-6 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-gray-100 p-3 rounded-full">
            <CheckCircle className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">+31</p>
            <p className="text-xs text-gray-500">Tarefas Concluídas</p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="bg-green-200/50 hover:bg-green-200/60 text-green-800 border-0"
        >
          +6 hoje
        </Badge>
      </div>
    </div>
  )
}
