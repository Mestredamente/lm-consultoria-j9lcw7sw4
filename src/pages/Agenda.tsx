import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CalendarDays,
  Clock,
  Video,
  Trash2,
  CheckCircle,
  Share2,
  AlertCircle,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'

export default function Agenda() {
  const { user } = useAuth()
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState<any>(null)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    if (!user) return
    fetchAgendamentos()

    const channel = supabase
      .channel('realtime_agendamentos')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agendamentos',
          filter: `usuario_id=eq.${user.id}`,
        },
        () => {
          fetchAgendamentos()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const fetchAgendamentos = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('agendamentos')
      .select('*, pacientes(nome, telefone)')
      .eq('usuario_id', user?.id)
      .order('data_hora', { ascending: true })
    setAgendamentos(data || [])
    setLoading(false)
  }

  const handlePresence = async (appt: any) => {
    try {
      await supabase
        .from('agendamentos')
        .update({ status: 'compareceu' })
        .eq('id', appt.id)

      const mes = new Date(appt.data_hora).getMonth() + 1
      const ano = new Date(appt.data_hora).getFullYear()

      await supabase.from('financeiro').insert({
        usuario_id: user?.id,
        paciente_id: appt.paciente_id,
        mes,
        ano,
        valor_a_receber: appt.valor_total || 0,
        valor_recebido: 0,
        status: 'pendente',
      })

      toast.success(
        'Presença confirmada. Fatura pendente gerada automaticamente!',
      )
    } catch (err: any) {
      toast.error('Erro ao confirmar presença: ' + err.message)
    }
  }

  const handleCancel = async () => {
    if (!selectedAppt) return
    try {
      await supabase
        .from('agendamentos')
        .update({
          status: 'desmarcou',
          motivo_cancelamento: cancelReason,
        })
        .eq('id', selectedAppt.id)

      if (selectedAppt.pacientes?.telefone) {
        supabase.functions.invoke('enviar_mensagem_whatsapp', {
          body: {
            tipo_whatsapp: 'padrao',
            telefone: selectedAppt.pacientes.telefone,
            mensagem: `Sua sessão de ${format(parseISO(selectedAppt.data_hora), "dd/MM 'às' HH:mm")} foi cancelada. Motivo: ${cancelReason}`,
            usuario_id: user?.id,
          },
        })
      }

      await supabase.from('notificacoes').insert({
        usuario_id: user?.id,
        titulo: 'Sessão Cancelada',
        mensagem: `Paciente ${selectedAppt.pacientes?.nome} teve a sessão cancelada. Motivo: ${cancelReason}`,
        tipo: 'cancelamento',
      })

      toast.success('Agendamento cancelado com sucesso')
      setCancelModalOpen(false)
      setCancelReason('')
      setSelectedAppt(null)
    } catch (err: any) {
      toast.error('Erro ao cancelar: ' + err.message)
    }
  }

  const shareLink = async (appt: any) => {
    const link = appt.link_sala_virtual || 'https://meet.jit.si/mock-room'
    const msg = `Olá ${appt.pacientes?.nome}, sua sessão virtual está pronta! Acesse aqui: ${link}. Você entrará em sala de espera até eu aprová-lo.`

    try {
      await navigator.clipboard.writeText(msg)
      toast.success('Link copiado para a área de transferência')

      if (appt.pacientes?.telefone) {
        supabase.functions.invoke('enviar_mensagem_whatsapp', {
          body: {
            tipo_whatsapp: 'padrao',
            telefone: appt.pacientes.telefone,
            mensagem: msg,
            usuario_id: user?.id,
          },
        })
        toast.success('Link enviado para o WhatsApp do paciente')
      }
    } catch (err) {
      toast.error('Erro ao compartilhar link')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white shadow-lg">
          <CalendarDays className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Agenda Clínica
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie consultas, presenças e salas virtuais.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agendamentos.map((appt) => (
            <Card
              key={appt.id}
              className="relative overflow-hidden border-gray-100 hover:shadow-md transition-all duration-300 group"
            >
              {appt.risco_cancelamento === 'alto' && (
                <div className="absolute top-0 inset-x-0 h-1.5 bg-red-500" />
              )}
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="pr-8">
                    <h3 className="font-bold text-lg leading-tight text-gray-900 truncate">
                      {appt.pacientes?.nome || 'Sem Nome'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-2 font-medium">
                      <Clock className="w-4 h-4 text-blue-500" />
                      {format(
                        parseISO(appt.data_hora),
                        "dd/MM/yyyy 'às' HH:mm",
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      appt.status === 'agendado'
                        ? 'default'
                        : appt.status === 'compareceu'
                          ? 'secondary'
                          : 'destructive'
                    }
                    className="capitalize shadow-sm"
                  >
                    {appt.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm font-medium py-3 border-y border-gray-50">
                  <span className="text-gray-500">Valor da Sessão</span>
                  <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md">
                    {formatCurrency(appt.valor_total)}
                  </span>
                </div>

                {appt.risco_cancelamento === 'alto' && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Risco alto de cancelamento identificado pela IA.
                  </div>
                )}

                {appt.status === 'agendado' && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Button
                      onClick={() => handlePresence(appt)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-sm gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Presença
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => shareLink(appt)}
                      className="w-full gap-2 border-gray-200"
                    >
                      <Share2 className="w-4 h-4 text-blue-600" /> Link
                    </Button>
                    <Button
                      variant="secondary"
                      className="col-span-2 gap-2 bg-black text-white hover:bg-gray-800"
                    >
                      <Video className="w-4 h-4" /> Iniciar Sessão Virtual
                    </Button>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setSelectedAppt(appt)
                    setCancelModalOpen(true)
                  }}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {agendamentos.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
              <CalendarDays className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-gray-600">
                Nenhum agendamento encontrado.
              </p>
              <p className="text-sm">Sua agenda está livre no momento.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Confirmar Cancelamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600 font-medium">
              Tem certeza que deseja cancelar este agendamento? Esta ação
              notificará o paciente via WhatsApp.
            </p>
            <div className="space-y-2">
              <Label className="font-bold">Motivo do Cancelamento</Label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Imprevisto de força maior..."
                className="h-12"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
