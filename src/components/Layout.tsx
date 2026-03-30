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
  Settings,
  Bell,
  Search,
  Briefcase,
  CheckSquare,
  FileText,
  CalendarDays,
  Zap,
  ChevronLeft,
  FolderOpen,
  WifiOff,
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
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

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
  { name: 'Documentos', href: '/documents', icon: FolderOpen },
  { name: 'Configurações', href: '/settings', icon: Settings },
]

const BOTTOM_NAV_PATHS = [
  '/',
  '/proposals',
  '/contacts',
  '/companies',
  '/activities',
  '/settings',
]

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut, user, role } = useAuth()
  const { activities } = useActivities()
  const { toast } = useToast()
  const isMobile = useIsMobile()

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const filteredNav = useMemo(() => {
    return NAVIGATION.filter((item) => {
      if (role === 'vendedor') {
        return !['/reports', '/automations'].includes(item.href)
      }
      if (role === 'gerente') {
        return !['/automations'].includes(item.href)
      }
      return true
    })
  }, [role])

  const bottomNavItems = useMemo(() => {
    return filteredNav.filter((item) => BOTTOM_NAV_PATHS.includes(item.href))
  }, [filteredNav])

  const extraNavItems = useMemo(() => {
    return filteredNav.filter((item) => !BOTTOM_NAV_PATHS.includes(item.href))
  }, [filteredNav])

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

  const currentPageName = useMemo(() => {
    const item = NAVIGATION.find((n) => n.href === location.pathname)
    return item ? item.name : ''
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col md:flex-row font-sans">
      {isOffline && (
        <div className="fixed top-0 inset-x-0 bg-red-500 text-white text-xs text-center py-1 z-[100] flex items-center justify-center gap-2">
          <WifiOff className="w-3 h-3" /> Você está offline.
        </div>
      )}

      {!isMobile && (
        <aside className="sticky top-0 z-50 h-screen w-64 bg-white border-r border-gray-100 flex flex-col shadow-none">
          <div className="h-16 flex items-center px-6 border-b border-gray-100 justify-center">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-xl text-gray-900 tracking-tight"
            >
              <div className="bg-black text-white p-1.5 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              <span>LM Consultoria</span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-200">
            <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Menu Principal
            </div>
            {filteredNav.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (location.pathname.startsWith(item.href + '/') &&
                  item.href !== '/')
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
                <p className="text-xs text-gray-500 truncate capitalize">
                  {role || 'Vendedor'}
                </p>
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
      )}

      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 h-screen overflow-hidden',
          isMobile ? 'pb-16' : '',
        )}
      >
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 z-10 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3 flex-1">
            {isMobile && location.pathname !== '/' && (
              <button
                onClick={() => navigate(-1)}
                className="text-gray-500 hover:text-gray-900 p-2 -ml-2 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {isMobile && location.pathname === '/' && (
              <div className="flex items-center gap-2 font-bold text-lg text-gray-900 tracking-tight">
                <div className="bg-black text-white p-1 rounded-md">
                  <Target className="w-5 h-5" />
                </div>
                <span>LM CRM</span>
              </div>
            )}

            {isMobile && location.pathname !== '/' && (
              <span className="font-semibold text-gray-900 line-clamp-1">
                {currentPageName}
              </span>
            )}

            <div className="hidden md:flex relative max-w-md w-full ml-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Busca global..."
                className="w-full bg-gray-50/50 border-gray-200 pl-10 rounded-full h-10 focus-visible:ring-black transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-gray-400 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors relative">
                  <Bell className="w-6 h-6 md:w-5 md:h-5" />
                  {todaysActivities.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 mr-2 md:mr-0" align="end">
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
                    className="w-full text-xs font-medium py-3"
                    onClick={() => navigate('/my-agenda')}
                  >
                    Ver Minha Agenda Completa
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {isMobile && (
              <button
                className="text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50/50 relative">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {isMobile && (
        <div className="fixed bottom-0 inset-x-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around z-40 pb-safe">
          {bottomNavItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (location.pathname.startsWith(item.href + '/') &&
                item.href !== '/')
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                  isActive ? 'text-black' : 'text-gray-400',
                )}
              >
                <item.icon
                  className={cn('w-6 h-6', isActive && 'fill-black/10')}
                />
                <span className="text-[10px] font-medium leading-none">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>
      )}

      {isMobile && (
        <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="border-b border-gray-100 pb-4">
              <DrawerTitle className="text-left">Menu Adicional</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto space-y-1">
              {extraNavItems.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium transition-all duration-200',
                      isActive
                        ? 'bg-black text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100',
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon
                      className={cn(
                        'w-6 h-6',
                        isActive ? 'text-white' : 'text-gray-500',
                      )}
                    />
                    {item.name}
                  </Link>
                )
              })}

              <div className="pt-6 mt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl py-6 text-base"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleSignOut()
                  }}
                >
                  <LogOut className="w-6 h-6 mr-3" />
                  Sair
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
