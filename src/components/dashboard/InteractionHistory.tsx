import { ArrowUpRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const interactions = [
  {
    date: '4 Out',
    title: 'Pacote Royal',
    subtitle: 'Oportunidade',
    value: '11,250$',
    color: 'bg-blue-600',
    text: 'text-white',
    users: [1, 2, 3],
  },
  {
    date: '16 Out',
    title: 'Terceiro Negócio',
    subtitle: 'Mais Útil',
    value: '21,300$',
    color: 'bg-teal-700/80',
    text: 'text-white',
    users: [4, 5, 6],
  },
  {
    date: '12 Out',
    title: 'Sucesso Absoluto',
    subtitle: 'Negócio Fechado',
    value: '2,100$',
    color: 'bg-black',
    text: 'text-white',
    users: [7, 8],
    action: true,
  },
  {
    date: '11 Out',
    title: 'Pacote Royal',
    subtitle: 'Oportunidade',
    value: '4,160$',
    color: 'bg-yellow-400',
    text: 'text-black',
    users: [1, 9],
  },
  {
    date: '2 Out',
    title: 'Serviços Adaptativos',
    subtitle: 'Negócios',
    value: '3,140$',
    color: 'bg-white/60',
    text: 'text-gray-900',
    users: [10, 11],
    glass: true,
  },
  {
    date: '2 Out',
    title: 'Segundo Negócio',
    subtitle: 'Serviço Comum',
    value: '12,350$',
    color: 'bg-white/60',
    text: 'text-gray-900',
    users: [12, 13, 14],
    glass: true,
  },
]

export function InteractionHistory() {
  return (
    <div className="glass-card p-6 rounded-[32px] mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-800">
          Histórico de Interação
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowUpRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {interactions.map((item, idx) => (
          <div
            key={idx}
            className={cn(
              'relative p-5 rounded-[24px] flex flex-col justify-between h-40 transition-transform hover:-translate-y-1 hover:shadow-lg',
              item.color,
              item.glass
                ? 'backdrop-blur-md border border-white/50'
                : 'shadow-md',
              item.text,
            )}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium opacity-80">
                {item.date}
              </span>
              {item.action ? (
                <div className="bg-white rounded-full p-2 text-black cursor-pointer hover:scale-110 transition-transform">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              ) : (
                <MoreHorizontal className="w-5 h-5 opacity-60" />
              )}
            </div>

            <div className="mt-2">
              <h3 className="font-bold text-lg leading-tight">{item.title}</h3>
              <p className="text-xs opacity-70 mb-3">{item.subtitle}</p>

              <div className="flex justify-between items-end">
                <span className="text-xl font-bold">{item.value}</span>
                <div className="flex -space-x-2">
                  {item.users.map((u, i) => (
                    <Avatar
                      key={i}
                      className="w-7 h-7 border-2 border-white/20"
                    >
                      <AvatarImage
                        src={`https://img.usecurling.com/ppl/thumbnail?gender=${i % 2 === 0 ? 'male' : 'female'}&seed=${u}`}
                      />
                      <AvatarFallback>U{u}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
