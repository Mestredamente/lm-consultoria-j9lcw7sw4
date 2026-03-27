import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ProposalStepper } from './ProposalStepper'
import { ProposalStep1 } from './ProposalStep1'
import { ProposalStep2 } from './ProposalStep2'
import { ProposalStep3 } from './ProposalStep3'
import { ProposalStep4 } from './ProposalStep4'
import {
  ServiceRow,
  CostItem,
  TIPOS_SERVICO,
  calcularCustosProposal,
  getCostSubtotal,
} from './proposal-types'
import { toast } from 'sonner'

export function NewProposalModal({
  open,
  onOpenChange,
  onSuccess,
  proposalId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSuccess?: () => void
  proposalId?: string | null
}) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [empId, setEmpId] = useState('')
  const [contId, setContId] = useState('')
  const [optId, setOptId] = useState('')
  const [services, setServices] = useState<ServiceRow[]>([])
  const [costs, setCosts] = useState<CostItem[]>([])

  const [overhead, setOverhead] = useState(15)
  const [contingencia, setContingencia] = useState(5)
  const [margem, setMargem] = useState(40)
  const [impostos, setImpostos] = useState(15)
  const [dataValidade, setDataValidade] = useState('')
  const [condicoesPagamento, setCondicoesPagamento] = useState('')
  const [notasInternas, setNotasInternas] = useState('')

  useEffect(() => {
    if (open) {
      if (proposalId) {
        loadProposal(proposalId)
      } else {
        resetState()
      }
    }
  }, [open, proposalId])

  const loadProposal = async (id: string) => {
    try {
      setLoading(true)
      const { data: prop, error: propErr } = await supabase
        .from('propostas')
        .select('*')
        .eq('id', id)
        .single()
      if (propErr) throw propErr

      const { data: items, error: itemsErr } = await supabase
        .from('itens_proposta')
        .select('*')
        .eq('proposta_id', id)
      if (itemsErr) throw itemsErr

      const { data: opCosts, error: costsErr } = await supabase
        .from('custos_operacionais')
        .select('*')
        .eq('proposta_id', id)
      if (costsErr) throw costsErr

      setEmpId(prop.empresa_id || '')
      setContId(prop.contato_id || '')
      setOptId(prop.oportunidade_id || '')
      if (prop.data_validade) setDataValidade(prop.data_validade)
      if ((prop as any).notas_internas)
        setNotasInternas((prop as any).notas_internas)
      if ((prop as any).condicoes_pagamento)
        setCondicoesPagamento((prop as any).condicoes_pagamento)

      const loadedServices = TIPOS_SERVICO.map((t) => {
        const found = items?.find((i) => i.tipo_servico === t)
        if (found)
          return {
            id: found.id,
            tipo: t,
            descricao: found.descricao || '',
            quantidade: found.quantidade,
            valor_unitario: found.valor_unitario,
            checked: true,
          }
        return {
          id: t,
          tipo: t,
          descricao: '',
          quantidade: 1,
          valor_unitario: 0,
          checked: false,
        }
      })
      items?.forEach((i) => {
        if (!TIPOS_SERVICO.includes(i.tipo_servico)) {
          loadedServices.push({
            id: i.id,
            tipo: i.tipo_servico,
            descricao: i.descricao || '',
            quantidade: i.quantidade,
            valor_unitario: i.valor_unitario,
            checked: true,
            isCustom: true,
          })
        }
      })
      setServices(loadedServices)

      const loadedCosts =
        opCosts?.map((c) => {
          try {
            if (c.descricao && c.descricao.startsWith('{')) {
              const parsed = JSON.parse(c.descricao)
              return { ...parsed, id: c.id }
            }
          } catch (e) {
            // ignore parsing error
          }
          return { id: c.id, type: c.tipo as any, descricao: c.descricao }
        }) || []
      setCosts(loadedCosts)
    } catch (err: any) {
      toast.error('Erro ao carregar proposta: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (step === 1 && (!empId || !contId)) {
      toast.error('Preencha os campos obrigatórios (Empresa e Contato)')
      return
    }
    setStep((s) => s + 1)
  }

  const resetState = () => {
    setStep(1)
    setEmpId('')
    setContId('')
    setOptId('')
    setServices(
      TIPOS_SERVICO.map((t) => ({
        id: t,
        tipo: t,
        descricao: '',
        quantidade: 1,
        valor_unitario: 0,
        checked: false,
      })),
    )
    setCosts([])
    setOverhead(15)
    setContingencia(5)
    setMargem(40)
    setImpostos(15)
    const d = new Date()
    d.setDate(d.getDate() + 30)
    setDataValidade(d.toISOString().split('T')[0])
    setCondicoesPagamento('')
    setNotasInternas('')
  }

  const handleSave = async () => {
    try {
      if (!user) throw new Error('Usuário não autenticado')
      setLoading(true)

      const summary = calcularCustosProposal(
        services,
        costs,
        overhead,
        contingencia,
        margem,
        impostos,
      )
      let currentProposalId = proposalId

      if (proposalId) {
        const { error: updErr } = await supabase
          .from('propostas')
          .update({
            empresa_id: empId,
            contato_id: contId,
            oportunidade_id: optId === 'none' ? null : optId || null,
            valor_total: summary.valor_final_liquido,
            data_validade: dataValidade || null,
            notas_internas: notasInternas || null,
            condicoes_pagamento: condicoesPagamento || null,
          } as any)
          .eq('id', proposalId)

        if (updErr) throw updErr

        await supabase
          .from('itens_proposta')
          .delete()
          .eq('proposta_id', proposalId)
        await supabase
          .from('custos_operacionais')
          .delete()
          .eq('proposta_id', proposalId)

        await supabase.from('historico_propostas').insert({
          proposta_id: proposalId,
          acao: 'Editada',
          usuario_id: user.id,
        })
      } else {
        const { data: newProp, error: insErr } = await supabase
          .from('propostas')
          .insert({
            empresa_id: empId,
            contato_id: contId,
            oportunidade_id: optId === 'none' ? null : optId || null,
            valor_total: summary.valor_final_liquido,
            data_validade: dataValidade || null,
            notas_internas: notasInternas || null,
            condicoes_pagamento: condicoesPagamento || null,
            responsavel_id: user.id,
            status: 'Rascunho',
          } as any)
          .select()
          .single()

        if (insErr) throw insErr
        currentProposalId = newProp.id
      }

      const selectedServices = services.filter((s) => s.checked)
      if (selectedServices.length > 0 && currentProposalId) {
        const itemsData = selectedServices.map((s) => ({
          proposta_id: currentProposalId,
          tipo_servico: s.tipo,
          descricao: s.descricao || null,
          quantidade: s.quantidade,
          valor_unitario: s.valor_unitario,
          subtotal: s.quantidade * s.valor_unitario,
        }))
        const { error: errItems } = await supabase
          .from('itens_proposta')
          .insert(itemsData)
        if (errItems) throw errItems
      }

      if (costs.length > 0 && currentProposalId) {
        const costsData = costs.map((c) => ({
          proposta_id: currentProposalId,
          tipo: c.type,
          descricao: JSON.stringify(c),
          valor: getCostSubtotal(c),
        }))
        const { error: errCosts } = await supabase
          .from('custos_operacionais')
          .insert(costsData)
        if (errCosts) throw errCosts
      }

      toast.success(
        proposalId
          ? 'Proposta editada com sucesso!'
          : 'Proposta criada com sucesso!',
      )
      if (onSuccess) onSuccess()
      onOpenChange(false)
      resetState()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar proposta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) resetState()
      }}
    >
      <DialogContent className="max-w-[90vw] md:max-w-4xl lg:max-w-6xl h-[90vh] md:h-[85vh] flex flex-col p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border/50 bg-muted/5">
          <DialogTitle className="text-xl">
            {proposalId ? 'Editar Proposta' : 'Nova Proposta'}
          </DialogTitle>
          <DialogDescription>
            Construa orçamentos complexos de forma guiada e estruturada.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background relative">
          {loading && (
            <div className="absolute inset-0 bg-background/50 z-50 flex items-center justify-center backdrop-blur-sm">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <div className="max-w-6xl mx-auto pb-4">
            <ProposalStepper step={step} />
            <div className="mt-8 md:mt-10">
              {step === 1 && (
                <ProposalStep1
                  empId={empId}
                  setEmpId={setEmpId}
                  contId={contId}
                  setContId={setContId}
                  optId={optId}
                  setOptId={setOptId}
                />
              )}
              {step === 2 && (
                <ProposalStep2 services={services} setServices={setServices} />
              )}
              {step === 3 && (
                <ProposalStep3 costs={costs} setCosts={setCosts} />
              )}
              {step === 4 && (
                <ProposalStep4
                  services={services}
                  costs={costs}
                  overhead={overhead}
                  setOverhead={setOverhead}
                  contingencia={contingencia}
                  setContingencia={setContingencia}
                  margem={margem}
                  setMargem={setMargem}
                  impostos={impostos}
                  setImpostos={setImpostos}
                  dataValidade={dataValidade}
                  setDataValidade={setDataValidade}
                  condicoesPagamento={condicoesPagamento}
                  setCondicoesPagamento={setCondicoesPagamento}
                  notasInternas={notasInternas}
                  setNotasInternas={setNotasInternas}
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between w-full px-6 py-4 border-t bg-muted/5 mt-auto">
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1 || loading}
            className="shadow-sm"
          >
            Voltar
          </Button>
          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={loading}
              className="shadow-sm px-8"
            >
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white shadow-sm px-8"
            >
              {proposalId ? 'Salvar Edição' : 'Criar Proposta'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
