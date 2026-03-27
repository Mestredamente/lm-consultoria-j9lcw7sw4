import { Metrics } from '@/components/dashboard/Metrics'
import { InteractionHistory } from '@/components/dashboard/InteractionHistory'
import { TaskSchedule } from '@/components/dashboard/TaskSchedule'
import { SalesFunnel } from '@/components/dashboard/SalesFunnel'
import { RightPanel } from '@/components/dashboard/RightPanel'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export default function Index() {
  const { signOut } = useAuth()

  return (
    <div className="flex items-start">
      <div className="flex-1">
        <div className="flex flex-col">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Informações do Cliente
              </h1>
              <p className="text-muted-foreground">
                Visão geral e métricas principais
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>

          <Metrics />

          <InteractionHistory />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
            <TaskSchedule />
            <SalesFunnel />
          </div>
        </div>
      </div>
      <RightPanel />
    </div>
  )
}
