import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, Package, CheckCircle, XCircle, AlertCircle } from "lucide-react";

// Helper para formatar datas no timezone de São Paulo
const formatarDataBR = (dataISO: string) => {
  return new Date(dataISO).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  });
};

const formatarHoraBR = (dataISO: string) => {
  return new Date(dataISO).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
};

interface Agendamento {
  id: string;
  Lead?: {
    nome: string;
    telefone: string;
  };
  Profissional?: {
    nome: string;
  };
  Produto?: {
    nome: string;
  };
  data_hora_inicio: string;
  data_hora_fim: string;
  status: string;
  valor: number;
  observacoes?: string;
}

export default function Agendamentos() {
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState("todos");

  useEffect(() => {
    fetchAgendamentos();
  }, []);

  const fetchAgendamentos = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando agendamentos...');

      const response = await fetch(
        'https://viewlessly-unadjoining-lashanda.ngrok-free.dev/api/v1/agendamentos?t=' + Date.now(),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'User-Agent': 'MaxiResults/1.0'
          }
        }
      );

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      console.log('📄 Response (200 chars):', text.substring(0, 200));
      
      if (!text.startsWith('{')) {
        throw new Error('Abra a URL no navegador primeiro e clique em "Visit Site"');
      }

      const data = JSON.parse(text);
      console.log('📦 JSON parseado:', data);

      const agendamentosArray = data.success && data.data 
        ? (Array.isArray(data.data) ? data.data : [])
        : [];

      console.log('✅ Agendamentos carregados:', agendamentosArray);
      setAgendamentos(agendamentosArray);

    } catch (err: any) {
      console.error('❌ Erro:', err);
      setError(err.message);
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelado':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'agendado':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      case 'agendado':
        return 'bg-blue-100 text-blue-800';
      case 'concluido':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const agendamentosFiltrados = agendamentos.filter(ag => {
    if (filtroStatus === 'todos') return true;
    return ag.status === filtroStatus;
  });

  if (loading) {
    return (
      <DashboardLayout title="Agendamentos">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-lg">Carregando agendamentos...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Agendamentos">
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-bold mb-3">❌ Erro ao carregar</h3>
            <p className="text-red-600 mb-4 whitespace-pre-wrap">{error}</p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>💡 Solução:</strong>
              </p>
              <ol className="text-sm text-yellow-700 list-decimal list-inside mt-2 space-y-1">
                <li>Abra esta URL em nova aba:</li>
                <li className="ml-4 font-mono text-xs break-all">
                  https://viewlessly-unadjoining-lashanda.ngrok-free.dev/api/v1/agendamentos
                </li>
                <li>Clique em "Visit Site" se aparecer</li>
                <li>Volte aqui e clique em "Tentar novamente"</li>
              </ol>
            </div>
            
            <button 
              onClick={fetchAgendamentos}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              🔄 Tentar novamente
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Agendamentos">
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold">Agendamentos</h2>
            <p className="text-gray-500 mt-1">
              Total: {agendamentos.length} | Exibindo: {agendamentosFiltrados.length}
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchAgendamentos}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2 text-sm"
            >
              🔄 Recarregar
            </button>
            <button 
              onClick={() => navigate("/agendamentos/novo")}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2 text-sm"
            >
              ➕ Novo Agendamento
            </button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="lista" className="w-full">
          <TabsList>
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              {['todos', 'agendado', 'confirmado', 'cancelado', 'concluido'].map(status => (
                <button
                  key={status}
                  onClick={() => setFiltroStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    filtroStatus === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Lista */}
            {agendamentosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Nenhum agendamento encontrado</p>
            <p className="text-gray-400 text-sm mt-2">
              {filtroStatus !== 'todos' 
                ? 'Tente outro filtro' 
                : 'Clique em "Novo" para criar um agendamento'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {agendamentosFiltrados.map((agendamento) => {
              // DEBUG TIMEZONE
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              console.log('🕐 DEBUG HORÁRIO:');
              console.log('Raw data_hora_inicio:', agendamento.data_hora_inicio);
              console.log('Raw data_hora_fim:', agendamento.data_hora_fim);
              console.log('Date object inicio:', new Date(agendamento.data_hora_inicio));
              console.log('Date object fim:', new Date(agendamento.data_hora_fim));
              console.log('Formatted com helper:', formatarHoraBR(agendamento.data_hora_inicio));
              console.log('Timezone do navegador:', Intl.DateTimeFormat().resolvedOptions().timeZone);
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
              
              return (
                <div 
                  key={agendamento.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Info Principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      {getStatusIcon(agendamento.status)}
                      <h3 className="text-lg font-bold text-gray-900">
                        {agendamento.Lead?.nome || 'Cliente não informado'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(agendamento.status)}`}>
                        {agendamento.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {/* Data e Hora */}
                      <div className="flex items-start gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">
                            {formatarDataBR(agendamento.data_hora_inicio)}
                          </p>
                          <p className="text-xs">
                            {formatarHoraBR(agendamento.data_hora_inicio)}
                            {' - '}
                            {formatarHoraBR(agendamento.data_hora_fim)}
                          </p>
                        </div>
                      </div>

                      {/* Profissional */}
                      <div className="flex items-start gap-2 text-gray-600">
                        <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Profissional</p>
                          <p className="font-medium">
                            {agendamento.Profissional?.nome || 'Não definido'}
                          </p>
                        </div>
                      </div>

                      {/* Serviço */}
                      <div className="flex items-start gap-2 text-gray-600">
                        <Package className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Serviço</p>
                          <p className="font-medium">
                            {agendamento.Produto?.nome || 'Não definido'}
                          </p>
                        </div>
                      </div>

                      {/* Valor */}
                      <div className="flex items-start gap-2 text-gray-600">
                        <span className="text-lg flex-shrink-0">💰</span>
                        <div>
                          <p className="text-xs text-gray-500">Valor</p>
                          <p className="font-medium text-green-600">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(agendamento.valor || 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Observações */}
                    {agendamento.observacoes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Obs:</span> {agendamento.observacoes}
                        </p>
                      </div>
                    )}

                    {/* Telefone */}
                    {agendamento.Lead?.telefone && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          📱 {agendamento.Lead.telefone}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex lg:flex-col gap-2">
                    <button className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex-1 lg:flex-none whitespace-nowrap">
                      Ver detalhes
                    </button>
                    <button 
                      onClick={() => navigate(`/agendamentos/${agendamento.id}/editar`)}
                      className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex-1 lg:flex-none whitespace-nowrap"
                    >
                      ✏️ Editar
                    </button>
                    {agendamento.status === 'agendado' && (
                      <>
                        <button className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 flex-1 lg:flex-none whitespace-nowrap">
                          Confirmar
                        </button>
                        <button className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 flex-1 lg:flex-none whitespace-nowrap">
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
            </div>
          )}
          </TabsContent>

          <TabsContent value="calendario">
            <div className="text-center py-12 bg-muted/50 rounded-lg">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">Calendário em desenvolvimento</p>
              <p className="text-sm text-muted-foreground mt-2">
                Visualização de calendário será implementada em breve
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
