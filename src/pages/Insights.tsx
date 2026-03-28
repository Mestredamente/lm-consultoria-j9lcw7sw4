import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Lightbulb, TrendingUp, Target } from 'lucide-react'
import { BehavioralAnalysis } from '@/components/insights/BehavioralAnalysis'
import { RevenueForecast } from '@/components/insights/RevenueForecast'
import { AiRecommendations } from '@/components/insights/AiRecommendations'

export default function Insights() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0 text-white">
            <Lightbulb className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Insights & Previsões
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Inteligência analítica e IA para tomada de decisão estratégica.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="behavioral" className="w-full">
        <TabsList className="bg-white/50 border border-gray-200 p-1 rounded-xl mb-6 flex-wrap h-auto gap-2">
          <TabsTrigger
            value="behavioral"
            className="rounded-lg px-6 data-[state=active]:bg-black data-[state=active]:text-white"
          >
            <Target className="w-4 h-4 mr-2" /> Análise Comportamental
          </TabsTrigger>
          <TabsTrigger
            value="revenue"
            className="rounded-lg px-6 data-[state=active]:bg-black data-[state=active]:text-white"
          >
            <TrendingUp className="w-4 h-4 mr-2" /> Previsão de Receita
          </TabsTrigger>
        </TabsList>

        <TabsContent value="behavioral" className="mt-0 outline-none space-y-6">
          <AiRecommendations />
          <BehavioralAnalysis />
        </TabsContent>

        <TabsContent value="revenue" className="mt-0 outline-none">
          <RevenueForecast />
        </TabsContent>
      </Tabs>
    </div>
  )
}
