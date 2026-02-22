import React from 'react';
import { Anamnese } from '../../../types/anamnese';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TabelaAnamnesesProps {
  anamneses: Anamnese[];
  loading: boolean;
  onVisualizarRespostas: (anamnese: Anamnese) => void;
  onDownloadPDF: (anamnese: Anamnese) => void;
  onReenviar: (anamnese: Anamnese) => void;
}

export const TabelaAnamneses: React.FC<TabelaAnamnesesProps> = ({
  anamneses,
  loading,
  onVisualizarRespostas,
  onDownloadPDF,
  onReenviar
}) => {
  const getStatusBadge = (status: string) => {
    const badges = {
      preenchido: 'bg-green-100 text-green-800',
      em_preenchimento: 'bg-yellow-100 text-yellow-800',
      expirado: 'bg-red-100 text-red-800'
    };

    const labels = {
      preenchido: 'Preenchido',
      em_preenchimento: 'Em Preenchimento',
      expirado: 'Expirado'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatarData = (dataStr: string | null) => {
    if (!dataStr) return '-';
    try {
      return format(new Date(dataStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (anamneses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Nenhuma anamnese encontrada
        </h3>
        <p className="text-gray-500">
          Crie uma nova anamnese para começar
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Template
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progresso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Criado em
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preenchido em
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {anamneses.map((anamnese) => (
              <tr key={anamnese.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                      {anamnese.lead?.nome || 'Sem nome'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {anamnese.lead?.telefone || '-'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {anamnese.template?.nome || '-'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {anamnese.template?.tipo || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(anamnese.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2" style={{ width: '80px' }}>
                      <div
                        className={`h-2 rounded-full ${
                          anamnese.progresso_percentual === 100
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${anamnese.progresso_percentual}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">
                      {anamnese.progresso_percentual}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatarData(anamnese.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatarData(anamnese.data_preenchimento)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {/* Visualizar Respostas */}
                    {anamnese.status === 'preenchido' && (
                      <button
                        onClick={() => onVisualizarRespostas(anamnese)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50 transition-colors"
                        title="Visualizar Respostas"
                      >
                        👁️
                      </button>
                    )}

                    {/* Download PDF */}
                    {anamnese.status === 'preenchido' && (
                      <button
                        onClick={() => onDownloadPDF(anamnese)}
                        className="text-green-600 hover:text-green-900 p-2 rounded hover:bg-green-50 transition-colors"
                        title="Baixar PDF"
                      >
                        📄
                      </button>
                    )}

                    {/* Reenviar */}
                    {anamnese.status !== 'preenchido' && (
                      <button
                        onClick={() => onReenviar(anamnese)}
                        className="text-purple-600 hover:text-purple-900 p-2 rounded hover:bg-purple-50 transition-colors"
                        title="Reenviar WhatsApp"
                      >
                        🔄
                      </button>
                    )}

                    {/* Copiar Link */}
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/anamnese/${anamnese.link_token}`;
                        navigator.clipboard.writeText(link);
                        alert('Link copiado!');
                      }}
                      className="text-gray-600 hover:text-gray-900 p-2 rounded hover:bg-gray-50 transition-colors"
                      title="Copiar Link"
                    >
                      🔗
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};