import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImportCSVTemplate } from '@/components/import/ImportCSVTemplate'

export default function ImportData() {
  const contactColumns = [
    { key: 'nome', label: 'Nome', required: true },
    { key: 'cargo', label: 'Cargo' },
    { key: 'email', label: 'Email', required: true },
    { key: 'telefone', label: 'Telefone' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'empresa_id', label: 'ID da Empresa (Opcional)' },
    { key: 'notas', label: 'Notas Internas' },
  ]

  const companyColumns = [
    { key: 'nome', label: 'Nome da Empresa', required: true },
    { key: 'cnpj', label: 'CNPJ' },
    { key: 'setor', label: 'Setor' },
    { key: 'endereco', label: 'Endereço' },
    { key: 'website', label: 'Website' },
    { key: 'num_funcionarios', label: 'Número de Funcionários' },
    { key: 'email', label: 'Email Contato' },
    { key: 'telefone', label: 'Telefone Geral' },
  ]

  const opportunityColumns = [
    { key: 'nome', label: 'Nome da Oportunidade', required: true },
    { key: 'empresa_id', label: 'ID da Empresa (Opcional)' },
    { key: 'contato_id', label: 'ID do Contato (Opcional)' },
    { key: 'valor_estimado', label: 'Valor Estimado (R$)' },
    {
      key: 'data_fechamento_prevista',
      label: 'Data de Fechamento (YYYY-MM-DD)',
    },
    { key: 'probabilidade_percentual', label: 'Probabilidade (%)' },
    { key: 'estagio', label: 'Estágio (Prospecção, Proposta...)' },
  ]

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Importação em Lote</h1>
        <p className="text-gray-500 mt-1">
          Carregue dados massivos para o sistema usando arquivos CSV.
        </p>
      </div>

      <Tabs defaultValue="contatos" className="w-full">
        <TabsList className="mb-6 bg-white border">
          <TabsTrigger value="contatos">Contatos</TabsTrigger>
          <TabsTrigger value="empresas">Empresas</TabsTrigger>
          <TabsTrigger value="oportunidades">Oportunidades</TabsTrigger>
        </TabsList>

        <TabsContent value="contatos">
          <ImportCSVTemplate
            title="Importar Contatos"
            description="Mapeie os contatos das empresas com seus e-mails e telefones."
            expectedColumns={contactColumns}
            edgeFunction="importar-csv-contatos"
          />
        </TabsContent>

        <TabsContent value="empresas">
          <ImportCSVTemplate
            title="Importar Empresas"
            description="Carregue as organizações que compõem sua base B2B."
            expectedColumns={companyColumns}
            edgeFunction="importar-csv-empresas"
          />
        </TabsContent>

        <TabsContent value="oportunidades">
          <ImportCSVTemplate
            title="Importar Oportunidades"
            description="Migre seus negócios em andamento com valores e probabilidades."
            expectedColumns={opportunityColumns}
            edgeFunction="importar-csv-oportunidades"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
