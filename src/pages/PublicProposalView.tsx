import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  CheckCircle,
  XCircle,
  FileText,
  Building2,
  User,
  Phone,
  Mail,
} from 'lucide-react'

export default function PublicProposalView() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id) fetchProposal()
  }, [id])

  const fetchProposal = async () => {
    try {
      setLoading(true)
      const { data: res, error } = await supabase.rpc('get_public_proposal', {
        p_proposta_id: id,
      })
      if (error) throw error
      if (!res) throw new Error('Proposta não encontrada.')
      setData(res)

      // Registra visualização caso ainda não tenha sido vista
      if (res.proposta?.status === 'Enviada') {
        fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rastrear-visualizacao-proposta?id=${id}`,
        ).catch(() => {})
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (status: string) => {
    try {
      setIsSubmitting(true)
      const { error } = await supabase.rpc('respond_public_proposal', {
        p_proposta_id: id,
        p_status: status,
        p_comentario: comment,
      })
      if (error) throw error
      toast.success(`Proposta ${status.toLowerCase()} com sucesso!`)
      fetchProposal()
    } catch (err: any) {
      toast.error('Erro ao registrar resposta: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )

  if (!data)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500">
        <Card className="p-8">
          <p className="text-center font-medium">
            Proposta indisponível ou não encontrada.
          </p>
        </Card>
      </div>
    )

  const { proposta, itens, empresa, consultorio } = data
  const isResponded =
    proposta.status === 'Aceita' || proposta.status === 'Rejeitada'

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 flex justify-center fade-in pb-20">
      <Card className="w-full max-w-4xl shadow-xl border-0 overflow-hidden">
        <div className="h-2 w-full bg-primary" />
        <CardHeader className="bg-white border-b border-gray-100 p-8 sm:p-10">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-4">
              {consultorio.logo_url ? (
                <img
                  src={consultorio.logo_url}
                  alt={consultorio.nome_consultorio}
                  className="h-12 object-contain"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {consultorio.nome_consultorio}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" /> {consultorio.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />{' '}
                    {consultorio.telefone_consultorio}
                  </span>
                </div>
              </div>
            </div>
            <div className="md:text-right bg-gray-50 p-4 rounded-xl border border-gray-100 min-w-[200px]">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Proposta Comercial
              </p>
              <div className="text-2xl font-black text-primary mt-1">
                {proposta.numero_proposta}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Data:{' '}
                {new Date(proposta.data_emissao).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 sm:p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Preparado para
              </h3>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {empresa.nome || 'Cliente'}
                  </p>
                </div>
              </div>
            </div>

            {proposta.condicoes_pagamento && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Condições de Pagamento
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                  {proposta.condicoes_pagamento}
                </p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
              <FileText className="w-5 h-5 text-gray-400" /> Detalhamento de
              Serviços
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 text-gray-600 border-b border-t border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-1/2">Descrição</th>
                    <th className="px-4 py-3 font-semibold text-center">Qtd</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Valor Un.
                    </th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {itens.map((item: any, i: number) => (
                    <tr
                      key={i}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900 text-base">
                          {item.tipo_servico}
                        </div>
                        {item.descricao && (
                          <div className="text-gray-500 mt-1">
                            {item.descricao}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-medium text-gray-700">
                        {item.quantidade}
                      </td>
                      <td className="px-4 py-4 text-right text-gray-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.valor_unitario)}
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(
                          item.subtotal ||
                            item.quantidade * item.valor_unitario,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50/50">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-right font-bold text-gray-700 text-lg"
                    >
                      Total do Investimento:
                    </td>
                    <td className="px-4 py-6 text-right font-black text-2xl text-primary">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(proposta.valor_total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {!isResponded ? (
            <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 space-y-6 text-white shadow-xl">
              <div className="text-center max-w-lg mx-auto">
                <h3 className="text-xl font-bold mb-2">
                  Qual o próximo passo?
                </h3>
                <p className="text-slate-300 text-sm">
                  Deixe um comentário caso haja alguma dúvida ou condição
                  especial, e nos informe se deseja aprovar esta proposta para
                  darmos início aos trabalhos.
                </p>
              </div>

              <Textarea
                placeholder="Ex: De acordo com os valores. Aguardo o contrato."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20 min-h-[100px]"
              />

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button
                  onClick={() => handleRespond('Aceita')}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white h-14 text-base font-semibold shadow-lg shadow-green-500/20"
                >
                  <CheckCircle className="w-5 h-5 mr-2" /> Aceitar Proposta
                </Button>
                <Button
                  onClick={() => handleRespond('Rejeitada')}
                  disabled={isSubmitting}
                  variant="outline"
                  className="flex-1 bg-transparent text-white border-white/20 hover:bg-white/10 h-14 text-base"
                >
                  <XCircle className="w-5 h-5 mr-2" /> Recusar
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`rounded-2xl p-8 border-2 ${proposta.status === 'Aceita' ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'} text-center shadow-sm`}
            >
              <div className="flex justify-center mb-4">
                {proposta.status === 'Aceita' ? (
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold mb-2">
                Proposta {proposta.status}
              </h3>
              <p className="text-sm opacity-80 mb-6">
                Agradecemos o seu retorno. Nossa equipe foi notificada.
              </p>

              {proposta.comentarios_cliente && (
                <div className="max-w-xl mx-auto bg-white p-5 rounded-xl border border-current shadow-sm text-left">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
                    Seu Comentário
                  </p>
                  <p className="italic font-medium leading-relaxed">
                    "{proposta.comentarios_cliente}"
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
