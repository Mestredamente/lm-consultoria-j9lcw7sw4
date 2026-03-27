import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  Activity,
  CheckSquare,
  FileText,
  BarChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const navItems = [
  { icon: LayoutDashboard, label: 'Painel', path: '/' },
  { icon: Users, label: 'Leads', path: '/leads' },
  { icon: Building2, label: 'Empresas', path: '/companies' },
  { icon: Kanban, label: 'Pipeline', path: '/pipeline' },
  { icon: Activity, label: 'Atividades', path: '/activities' },
  { icon: CheckSquare, label: 'Tarefas', path: '/tasks' },
  { icon: FileText, label: 'Propostas', path: '/proposals' },
  { icon: BarChart, label: 'Relatórios', path: '/reports' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-4 bg-black/90 text-white py-6 px-3 rounded-full shadow-2xl shadow-black/20">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path
        return (
          <Tooltip key={item.path}>
            <TooltipTrigger asChild>
              <Link
                to={item.path}
                className={cn(
                  'p-3 rounded-full transition-all duration-300 hover:bg-white/20 relative group',
                  isActive
                    ? 'bg-white text-black hover:bg-white'
                    : 'text-white/70',
                )}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-white" />
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-black text-white border-0 ml-2"
            >
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </aside>
  )
}
