import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import VendasReport from '@/components/reports/VendasReport'
import AtividadesReport from '@/components/reports/AtividadesReport'
import { BarChart3 } from 'lucide-react'

export default function Reports() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg shrink-0 text-white">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Relatórios
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Analise a performance de vendas e produtividade da equipe.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="vendas" className="w-full">
        <TabsList className="bg-white/50 border border-gray-200 p-1 rounded-xl mb-6 flex-wrap h-auto gap-2">
          <TabsTrigger
            value="vendas"
            className="rounded-lg px-6 data-[state=active]:bg-black data-[state=active]:text-white"
          >
            Vendas
          </TabsTrigger>
          <TabsTrigger
            value="atividades"
            className="rounded-lg px-6 data-[state=active]:bg-black data-[state=active]:text-white"
          >
            Atividades
          </TabsTrigger>
        </TabsList>
        <TabsContent value="vendas" className="mt-0 outline-none">
          <VendasReport />
        </TabsContent>
        <TabsContent value="atividades" className="mt-0 outline-none">
          <AtividadesReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}
