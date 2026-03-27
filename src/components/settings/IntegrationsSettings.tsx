import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Mail,
  Calendar,
  MessageCircle,
  Link as LinkIcon,
  Workflow,
} from 'lucide-react'
import { toast } from 'sonner'

const integrations = [
  {
    id: 'google',
    name: 'Google Workspace',
    desc: 'Sincronize e-mails e eventos do Google Agenda diretamente no seu CRM.',
    icon: Mail,
    connected: false,
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    desc: 'Integre sua caixa de entrada e calendário do Outlook perfeitamente.',
    icon: Calendar,
    connected: false,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp API',
    desc: 'Envie notificações, cobranças e mensagens automatizadas para clientes.',
    icon: MessageCircle,
    connected: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    desc: 'Receba notificações instantâneas de novos negócios e tarefas no Slack.',
    icon: Workflow,
    connected: false,
  },
  {
    id: 'zapier',
    name: 'Zapier',
    desc: 'Conecte o CRM com mais de 3.000 aplicativos através de automações.',
    icon: LinkIcon,
    connected: false,
  },
]

export function IntegrationsSettings() {
  const handleToggle = (name: string, current: boolean) => {
    if (!current) {
      toast.info(`A integração com ${name} estará disponível em breve.`)
    } else {
      toast.success(`${name} desconectado.`)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {integrations.map((int) => (
        <Card
          key={int.id}
          className="border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 bg-white group"
        >
          <CardContent className="p-6 flex flex-col h-full">
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors duration-200">
                <int.icon className="w-6 h-6" />
              </div>
              <Switch
                checked={int.connected}
                onCheckedChange={() => handleToggle(int.name, int.connected)}
              />
            </div>
            <div className="space-y-2 mt-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">{int.name}</h3>
                {int.connected && (
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0">
                    Ativo
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                {int.desc}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
