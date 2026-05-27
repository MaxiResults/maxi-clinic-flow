import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MetricasCards } from '../components/anamnese/dashboard/MetricasCards';
import { TabelaAnamneses } from '../components/anamnese/dashboard/TabelaAnamneses';
import { anamneseService } from '../services/anamnese.service';
import { Anamnese, AnamneseMetricas } from '../types/anamnese';

export const AnamneseDashboard: React.FC = () => {
  const [metricas, setMetricas] = useState<AnamneseMetricas | null>(null);
  const [anamneses, setAnamneses] = useState<Anamnese[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMetricas, setLoadingMetricas] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtroStatus, setFiltroStatus] = useState<string>('');

  // Carregar métricas
  useEffect(() => {
    carregarMetricas();
  }, []);

  // Carregar anamneses
  useEffect(() => {
    carregarAnamneses();
  }, [page, filtroStatus]);

  const carregarMetricas = async () => {
    try {
      setLoadingMetricas(true);
      const response = await anamneseService.buscarMetricas();
      if (response.success) {
        setMetricas(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      alert('Erro ao carregar métricas');
    } finally {
      setLoadingMetricas(false);
    }
  };

  const carregarAnamneses = async () => {
    try {
      setLoading(true);
      const response = await anamneseService.listar({
        page,
        limit: 10,
        status: filtroStatus || undefined
      });

      if (response.success) {
        setAnamneses(response.data.anamneses);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Erro ao carregar anamneses:', error);
      alert('Erro ao carregar anamneses');
    } finally {
      setLoading(false);
    }
  };

  const handleVisualizarRespostas = (anamnese: Anamnese) => {
    // TODO: Navegar para página de visualização
    console.log('Visualizar respostas:', anamnese.id);
    alert('Página de visualização será implementada em breve!');
  };

  const handleDownloadPDF = async (anamnese: Anamnese) => {
    try {
      const blob = await anamneseService.downloadPDFPreenchido(anamnese.id);
      
      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `anamnese-${anamnese.lead?.nome || 'paciente'}-${anamnese.id.slice(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      alert('Erro ao baixar PDF');
    }
  };

  const handleReenviar = async (anamnese: Anamnese) => {
    if (!confirm('Deseja reenviar esta anamnese por WhatsApp?')) {
      return;
    }

    try {
      const response = await anamneseService.reenviar(anamnese.id);
      if (response.success) {
        alert('Anamnese reenviada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao reenviar anamnese:', error);
      alert('Erro ao reenviar anamnese');
    }
  };

  return (
    <DashboardLayout title="Anamneses">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📋 Dashboard de Anamneses
          </h1>
          <p className="text-gray-600">
            Gerencie e acompanhe todas as anamneses do sistema
          </p>
        </div>

        {/* Métricas */}
        <MetricasCards metricas={metricas} loading={loadingMetricas} />

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Filtrar por status:
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => {
                setFiltroStatus(e.target.value);
                setPage(1); // Reset para primeira página
              }}
              className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="preenchido">Preenchido</option>
              <option value="em_preenchimento">Em Preenchimento</option>
              <option value="expirado">Expirado</option>
            </select>

            <button
              onClick={() => {
                setFiltroStatus('');
                setPage(1);
                carregarAnamneses();
                carregarMetricas();
              }}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* Tabela */}
        <TabelaAnamneses
          anamneses={anamneses}
          loading={loading}
          onVisualizarRespostas={handleVisualizarRespostas}
          onDownloadPDF={handleDownloadPDF}
          onReenviar={handleReenviar}
        />

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ← Anterior
            </button>
            
            <span className="px-4 py-2 text-sm text-gray-700">
              Página {page} de {totalPages}
            </span>

            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};