import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings as SettingsIcon,
  User,
  Users,
  Blocks,
  Link as LinkIcon,
  Building,
} from 'lucide-react'
import { ProfileSettings } from '@/components/settings/ProfileSettings'
import { CompanyProfileSettings } from '@/components/settings/CompanyProfileSettings'
import { TeamSettings } from '@/components/settings/TeamSettings'
import { CustomFieldsSettings } from '@/components/settings/CustomFieldsSettings'
import { IntegrationsSettings } from '@/components/settings/IntegrationsSettings'
import { FinancialParametersSettings } from '@/components/settings/FinancialParametersSettings'
import { ReferenceTablesSettings } from '@/components/settings/ReferenceTablesSettings'
import { useAuth } from '@/hooks/use-auth'

export default function Settings() {
  const { role } = useAuth()

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shadow-lg shrink-0 text-white">
          <SettingsIcon className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie seu perfil, equipe e personalize os módulos do seu CRM.
          </p>
        </div>
      </div>

      <div className="glass-card rounded-[24px] p-2 sm:p-6 overflow-hidden">
        <Tabs defaultValue="perfil" className="w-full">
          <div className="overflow-x-auto pb-2 mb-6">
            <TabsList className="bg-gray-100/80 p-1.5 rounded-xl inline-flex w-max min-w-full sm:min-w-0 h-auto">
              <TabsTrigger
                value="perfil"
                className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm font-medium"
              >
                <User className="w-4 h-4 mr-2" /> Perfil
              </TabsTrigger>
              {role !== 'vendedor' && (
                <TabsTrigger
                  value="equipe"
                  className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm font-medium"
                >
                  <Users className="w-4 h-4 mr-2" /> Equipe
                </TabsTrigger>
              )}
              {role === 'admin' && (
                <>
                  <TabsTrigger
                    value="empresa"
                    className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm font-medium"
                  >
                    <Building className="w-4 h-4 mr-2" /> Empresa / Marca
                  </TabsTrigger>
                  <TabsTrigger
                    value="campos"
                    className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm font-medium"
                  >
                    <Blocks className="w-4 h-4 mr-2" /> Campos Personalizados
                  </TabsTrigger>
                  <TabsTrigger
                    value="integracoes"
                    className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm font-medium"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" /> Integrações
                  </TabsTrigger>
                  <TabsTrigger
                    value="parametros"
                    className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm font-medium"
                  >
                    <SettingsIcon className="w-4 h-4 mr-2" /> Parâmetros
                    Financeiros
                  </TabsTrigger>
                  <TabsTrigger
                    value="tabelas"
                    className="rounded-lg px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm font-medium"
                  >
                    <Blocks className="w-4 h-4 mr-2" /> Tabelas de Referência
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          <TabsContent
            value="perfil"
            className="m-0 focus-visible:outline-none"
          >
            <div className="max-w-2xl bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <ProfileSettings />
            </div>
          </TabsContent>

          {role !== 'vendedor' && (
            <TabsContent
              value="equipe"
              className="m-0 focus-visible:outline-none"
            >
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <TeamSettings />
              </div>
            </TabsContent>
          )}

          {role === 'admin' && (
            <>
              <TabsContent
                value="empresa"
                className="m-0 focus-visible:outline-none"
              >
                <div className="max-w-2xl bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <CompanyProfileSettings />
                </div>
              </TabsContent>

              <TabsContent
                value="campos"
                className="m-0 focus-visible:outline-none"
              >
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <CustomFieldsSettings />
                </div>
              </TabsContent>

              <TabsContent
                value="integracoes"
                className="m-0 focus-visible:outline-none"
              >
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <IntegrationsSettings />
                </div>
              </TabsContent>

              <TabsContent
                value="parametros"
                className="m-0 focus-visible:outline-none"
              >
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <FinancialParametersSettings />
                </div>
              </TabsContent>

              <TabsContent
                value="tabelas"
                className="m-0 focus-visible:outline-none"
              >
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <ReferenceTablesSettings />
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  )
}
