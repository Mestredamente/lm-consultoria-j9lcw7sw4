import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MOCK_EMPRESAS,
  MOCK_CONTATOS,
  MOCK_OPORTUNIDADES,
} from './proposal-types'

export function ProposalStep1({
  empId,
  setEmpId,
  contId,
  setContId,
  optId,
  setOptId,
}: {
  empId: string
  setEmpId: (v: string) => void
  contId: string
  setContId: (v: string) => void
  optId: string
  setOptId: (v: string) => void
}) {
  const filteredContatos = useMemo(
    () => MOCK_CONTATOS.filter((c) => c.empresa_id === empId),
    [empId],
  )
  const filteredOportunidades = useMemo(
    () => MOCK_OPORTUNIDADES.filter((o) => o.empresa_id === empId),
    [empId],
  )

  return (
    <div className="space-y-6 max-w-md mx-auto fade-in p-2">
      <div className="space-y-2">
        <Label>
          Empresa <span className="text-destructive">*</span>
        </Label>
        <Select
          value={empId}
          onValueChange={(v) => {
            setEmpId(v)
            setContId('')
            setOptId('')
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione a empresa cliente" />
          </SelectTrigger>
          <SelectContent>
            {MOCK_EMPRESAS.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>
          Contato <span className="text-destructive">*</span>
        </Label>
        <Select value={contId} onValueChange={setContId} disabled={!empId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o contato" />
          </SelectTrigger>
          <SelectContent>
            {filteredContatos.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Oportunidade Comercial (Opcional)</Label>
        <Select value={optId} onValueChange={setOptId} disabled={!empId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Vincular a uma oportunidade" />
          </SelectTrigger>
          <SelectContent>
            {filteredOportunidades.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Vincular a proposta ajuda no rastreamento de conversão do seu
          pipeline.
        </p>
      </div>
    </div>
  )
}
