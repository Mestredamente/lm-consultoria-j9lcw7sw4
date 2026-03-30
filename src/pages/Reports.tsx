import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import VendasReport from '@/components/reports/VendasReport'
import AtividadesReport from '@/components/reports/AtividadesReport'
import { PropostasReport } from '@/components/reports/PropostasReport'
import { FunilReport } from '@/components/reports/FunilReport'
import { BarChart3 } from 'lucide-react'

export default function Reports() {
  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg shrink-0 text-white">
            <BarChart3 className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Relatórios
            </h1>
            <p className="text-muted-foreground mt-1 text-sm hidden md:block">
              Analise a performance de vendas e produtividade da equipe.
            </p>
          </div>
        </div>
      </div>

      <div className="w-[calc(100vw-2rem)] md:w-full overflow-x-hidden">
        <Tabs defaultValue="vendas" className="w-full">
          <div className="overflow-x-auto pb-2 mb-4 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="bg-white/60 border border-white/50 p-1.5 rounded-xl inline-flex w-max shadow-sm">
              <TabsTrigger
                value="vendas"
                className="rounded-lg px-6 py-2.5 data-[state=active]:bg-black data-[state=active]:text-white text-base md:text-sm font-medium"
              >
                Vendas
              </TabsTrigger>
              <TabsTrigger
                value="atividades"
                className="rounded-lg px-6 py-2.5 data-[state=active]:bg-black data-[state=active]:text-white text-base md:text-sm font-medium"
              >
                Atividades
              </TabsTrigger>
              <TabsTrigger
                value="propostas"
                className="rounded-lg px-6 py-2.5 data-[state=active]:bg-black data-[state=active]:text-white text-base md:text-sm font-medium"
              >
                Propostas
              </TabsTrigger>
              <TabsTrigger
                value="funil"
                className="rounded-lg px-6 py-2.5 data-[state=active]:bg-black data-[state=active]:text-white text-base md:text-sm font-medium"
              >
                Funil Comercial
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="vendas" className="mt-0 outline-none">
            <VendasReport />
          </TabsContent>
          <TabsContent value="atividades" className="mt-0 outline-none">
            <AtividadesReport />
          </TabsContent>
          <TabsContent value="propostas" className="mt-0 outline-none">
            <PropostasReport />
          </TabsContent>
          <TabsContent value="funil" className="mt-0 outline-none">
            <FunilReport />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
