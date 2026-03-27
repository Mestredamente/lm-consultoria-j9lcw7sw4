import { useState } from 'react'
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
import { ServiceRow, CostItem, TIPOS_SERVICO } from './proposal-types'
import { toast } from 'sonner'

export function NewProposalModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSuccess?: () => void
}) {
  const [step, setStep] = useState(1)
  const [empId, setEmpId] = useState('')
  const [contId, setContId] = useState('')
  const [optId, setOptId] = useState('')
  const [services, setServices] = useState<ServiceRow[]>(
    TIPOS_SERVICO.map((t) => ({
      id: t,
      tipo: t,
      descricao: '',
      quantidade: 1,
      valor_unitario: 0,
      checked: false,
    })),
  )
  const [costs, setCosts] = useState<CostItem[]>([])

  const [overhead, setOverhead] = useState(15)
  const [contingencia, setContingencia] = useState(5)
  const [margem, setMargem] = useState(40)
  const [impostos, setImpostos] = useState(15)
  const [dataValidade, setDataValidade] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })
  const [condicoesPagamento, setCondicoesPagamento] = useState('')
  const [notasInternas, setNotasInternas] = useState('')

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

  const handleSave = () => {
    toast.success('Proposta criada e salva com sucesso!')
    if (onSuccess) onSuccess()
    onOpenChange(false)
    resetState()
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
          <DialogTitle className="text-xl">Nova Proposta</DialogTitle>
          <DialogDescription>
            Construa orçamentos complexos de forma guiada e estruturada.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
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
            disabled={step === 1}
            className="shadow-sm"
          >
            Voltar
          </Button>
          {step < 4 ? (
            <Button onClick={handleNext} className="shadow-sm px-8">
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white shadow-sm px-8"
            >
              Criar Proposta
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
