import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEncaminhamento } from '@/hooks/useEncaminhamento';
import { Search, Send, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MensagemEncaminhar {
  id: string;
  mensagem: string;
  tipo_mensagem: string;
  midia_url?: string;
  data_envio?: string;
}

export interface ContatoEncaminhar {
  id?: string;
  numero: string;
  nome: string;
}

interface EncaminharDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mensagensSelecionadas: MensagemEncaminhar[];
  sessaoOrigemId: string;
  contatos: ContatoEncaminhar[];
  onSuccess?: () => void;
}

export function EncaminharDialog({
  open,
  onOpenChange,
  mensagensSelecionadas,
  sessaoOrigemId,
  contatos,
  onSuccess,
}: EncaminharDialogProps) {
  const [busca, setBusca] = useState('');
  const [contatoSelecionado, setContatoSelecionado] = useState<ContatoEncaminhar | null>(null);
  const [numeroManual, setNumeroManual] = useState('');
  const [nomeManual, setNomeManual] = useState('');
  const [modoManual, setModoManual] = useState(false);

  const { encaminharMensagens, loading } = useEncaminhamento();

  const contatosFiltrados = useMemo(() => {
    if (!busca) return contatos;
    const termo = busca.toLowerCase();
    return contatos.filter(
      (c) => c.nome.toLowerCase().includes(termo) || c.numero.includes(termo),
    );
  }, [contatos, busca]);

  const podeEncaminhar = modoManual
    ? numeroManual.trim().length > 0
    : !!contatoSelecionado;

  const handleEncaminhar = async () => {
    const destinoNumero = modoManual ? numeroManual : contatoSelecionado?.numero || '';
    const destinoNome = modoManual
      ? nomeManual || numeroManual
      : contatoSelecionado?.nome || '';

    if (!destinoNumero) return;

    const result = await encaminharMensagens({
      mensagemIds: mensagensSelecionadas.map((m) => m.id),
      numeroDestino: destinoNumero,
      nomeDestino: destinoNome,
      sessaoOrigemId,
    });

    if (result.success) {
      onOpenChange(false);
      onSuccess?.();
      setContatoSelecionado(null);
      setNumeroManual('');
      setNomeManual('');
      setModoManual(false);
      setBusca('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Encaminhar {mensagensSelecionadas.length}{' '}
            {mensagensSelecionadas.length === 1 ? 'mensagem' : 'mensagens'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px]">
          {/* Seleção de Contato */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">Para quem enviar?</Label>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={!modoManual ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModoManual(false)}
                className="flex-1"
              >
                <User className="h-4 w-4 mr-1" />
                Contatos
              </Button>
              <Button
                type="button"
                variant={modoManual ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModoManual(true)}
                className="flex-1"
              >
                <Phone className="h-4 w-4 mr-1" />
                Número
              </Button>
            </div>

            {!modoManual && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar contato..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <ScrollArea className="h-[280px] border rounded-md">
                  {contatosFiltrados.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nenhum contato encontrado
                    </div>
                  ) : (
                    <div className="p-1">
                      {contatosFiltrados.map((contato) => {
                        const ativo =
                          contatoSelecionado?.numero === contato.numero;
                        return (
                          <button
                            key={contato.id || contato.numero}
                            type="button"
                            onClick={() => setContatoSelecionado(contato)}
                            className={cn(
                              'w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors',
                              ativo && 'bg-primary/10 border border-primary',
                            )}
                          >
                            <div className="text-sm font-medium truncate">
                              {contato.nome}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {contato.numero}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}

            {modoManual && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="numero-manual">Número de telefone *</Label>
                  <Input
                    id="numero-manual"
                    placeholder="+5511999999999"
                    value={numeroManual}
                    onChange={(e) => setNumeroManual(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nome-manual">Nome (opcional)</Label>
                  <Input
                    id="nome-manual"
                    placeholder="Nome do contato"
                    value={nomeManual}
                    onChange={(e) => setNomeManual(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview das mensagens */}
          <div className="flex flex-col gap-3">
            <Label className="text-sm font-medium">Preview das mensagens</Label>
            <ScrollArea className="h-[340px] border rounded-md">
              <div className="p-3 space-y-2">
                {mensagensSelecionadas.map((msg, index) => (
                  <div
                    key={msg.id}
                    className="bg-muted/40 border rounded-md p-2"
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      Mensagem {index + 1}
                    </div>
                    {msg.tipo_mensagem === 'texto' ||
                    msg.tipo_mensagem === 'text' ? (
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.mensagem}
                      </p>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium uppercase">
                          {msg.tipo_mensagem}
                        </span>
                        {msg.midia_url && <span> • Anexo</span>}
                        {msg.mensagem && (
                          <p className="mt-1 text-foreground whitespace-pre-wrap break-words">
                            {msg.mensagem}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleEncaminhar}
            disabled={!podeEncaminhar || loading || mensagensSelecionadas.length === 0}
          >
            {loading ? (
              'Enviando...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                Encaminhar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
