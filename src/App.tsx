import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Leads from './pages/Leads'
import OpportunityDetails from './pages/OpportunityDetails'
import Companies from './pages/Companies'
import CompanyDetails from './pages/CompanyDetails'
import Contacts from './pages/Contacts'
import Activities from './pages/Activities'
import Automations from './pages/Automations'
import MyAgenda from './pages/MyAgenda'
import Reports from './pages/Reports'
import SettingsPage from './pages/Settings'
import PlaceholderPage from './pages/PlaceholderPage'
import Proposals from './pages/Proposals'
import ProposalDetails from './pages/ProposalDetails'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import { AuthProvider, useAuth } from './hooks/use-auth'
import { CompaniesProvider } from './contexts/CompaniesContext'
import { ContactsProvider } from './contexts/ContactsContext'
import { OportunidadesProvider } from './contexts/OportunidadesContext'
import { ActivitiesProvider } from './contexts/ActivitiesContext'

function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { user, loading, role } = useAuth()
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    )
  if (!user) return <Navigate to="/auth" />

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" />
  }

  return <Outlet />
}

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <AuthProvider>
      <CompaniesProvider>
        <ContactsProvider>
          <OportunidadesProvider>
            <ActivitiesProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                      <Route path="/" element={<Index />} />
                      <Route path="/leads" element={<Leads />} />
                      <Route
                        path="/leads/:id"
                        element={<OpportunityDetails />}
                      />
                      <Route path="/contacts" element={<Contacts />} />
                      <Route path="/companies" element={<Companies />} />
                      <Route
                        path="/companies/:id"
                        element={<CompanyDetails />}
                      />
                      <Route path="/activities" element={<Activities />} />
                      <Route path="/my-agenda" element={<MyAgenda />} />
                      <Route path="/settings" element={<SettingsPage />} />

                      <Route
                        element={
                          <ProtectedRoute allowedRoles={['admin', 'gerente']} />
                        }
                      >
                        <Route path="/reports" element={<Reports />} />
                      </Route>

                      <Route
                        element={<ProtectedRoute allowedRoles={['admin']} />}
                      >
                        <Route path="/automations" element={<Automations />} />
                      </Route>

                      <Route
                        path="/pipeline"
                        element={
                          <PlaceholderPage
                            title="Pipeline"
                            description="Visualize o progresso dos seus negócios."
                          />
                        }
                      />
                      <Route
                        path="/tasks"
                        element={
                          <PlaceholderPage
                            title="Tarefas"
                            description="Lista de tarefas pendentes."
                          />
                        }
                      />
                      <Route path="/proposals" element={<Proposals />} />
                      <Route
                        path="/proposals/:id"
                        element={<ProposalDetails />}
                      />
                      <Route
                        path="/founders"
                        element={<PlaceholderPage title="Fundadores" />}
                      />
                      <Route
                        path="/finance"
                        element={<PlaceholderPage title="Finanças" />}
                      />
                      <Route
                        path="/growth"
                        element={<PlaceholderPage title="Crescimento" />}
                      />
                      <Route
                        path="/projects"
                        element={<PlaceholderPage title="Projetos" />}
                      />
                    </Route>
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </ActivitiesProvider>
          </OportunidadesProvider>
        </ContactsProvider>
      </CompaniesProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
