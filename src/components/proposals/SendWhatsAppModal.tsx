import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { MessageCircle } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  proposalId: string
  defaultPhone?: string
  onSuccess: () => void
}

export function SendWhatsAppModal({
  open,
  onOpenChange,
  proposalId,
  defaultPhone,
  onSuccess,
}: Props) {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [includePdf, setIncludePdf] = useState(true)
  const [includeLink, setIncludeLink] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      if (defaultPhone) {
        let val = defaultPhone.replace(/\D/g, '')
        if (val.length > 11) val = val.slice(0, 11)
        if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`
        if (val.length > 10) val = `${val.slice(0, 10)}-${val.slice(10)}`
        setPhone(val)
      } else {
        setPhone('')
      }
      setMessage('')
      setIncludePdf(true)
      setIncludeLink(true)
    }
  }, [open, defaultPhone])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '')
    if (val.length > 11) val = val.slice(0, 11)
    if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`
    if (val.length > 10) val = `${val.slice(0, 10)}-${val.slice(10)}`
    setPhone(val)
  }

  const handleSend = async () => {
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      toast.error('Por favor, insira um número de telefone válido.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke(
        'enviar-proposta-whatsapp',
        {
          body: {
            proposta_id: proposalId,
            numero_whatsapp: `+55${cleanPhone}`,
            mensagem_personalizada: message,
            incluir_pdf: includePdf,
            incluir_link: includeLink,
          },
        },
      )

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast.success('Mensagem enviada com sucesso!')
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(`Erro ao enviar mensagem: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            Enviar via WhatsApp
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Número do WhatsApp</Label>
            <Input
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={handlePhoneChange}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label>Mensagem Personalizada (Opcional)</Label>
            <Textarea
              placeholder="Adicione uma mensagem extra ao envio..."
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              maxLength={500}
              className="resize-none h-24"
              disabled={loading}
            />
            <div className="text-xs text-right text-gray-500">
              {message.length}/500
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-pdf"
                checked={includePdf}
                onCheckedChange={(checked) => setIncludePdf(checked as boolean)}
                disabled={loading}
              />
              <Label
                htmlFor="include-pdf"
                className="cursor-pointer font-normal"
              >
                Incluir PDF anexado
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-link"
                checked={includeLink}
                onCheckedChange={(checked) =>
                  setIncludeLink(checked as boolean)
                }
                disabled={loading}
              />
              <Label
                htmlFor="include-link"
                className="cursor-pointer font-normal"
              >
                Incluir link de visualização online
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? 'Enviando...' : 'Enviar Mensagem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
