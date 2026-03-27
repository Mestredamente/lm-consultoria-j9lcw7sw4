import React, { useState, useEffect, useMemo } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  Target,
  BarChart3,
  LogOut,
  Menu,
  X,
  Settings,
  Bell,
  Search,
  Briefcase,
  CheckSquare,
  FileText,
  CalendarDays,
  Zap,
} from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { useActivities } from '@/contexts/ActivitiesContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { isToday, parseISO, addHours } from 'date-fns'

const NAVIGATION = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Minha Agenda', href: '/my-agenda', icon: CalendarDays },
  { name: 'Pipeline', href: '/leads', icon: Target },
  { name: 'Empresas', href: '/companies', icon: Building2 },
  { name: 'Contatos', href: '/contacts', icon: Users },
  { name: 'Propostas', href: '/proposals', icon: FileText },
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { name: 'Atividades', href: '/activities', icon: Briefcase },
  { name: 'Automações', href: '/automations', icon: Zap },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const { activities } = useActivities()
  const { toast } = useToast()

  const myActivities = useMemo(
    () => activities.filter((a) => a.responsavel_id === user?.id),
    [activities, user?.id],
  )

  useEffect(() => {
    if (!user) return

    const now = new Date()
    const in24h = addHours(now, 24)

    const upcoming = myActivities.filter((a) => {
      if (a.status === 'Concluída' || a.status === 'Cancelada') return false
      if (!a.data_agendada) return false
      const date = parseISO(a.data_agendada)
      return date > now && date <= in24h
    })

    upcoming.forEach((a) => {
      const shownKey = `notified_24h_${a.id}`
      if (!localStorage.getItem(shownKey)) {
        toast({
          title: 'Lembrete de Atividade 🕒',
          description: `${a.titulo} está agendada para as próximas 24 horas.`,
        })
        localStorage.setItem(shownKey, 'true')
      }
    })
  }, [myActivities, user, toast])

  const todaysActivities = useMemo(
    () =>
      myActivities
        .filter((a) => {
          if (a.status !== 'Agendada') return false
          if (!a.data_agendada) return false
          return isToday(parseISO(a.data_agendada))
        })
        .sort(
          (a, b) =>
            new Date(a.data_agendada!).getTime() -
            new Date(b.data_agendada!).getTime(),
        ),
    [myActivities],
  )

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:sticky top-0 z-50 h-screen w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out shadow-sm md:shadow-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-100 justify-between md:justify-center">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-gray-900 tracking-tight"
          >
            <div className="bg-black text-white p-1.5 rounded-lg">
              <Target className="w-5 h-5" />
            </div>
            <span>LM Consultoria</span>
          </Link>
          <button
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Menu Principal
          </div>
          {NAVIGATION.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5',
                    isActive ? 'text-white' : 'text-gray-500',
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 px-2 py-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-800 to-black flex items-center justify-center flex-shrink-0 shadow-sm text-white">
              <span className="text-sm font-bold">
                {user?.email?.[0].toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.user_metadata?.name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 z-10 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <button
              className="md:hidden text-gray-500 hover:text-gray-900 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Busca global..."
                className="w-full bg-gray-50/50 border-gray-200 pl-10 rounded-full h-10 focus-visible:ring-black transition-all text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 ml-4">
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-gray-400 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors relative">
                  <Bell className="w-5 h-5" />
                  {todaysActivities.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h4 className="font-semibold text-sm text-gray-900">
                    Atividades de Hoje
                  </h4>
                  <Badge
                    variant="secondary"
                    className="bg-white border-gray-200 text-gray-700 shadow-sm"
                  >
                    {todaysActivities.length}
                  </Badge>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-1">
                  {todaysActivities.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500 text-center">
                      Nenhuma atividade pendente para hoje. 🎉
                    </div>
                  ) : (
                    todaysActivities.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 mx-1 my-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => navigate('/my-agenda')}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {a.titulo}
                          </p>
                          <span className="text-xs font-medium text-gray-500 shrink-0 bg-white px-1.5 py-0.5 rounded shadow-sm border border-gray-100">
                            {a.data_agendada
                              ? new Date(a.data_agendada).toLocaleTimeString(
                                  'pt-BR',
                                  { hour: '2-digit', minute: '2-digit' },
                                )
                              : ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{a.tipo}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs font-medium"
                    onClick={() => navigate('/my-agenda')}
                  >
                    Ver Minha Agenda Completa
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <button className="text-gray-400 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors hidden sm:block">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/50">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
