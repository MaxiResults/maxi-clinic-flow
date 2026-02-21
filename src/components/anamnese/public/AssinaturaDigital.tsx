import { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eraser } from 'lucide-react';

interface AssinaturaDigitalProps {
  value?: string;
  onChange: (signature: string) => void;
  erro?: string;
}

export function AssinaturaDigital({ value, onChange, erro }: AssinaturaDigitalProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);

  // Carregar assinatura existente
  useEffect(() => {
    if (value && sigCanvas.current) {
      sigCanvas.current.fromDataURL(value);
    }
  }, [value]);

  const handleEnd = () => {
    if (sigCanvas.current) {
      const signature = sigCanvas.current.toDataURL('image/png');
      onChange(signature);
    }
  };

  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      onChange('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>
          Assinatura Digital
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-8"
        >
          <Eraser className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      </div>

      <div className={`border-2 rounded-lg overflow-hidden ${erro ? 'border-destructive' : 'border-border'}`}>
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'w-full h-40 bg-white cursor-crosshair',
          }}
          onEnd={handleEnd}
          penColor="black"
          minWidth={1}
          maxWidth={3}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Desenhe sua assinatura no quadro acima usando o mouse ou touch
      </p>

      {erro && (
        <p className="text-xs text-destructive">{erro}</p>
      )}
    </div>
  );
}