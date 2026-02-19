import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/LoadingSpinner";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Agendamentos from "./pages/Agendamentos";
import AgendamentoForm from "./pages/AgendamentoForm";
import Conversas from "./pages/Conversas";
import Profissionais from "./pages/Profissionais";
import ProfissionalForm from "./pages/ProfissionalForm";
import Produtos from "./pages/Produtos";
import Settings from "./pages/Settings";
import Categorias from "./pages/Categorias";
import Especialidades from "./pages/Especialidades";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import AnamneseTemplates from '@/pages/AnamneseTemplates';

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
    <Route path="/leads" element={<PrivateRoute><Leads /></PrivateRoute>} />
    <Route path="/agendamentos" element={<PrivateRoute><Agendamentos /></PrivateRoute>} />
    <Route path="/agendamentos/novo" element={<PrivateRoute><AgendamentoForm /></PrivateRoute>} />
    <Route path="/agendamentos/:id/editar" element={<PrivateRoute><AgendamentoForm /></PrivateRoute>} />
    <Route path="/conversas" element={<PrivateRoute><Conversas /></PrivateRoute>} />
    <Route path="/profissionais" element={<PrivateRoute><Profissionais /></PrivateRoute>} />
    <Route path="/profissionais/novo" element={<PrivateRoute><ProfissionalForm /></PrivateRoute>} />
    <Route path="/profissionais/:id/editar" element={<PrivateRoute><ProfissionalForm /></PrivateRoute>} />
    <Route path="/produtos" element={<PrivateRoute><Produtos /></PrivateRoute>} />
    <Route path="/configuracoes" element={<PrivateRoute><Settings /></PrivateRoute>} />
    <Route path="/categorias" element={<PrivateRoute><Categorias /></PrivateRoute>} />
    <Route path="/especialidades" element={<PrivateRoute><Especialidades /></PrivateRoute>} />
    <Route path="/perfil" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
    <Route path="*" element={<NotFound />} />
    <Route path="/anamnese/templates" element={<AnamneseTemplates />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
