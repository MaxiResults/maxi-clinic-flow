import React, { useState, useEffect, useRef } from 'react';
import { Pen, RotateCcw } from 'lucide-react';

interface AssinaturaTextoProps {
  value?: string;
  onChange: (base64: string) => void;
  erro?: string;
}

export const AssinaturaTexto: React.FC<AssinaturaTextoProps> = ({
  value,
  onChange,
  erro
}) => {
  const [nome, setNome] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Gerar assinatura em canvas quando nome muda
  useEffect(() => {
    if (nome.trim()) {
      gerarAssinatura(nome);
    } else {
      limpar();
    }
  }, [nome]);

  const gerarAssinatura = (texto: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configurar fonte cursiva
    ctx.font = "48px 'Great Vibes', cursive";
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Desenhar texto centralizado
    ctx.fillText(texto, canvas.width / 2, canvas.height / 2);

    // Converter para base64 e salvar
    const base64 = canvas.toDataURL('image/png');
    onChange(base64);
  };

  const limpar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    onChange('');
  };

  const handleLimpar = () => {
    setNome('');
    limpar();
  };

  return (
    <div className="w-full space-y-3">
      {/* Campo de entrada */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Digite seu nome completo para assinar *
        </label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Maria da Silva"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            erro ? 'border-red-500' : 'border-gray-300'
          }`}
          maxLength={100}
        />
        {erro && (
          <p className="mt-1 text-sm text-red-600">{erro}</p>
        )}
      </div>

      {/* Preview da assinatura */}
      {nome.trim() && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Preview da sua assinatura:
            </label>
            <button
              type="button"
              onClick={handleLimpar}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Limpar
            </button>
          </div>

          {/* Canvas invisível para gerar base64 */}
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="hidden"
          />

          {/* Preview visual */}
          <div className="border-2 border-gray-300 rounded-lg bg-white p-6 min-h-[120px] flex items-center justify-center">
            <p 
              className="text-5xl text-gray-800"
              style={{ 
                fontFamily: "'Great Vibes', cursive",
                letterSpacing: '2px'
              }}
            >
              {nome}
            </p>
          </div>

          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Pen className="w-3 h-3" />
            Esta será sua assinatura digital no documento
          </p>
        </div>
      )}

      {/* Mensagem quando vazio */}
      {!nome.trim() && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-8 text-center">
          <Pen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Digite seu nome acima para ver a prévia da assinatura
          </p>
        </div>
      )}
    </div>
  );
};