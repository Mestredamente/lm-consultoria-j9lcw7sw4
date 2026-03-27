import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Zap } from 'lucide-react'

interface AutomationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => void
}

export function AutomationDialog({
  open,
  onOpenChange,
  onSave,
}: AutomationDialogProps) {
  const [nome, setNome] = useState('')
  const [gatilho, setGatilho] = useState('')
  const [acao, setAcao] = useState('')
  const [assunto, setAssunto] = useState('')
  const [corpo, setCorpo] = useState('')

  const handleSave = () => {
    if (!nome || !gatilho || !acao) return

    const data = {
      nome,
      gatilho,
      acao,
      ativo: true,
      detalhes_acao: acao === 'Enviar Email' ? { assunto, corpo } : {},
    }

    onSave(data)

    // Reset fields
    setNome('')
    setGatilho('')
    setAcao('')
    setAssunto('')
    setCorpo('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-card border-white/60">
        <DialogHeader>
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-sm mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold">
            Novo Fluxo de Automação
          </DialogTitle>
          <DialogDescription>
            Configure um gatilho e uma ação para criar uma rotina automática no
            seu CRM.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Nome do Fluxo</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Boas-vindas ao novo cliente"
              className="bg-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label>Quando isso acontecer (Gatilho)</Label>
            <Select value={gatilho} onValueChange={setGatilho}>
              <SelectTrigger className="bg-white/50">
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nova Empresa Criada">
                  Nova Empresa Criada
                </SelectItem>
                <SelectItem value="Contato Criado">Contato Criado</SelectItem>
                <SelectItem value="Oportunidade Criada">
                  Oportunidade Criada
                </SelectItem>
                <SelectItem value="Oportunidade Ganha">
                  Oportunidade Ganha
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Faça isso (Ação)</Label>
            <Select value={acao} onValueChange={setAcao}>
              <SelectTrigger className="bg-white/50">
                <SelectValue placeholder="Selecione uma ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Enviar Email">Enviar Email</SelectItem>
                <SelectItem value="Criar Tarefa">Criar Tarefa</SelectItem>
                <SelectItem value="Atualizar Campo">Atualizar Campo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {acao === 'Enviar Email' && (
            <div className="space-y-4 p-4 bg-gray-50/50 border border-gray-100 rounded-xl mt-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  Configuração do E-mail
                </h4>
                <p className="text-xs text-gray-500">
                  Você pode usar{' '}
                  <code className="bg-gray-200 px-1 py-0.5 rounded">
                    [Nome]
                  </code>{' '}
                  para inserir o nome do contato automaticamente.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Assunto</Label>
                <Input
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Olá [Nome], seja bem-vindo!"
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Corpo do E-mail</Label>
                <Textarea
                  value={corpo}
                  onChange={(e) => setCorpo(e.target.value)}
                  placeholder="Escreva a mensagem aqui..."
                  className="bg-white min-h-[120px]"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-black text-white hover:bg-gray-800 rounded-xl px-6"
            disabled={!nome || !gatilho || !acao}
          >
            Salvar Fluxo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
