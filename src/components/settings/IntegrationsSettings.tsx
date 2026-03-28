import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Mail,
  Calendar,
  MessageCircle,
  Link as LinkIcon,
  Workflow,
  Settings2,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

const integrationsList = [
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    desc: 'Sincronize atividades e eventos do Google Agenda bidirecionalmente.',
    icon: Calendar,
    hasConfig: false,
    isOAuth: true,
  },
  {
    id: 'google',
    name: 'Google Workspace',
    desc: 'Sincronize e-mails do Google diretamente no seu CRM.',
    icon: Mail,
    hasConfig: false,
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    desc: 'Integre sua caixa de entrada e calendário do Outlook perfeitamente.',
    icon: Calendar,
    hasConfig: false,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp API',
    desc: 'Envie notificações, cobranças e mensagens automatizadas para clientes.',
    icon: MessageCircle,
    hasConfig: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    desc: 'Receba notificações instantâneas de novos negócios e tarefas no Slack.',
    icon: Workflow,
    hasConfig: false,
  },
  {
    id: 'zapier',
    name: 'Zapier',
    desc: 'Conecte o CRM com mais de 3.000 aplicativos através de automações.',
    icon: LinkIcon,
    hasConfig: false,
  },
]

export function IntegrationsSettings() {
  const { user } = useAuth()
  const [activeInts, setActiveInts] = useState<Record<string, boolean>>({
    whatsapp: false,
    google_calendar: false,
  })
  const [configOpen, setConfigOpen] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [waData, setWaData] = useState({
    whatsapp_api_key: '',
    whatsapp_business_phone_id: '',
    whatsapp_business_account_id: '',
  })

  useEffect(() => {
    if (user) fetchSettings()
  }, [user])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(
          'whatsapp_api_key, whatsapp_business_phone_id, whatsapp_business_account_id',
        )
        .eq('id', user?.id)
        .single()

      if (data) {
        setWaData({
          whatsapp_api_key: data.whatsapp_api_key || '',
          whatsapp_business_phone_id: data.whatsapp_business_phone_id || '',
          whatsapp_business_account_id: data.whatsapp_business_account_id || '',
        })
        setActiveInts((prev) => ({
          ...prev,
          whatsapp: !!data.whatsapp_api_key,
        }))
      }

      const { data: integ } = await supabase
        .from('integracao_usuarios')
        .select('*')
        .eq('usuario_id', user?.id)
        .eq('provedor', 'google')
        .maybeSingle()

      if (integ && integ.ativo) {
        setActiveInts((p) => ({ ...p, google_calendar: true }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string, name: string, current: boolean) => {
    if (!current) {
      if (id === 'whatsapp') {
        setConfigOpen('whatsapp')
      } else if (id === 'google_calendar') {
        handleGoogleAuth()
      } else {
        toast.info(`A integração com ${name} estará disponível em breve.`)
      }
    } else {
      if (id === 'whatsapp') {
        handleSaveWaSettings(true)
      } else if (id === 'google_calendar') {
        handleGoogleDisconnect()
      } else {
        toast.success(`${name} desconectado.`)
      }
    }
  }

  const handleGoogleAuth = async () => {
    // Simulating OAuth flow as requested
    setLoading(true)
    setTimeout(async () => {
      try {
        await supabase.from('integracao_usuarios').upsert(
          {
            usuario_id: user?.id,
            provedor: 'google',
            access_token: 'mock_access_token',
            refresh_token: 'mock_refresh_token',
            ativo: true,
          },
          { onConflict: 'usuario_id, provedor' },
        )

        setActiveInts((p) => ({ ...p, google_calendar: true }))
        toast.success('Google Calendar conectado com sucesso!')
      } catch (err: any) {
        toast.error('Erro ao conectar Google: ' + err.message)
      } finally {
        setLoading(false)
      }
    }, 1000)
  }

  const handleGoogleDisconnect = async () => {
    try {
      await supabase
        .from('integracao_usuarios')
        .delete()
        .eq('usuario_id', user?.id)
        .eq('provedor', 'google')

      setActiveInts((p) => ({ ...p, google_calendar: false }))
      toast.success('Google Calendar desconectado.')
    } catch (err: any) {
      toast.error('Erro ao desconectar: ' + err.message)
    }
  }

  const handleSaveWaSettings = async (disconnect = false) => {
    if (!user) return
    setSaving(true)
    try {
      const payload = disconnect
        ? {
            whatsapp_api_key: null,
            whatsapp_business_phone_id: null,
            whatsapp_business_account_id: null,
          }
        : waData

      const { error } = await supabase
        .from('usuarios')
        .update(payload)
        .eq('id', user.id)

      if (error) throw error

      toast.success(
        disconnect
          ? 'WhatsApp desconectado.'
          : 'Configurações do WhatsApp salvas!',
      )
      if (disconnect) {
        setWaData({
          whatsapp_api_key: '',
          whatsapp_business_phone_id: '',
          whatsapp_business_account_id: '',
        })
        setActiveInts((p) => ({ ...p, whatsapp: false }))
      } else {
        setActiveInts((p) => ({ ...p, whatsapp: true }))
      }
      setConfigOpen(null)
    } catch (err: any) {
      toast.error('Erro ao salvar configurações: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-gray-500">Carregando integrações...</div>
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrationsList.map((int) => (
          <Card
            key={int.id}
            className={`border border-gray-100 shadow-sm transition-all duration-200 bg-white group ${activeInts[int.id] ? 'ring-2 ring-black ring-offset-2' : 'hover:shadow-md'}`}
          >
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors duration-200">
                  <int.icon className="w-6 h-6" />
                </div>
                <Switch
                  checked={activeInts[int.id] || false}
                  onCheckedChange={() =>
                    handleToggle(int.id, int.name, activeInts[int.id])
                  }
                />
              </div>
              <div className="space-y-2 mt-auto">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">{int.name}</h3>
                  {activeInts[int.id] && (
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0">
                      Conectado
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                  {int.desc}
                </p>
                {int.hasConfig && activeInts[int.id] && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs w-full justify-center"
                      onClick={() => setConfigOpen(int.id)}
                    >
                      <Settings2 className="w-3 h-3 mr-2" /> Configurar
                      Credenciais
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={configOpen === 'whatsapp'}
        onOpenChange={(o) => !o && setConfigOpen(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar WhatsApp API</DialogTitle>
            <DialogDescription>
              Insira as credenciais da Meta Cloud API para enviar mensagens
              automáticas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Access Token (API Key)</Label>
              <Input
                value={waData.whatsapp_api_key}
                onChange={(e) =>
                  setWaData((p) => ({ ...p, whatsapp_api_key: e.target.value }))
                }
                placeholder="EAA..."
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number ID</Label>
              <Input
                value={waData.whatsapp_business_phone_id}
                onChange={(e) =>
                  setWaData((p) => ({
                    ...p,
                    whatsapp_business_phone_id: e.target.value,
                  }))
                }
                placeholder="Ex: 10456..."
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp Business Account ID</Label>
              <Input
                value={waData.whatsapp_business_account_id}
                onChange={(e) =>
                  setWaData((p) => ({
                    ...p,
                    whatsapp_business_account_id: e.target.value,
                  }))
                }
                placeholder="Ex: 10234..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfigOpen(null)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => handleSaveWaSettings(false)}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar Credenciais'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
