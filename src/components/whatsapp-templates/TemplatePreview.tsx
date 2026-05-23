import { TemplateButton } from '@/hooks/useWhatsAppTemplates';

interface TemplatePreviewProps {
  headerType?: string;
  headerContent?: string;
  body: string;
  footer?: string;
  buttons?: TemplateButton[];
}

export function TemplatePreview({
  headerType,
  headerContent,
  body,
  footer,
  buttons,
}: TemplatePreviewProps) {
  const renderBody = (text: string) =>
    text.replace(/\{\{(\d+)\}\}/g, (_m, num) => `[Variável ${num}]`);

  return (
    <div className="rounded-xl bg-[#e5ddd5] p-4">
      <div className="max-w-sm rounded-lg bg-white shadow-sm overflow-hidden">
        {headerType && headerContent && (
          <div className="p-2">
            {headerType === 'text' ? (
              <p className="font-semibold text-sm px-2 pt-1">{headerContent}</p>
            ) : headerType === 'image' ? (
              <div className="aspect-video bg-muted rounded flex items-center justify-center text-muted-foreground text-sm">
                📷 Imagem
              </div>
            ) : headerType === 'video' ? (
              <div className="aspect-video bg-muted rounded flex items-center justify-center text-muted-foreground text-sm">
                🎥 Vídeo
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded flex items-center justify-center text-muted-foreground text-sm">
                📄 Documento
              </div>
            )}
          </div>
        )}

        <div className="px-3 py-2">
          <p className="text-sm whitespace-pre-wrap text-gray-900">
            {body ? renderBody(body) : (
              <span className="text-muted-foreground italic">
                Digite o corpo da mensagem...
              </span>
            )}
          </p>
        </div>

        {footer && (
          <div className="px-3 pb-2">
            <p className="text-xs text-gray-500">{footer}</p>
          </div>
        )}

        {buttons && buttons.length > 0 && (
          <div className="border-t border-gray-200">
            {buttons.map((btn, idx) => (
              <button
                key={idx}
                type="button"
                className="w-full px-3 py-2 text-sm text-[#00a884] hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-center"
              >
                {btn.type === 'url' && '🔗 '}
                {btn.type === 'phone' && '📞 '}
                {btn.text || 'Texto do botão'}
              </button>
            ))}
          </div>
        )}

        <div className="px-3 pb-1 text-right">
          <span className="text-[10px] text-gray-400">
            {new Date().toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}