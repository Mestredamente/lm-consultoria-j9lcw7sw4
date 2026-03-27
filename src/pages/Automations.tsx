import React, { useState } from 'react'
import { Plus, Zap, Mail, CheckSquare, Trash2, PenLine } from 'lucide-react'
import { useAutomations } from '@/hooks/use-automations'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { AutomationDialog } from '@/components/automations/AutomationDialog'

export default function Automations() {
  const {
    automations,
    loading,
    addAutomation,
    updateAutomation,
    deleteAutomation,
  } = useAutomations()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const { error } = await updateAutomation(id, { ativo: !currentStatus })
    if (error) {
      toast.error('Erro ao atualizar status.')
    } else {
      toast.success(
        currentStatus ? 'Automação desativada.' : 'Automação ativada.',
      )
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir esta automação?')) {
      const { error } = await deleteAutomation(id)
      if (error) {
        toast.error('Erro ao excluir.')
      } else {
        toast.success('Automação excluída.')
      }
    }
  }

  const handleSave = async (data: any) => {
    const { error } = await addAutomation(data)
    if (error) {
      toast.error('Erro ao criar automação.')
    } else {
      toast.success('Automação criada com sucesso!')
      setIsDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-gray-400 animate-pulse">
        Carregando automações...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg shrink-0 text-white">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Automações
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Crie fluxos inteligentes para automatizar seu CRM.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-black text-white hover:bg-gray-800 rounded-full px-6 shadow-md h-11"
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Fluxo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-4">
        {automations.length === 0 ? (
          <div className="bg-gray-50/50 border border-gray-200 border-dashed rounded-[32px] p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <Zap className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Nenhum fluxo configurado
            </h3>
            <p className="text-gray-500 max-w-sm mb-6">
              Comece a automatizar suas tarefas diárias criando seu primeiro
              fluxo de trabalho.
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              variant="outline"
              className="rounded-full bg-white"
            >
              Criar Automação
            </Button>
          </div>
        ) : (
          automations.map((auto) => (
            <Card
              key={auto.id}
              className={`glass-card transition-all duration-300 border-white/60 ${!auto.ativo ? 'opacity-60 bg-gray-50/50' : 'hover:shadow-md'}`}
            >
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`p-3.5 rounded-xl shrink-0 ${auto.acao === 'Enviar Email' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}
                  >
                    {auto.acao === 'Enviar Email' ? (
                      <Mail className="w-5 h-5" />
                    ) : auto.acao === 'Criar Tarefa' ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <PenLine className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1.5">
                      {auto.nome}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium">
                      <span className="bg-white border border-gray-200 px-2 py-1 rounded-md shadow-sm text-gray-700">
                        Se: {auto.gatilho}
                      </span>
                      <span className="text-gray-300">→</span>
                      <span className="bg-white border border-gray-200 px-2 py-1 rounded-md shadow-sm text-gray-700">
                        Então: {auto.acao}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-gray-100 mt-2 sm:mt-0">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${auto.ativo ? 'text-emerald-600' : 'text-gray-400'}`}
                    >
                      {auto.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    <Switch
                      checked={auto.ativo}
                      onCheckedChange={() => handleToggle(auto.id, auto.ativo)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(auto.id)}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AutomationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSave}
      />
    </div>
  )
}
