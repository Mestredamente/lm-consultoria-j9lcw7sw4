import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Leads from './pages/Leads'
import Companies from './pages/Companies'
import Contacts from './pages/Contacts'
import PlaceholderPage from './pages/PlaceholderPage'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/companies" element={<Companies />} />
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
            path="/activities"
            element={
              <PlaceholderPage
                title="Atividades"
                description="Gerencie suas tarefas e eventos."
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
          <Route
            path="/proposals"
            element={
              <PlaceholderPage
                title="Propostas"
                description="Gerencie orçamentos e propostas."
              />
            }
          />
          <Route
            path="/reports"
            element={
              <PlaceholderPage
                title="Relatórios"
                description="Análises e métricas de desempenho."
              />
            }
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
