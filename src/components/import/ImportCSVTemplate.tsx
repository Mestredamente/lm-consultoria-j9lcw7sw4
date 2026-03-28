import React, { useState, useRef } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Download,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'

export interface ColumnDef {
  key: string
  label: string
  required?: boolean
}

interface ImportCSVTemplateProps {
  title: string
  description: string
  expectedColumns: ColumnDef[]
  edgeFunction: string
}

export function ImportCSVTemplate({
  title,
  description,
  expectedColumns,
  edgeFunction,
}: ImportCSVTemplateProps) {
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<any[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [step, setStep] = useState<
    'upload' | 'mapping' | 'validation' | 'results'
  >('upload')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCSV = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
      if (lines.length === 0) {
        toast.error('Arquivo CSV vazio.')
        return
      }

      const parseRow = (rowStr: string) => {
        const matches = rowStr.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
        return matches
          ? matches.map((m) => m.replace(/^"|"$/g, '').trim())
          : rowStr.split(',').map((c) => c.trim())
      }

      const headers = parseRow(lines[0])
      const data = []

      for (let i = 1; i < lines.length; i++) {
        const row = parseRow(lines[i])
        const obj: any = {}
        headers.forEach((h, idx) => {
          obj[h] = row[idx] || ''
        })
        data.push(obj)
      }

      setCsvHeaders(headers)
      setCsvData(data)

      // Auto-map
      const initialMapping: Record<string, string> = {}
      expectedColumns.forEach((col) => {
        const match = headers.find(
          (h) =>
            h.toLowerCase() === col.label.toLowerCase() ||
            h.toLowerCase() === col.key.toLowerCase(),
        )
        if (match) {
          initialMapping[col.key] = match
        }
      })
      setMapping(initialMapping)
      setStep('mapping')
    } catch (e: any) {
      toast.error('Erro ao processar arquivo: ' + e.message)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)
    const reader = new FileReader()
    reader.onload = (event) => {
      parseCSV(event.target?.result as string)
    }
    reader.readAsText(selectedFile)
  }

  const prepareRecords = () => {
    return csvData.map((row) => {
      const record: any = {}
      expectedColumns.forEach((col) => {
        if (mapping[col.key]) {
          record[col.key] = row[mapping[col.key]]
        }
      })
      return record
    })
  }

  const handleValidate = async () => {
    setLoading(true)
    try {
      const records = prepareRecords()
      const { data, error } = await supabase.functions.invoke(edgeFunction, {
        body: { records, preview: true },
      })
      if (error) throw error
      setResults(data)
      setStep('validation')
    } catch (err: any) {
      toast.error('Erro na validação: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setLoading(true)
    try {
      const records = prepareRecords()
      const { data, error } = await supabase.functions.invoke(edgeFunction, {
        body: { records, preview: false },
      })
      if (error) throw error
      setResults(data)
      setStep('results')
      toast.success('Importação concluída!')
    } catch (err: any) {
      toast.error('Erro na importação: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    if (!results || !results.erros) return
    const csvContent = ['Linha,Motivo']
      .concat(results.erros.map((e: any) => `${e.linha},"${e.motivo}"`))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio_erros_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleReset = () => {
    setFile(null)
    setCsvHeaders([])
    setCsvData([])
    setMapping({})
    setResults(null)
    setStep('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Card className="shadow-sm border-gray-200 fade-in">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'upload' && (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Clique para selecionar arquivo
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Apenas arquivos .CSV são suportados
            </p>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-md flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Arquivo lido com sucesso!</p>
                <p className="text-sm">
                  {csvData.length} registros encontrados. Agora, mapeie as
                  colunas do seu arquivo para os campos do sistema.
                </p>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Campo do Sistema</TableHead>
                    <TableHead>Coluna no Arquivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expectedColumns.map((col) => (
                    <TableRow key={col.key}>
                      <TableCell className="font-medium">
                        {col.label}{' '}
                        {col.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping[col.key] || 'ignore'}
                          onValueChange={(val) =>
                            setMapping((prev) => ({
                              ...prev,
                              [col.key]: val === 'ignore' ? '' : val,
                            }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Ignorar campo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">
                              -- Ignorar campo --
                            </SelectItem>
                            {csvHeaders.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                Cancelar
              </Button>
              <Button onClick={handleValidate} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Validar Dados
              </Button>
            </div>
          </div>
        )}

        {step === 'validation' && results && (
          <div className="space-y-6 animate-fade-in-up">
            <h3 className="text-lg font-medium">Relatório de Validação</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-500">Total Analisado</p>
                  <p className="text-2xl font-bold">{results.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-500">Válidos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {results.sucesso}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-500">Com Erros</p>
                  <p className="text-2xl font-bold text-red-600">
                    {results.erros?.length || 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-gray-500">Tempo de Análise</p>
                  <p className="text-2xl font-bold">{results.tempo_ms}ms</p>
                </CardContent>
              </Card>
            </div>

            {results.erros && results.erros.length > 0 && (
              <div className="bg-red-50 text-red-800 p-4 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">
                      Atenção: Existem linhas com erros (serão ignoradas na
                      importação)
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadReport}
                    className="bg-white text-red-600 hover:bg-red-50"
                  >
                    <Download className="w-4 h-4 mr-2" /> Relatório de Erros
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                Voltar
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading || results.sucesso === 0}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Importar {results.sucesso} Registros Válidos
              </Button>
            </div>
          </div>
        )}

        {step === 'results' && results && (
          <div className="space-y-6 animate-fade-in-up text-center py-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              Importação Concluída
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Foram importados{' '}
              <strong className="text-gray-900">{results.sucesso}</strong>{' '}
              registros com sucesso em {results.tempo_ms}ms.
            </p>

            {results.erros && results.erros.length > 0 && (
              <div className="max-w-md mx-auto mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-md text-left">
                <p className="font-medium mb-2">
                  {results.erros.length} registros falharam e não foram
                  importados.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadReport}
                  className="w-full bg-white"
                >
                  <Download className="w-4 h-4 mr-2" /> Baixar Log de Falhas
                </Button>
              </div>
            )}

            <div className="mt-8">
              <Button onClick={handleReset}>Importar Novo Arquivo</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
