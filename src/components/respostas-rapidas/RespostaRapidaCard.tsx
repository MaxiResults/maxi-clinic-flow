import { Copy, Edit, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { RespostaRapida } from '@/hooks/useRespostasRapidas';

interface RespostaRapidaCardProps {
  resposta: RespostaRapida;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  animationDelay?: number;
}

export function RespostaRapidaCard({
  resposta,
  onEdit,
  onDelete,
  animationDelay = 0,
}: RespostaRapidaCardProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(resposta.conteudo);
    toast.success('Conteúdo copiado!');
  };

  return (
    <div
      className="group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
      style={{
        animation: 'fadeSlideIn 0.35s ease both',
        animationDelay: `${animationDelay}ms`,
      }}
    >
      {/* Borda lateral — verde se ativo, cinza se inativo */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ backgroundColor: resposta.ativo ? '#10B981' : '#D1D5DB' }}
      />

      <div className="pl-4 pr-3 pt-4 pb-3">
        {/* Header: badge atalho + status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Badge do atalho — destaque principal */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold font-mono">
              <Zap className="h-3 w-3" />
              /{resposta.atalho}
            </span>
            {/* Status */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                resposta.ativo
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {resposta.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>

        {/* Título */}
        <h3 className="font-semibold text-sm text-gray-900 mb-2 leading-tight">
          {resposta.titulo}
        </h3>

        {/* Preview do conteúdo */}
        <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-3 whitespace-pre-wrap">
          {resposta.conteudo}
        </p>

        {/* Footer: quick actions no hover */}
        <div className="flex items-center justify-end pt-2 border-t border-gray-50">
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={copyToClipboard}
              className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
              title="Copiar conteúdo"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onEdit(resposta.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Editar"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(resposta.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
