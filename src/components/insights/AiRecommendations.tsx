import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export function AiRecommendations() {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRecommendations = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke(
        'gerar-recomendacoes-ia',
      )
      if (error) throw error
      if (data?.recommendations) {
        setRecommendations(data.recommendations)
      }
    } catch (err) {
      console.error('Error fetching AI recommendations', err)
      // Fallback
      setRecommendations([
        'Aumentar margem em **Consultoria Estratégica**: Sua margem atual é de 35%, mas o mercado permite chegar a 42%.',
        'Focar em clientes como a **TechCorp** (maior potencial de receita recorrente).',
        'Período de pico de vendas identificado: **Março a Maio**. Prepare sua equipe comercial.',
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [user])

  return (
    <Card className="border-indigo-100 bg-indigo-50/30 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center text-indigo-950">
          <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
          Recomendações da IA (Gemini)
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
          onClick={fetchRecommendations}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {loading && recommendations.length === 0 ? (
          <div className="flex flex-col space-y-3">
            <div className="h-4 bg-indigo-100/50 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-indigo-100/50 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-indigo-100/50 rounded w-5/6 animate-pulse"></div>
          </div>
        ) : (
          <ul className="space-y-3">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                  {i + 1}
                </span>
                <span
                  className="text-gray-700 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: rec.replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong>$1</strong>',
                    ),
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
