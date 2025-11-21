import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Buscando leads...');
      
      // USAR FETCH DIRETO (sem axios/api)
      const response = await fetch(
        'https://viewlessly-unadjoining-lashanda.ngrok-free.dev/api/v1/leads?t=' + Date.now(),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'omit'
        }
      );
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log('📄 Response text (primeiro 200 chars):', text.substring(0, 200));
      
      // Verificar se é JSON
      if (!text.startsWith('{') && !text.startsWith('[')) {
        throw new Error('Resposta não é JSON: ' + text.substring(0, 100));
      }
      
      const data = JSON.parse(text);
      console.log('📦 Dados parseados:', data);
      
      // Extrair array de leads
      const leadsArray = data.success && data.data 
        ? (Array.isArray(data.data) ? data.data : [])
        : (Array.isArray(data) ? data : []);
      
      console.log('✅ Leads extraídos:', leadsArray);
      console.log('📊 Total:', leadsArray.length);
      
      setLeads(leadsArray);
      
    } catch (err) {
      console.error('❌ Erro completo:', err);
      setError(err.message);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Leads">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-lg">Carregando leads...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Leads">
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-bold mb-2">❌ Erro ao carregar</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchLeads}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Leads">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            Total de Leads: {leads.length}
          </h2>
          <button 
            onClick={fetchLeads}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔄 Recarregar
          </button>
        </div>
        
        {leads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhum lead encontrado</p>
            <p className="text-gray-400 text-sm mt-2">
              Clique em 'Recarregar' para tentar novamente
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map((lead) => (
              <div 
                key={lead.id} 
                className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-gray-900">
                    {lead.nome || 'Sem nome'}
                  </h3>
                  <span className={`
                    px-2 py-1 text-xs font-medium rounded
                    ${lead.status === 'novo' ? 'bg-blue-100 text-blue-800' : ''}
                    ${lead.status === 'qualificado' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${lead.status === 'convertido' ? 'bg-green-100 text-green-800' : ''}
                  `}>
                    {lead.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <p>📱 {lead.telefone}</p>
                  {lead.email && <p>✉️ {lead.email}</p>}
                  <p>📍 Canal: {lead.canal_origem || 'N/A'}</p>
                  {lead.created_at && (
                    <p className="text-xs text-gray-400">
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
