import { useState, useEffect } from 'react'
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
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Send } from 'lucide-react'

interface SendEmailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposalId: string
  defaultEmail?: string
  onSuccess?: () => void
}

export function SendEmailModal({
  open,
  onOpenChange,
  proposalId,
  defaultEmail,
  onSuccess,
}: SendEmailModalProps) {
  const [email, setEmail] = useState(defaultEmail || '')
  const [message, setMessage] = useState('')
  const [includePdf, setIncludePdf] = useState(true)
  const [includeLink, setIncludeLink] = useState(true)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setEmail(defaultEmail || '')
      setMessage('')
    }
  }, [open, defaultEmail])

  const handleSend = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return toast.error('Email é obrigatório')
    if (!emailRegex.test(email)) return toast.error('Email inválido')
    if (message.length > 500)
      return toast.error('A mensagem deve ter no máximo 500 caracteres')

    setLoading(true)
    try {
      const { error } = await supabase.functions.invoke(
        'enviar-proposta-email',
        {
          body: {
            proposta_id: proposalId,
            email_destinatario: email,
            mensagem_personalizada: message,
            incluir_pdf: includePdf,
            incluir_link: includeLink,
          },
        },
      )
      if (error) throw error
      toast.success('Proposta enviada com sucesso!')
      onSuccess?.()
      onOpenChange(false)
    } catch (err: any) {
      toast.error('Erro ao enviar email: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enviar Proposta por E-mail</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>E-mail do Destinatário</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Mensagem Personalizada (opcional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Olá, segue a nossa proposta..."
              className="h-24 resize-none"
              maxLength={500}
            />
            <div className="text-xs text-right text-gray-500">
              {message.length}/500
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inc-pdf"
              checked={includePdf}
              onCheckedChange={(c) => setIncludePdf(c as boolean)}
            />
            <Label htmlFor="inc-pdf" className="cursor-pointer">
              Incluir PDF anexado/link
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inc-link"
              checked={includeLink}
              onCheckedChange={(c) => setIncludeLink(c as boolean)}
            />
            <Label htmlFor="inc-link" className="cursor-pointer">
              Incluir link de visualização online (rastreável)
            </Label>
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
          <Button onClick={handleSend} disabled={loading} className="gap-2">
            <Send className="w-4 h-4" />
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
