import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { X, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  [key: string]: any;
}

interface NovaConversaModalProps {
  open: boolean;
  onClose: () => void;
  onConversaIniciada: (sessaoId: string) => void;
}

export function NovaConversaModal({ open, onClose, onConversaIniciada }: NovaConversaModalProps) {
  // Estados
  const [query, setQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [modoNovoContato, setModoNovoContato] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [mensagemInicial, setMensagemInicial] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [buscandoLeads, setBuscandoLeads] = useState(false);

  const { toast } = useToast();
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounce para busca de leads
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.trim().length === 0) {
      setLeads([]);
      setBuscandoLeads(false);
      return;
    }

    setBuscandoLeads(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await api.get(`/leads`, {
          params: { busca: query, limit: 10 },
        });
        const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setLeads(data);
        setErro(null);
      } catch (err: any) {
        setLeads([]);
      } finally {
        setBuscandoLeads(false);
      }
    }, 400);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const handleSelectLead = (lead: Lead) => {
    setLeadSelecionado(lead);
    setLeads([]);
    setQuery('');
  };

  const handleDeselectLead = () => {
    setLeadSelecionado(null);
    setQuery('');
  };

  const handleIniciarConversa = async () => {
    try {
      setErro(null);

      // Validações
      if (!mensagemInicial.trim()) {
        setErro('Mensagem inicial é obrigatória');
        return;
      }

      if (!leadSelecionado && (!novoNome.trim() || !novoTelefone.trim())) {
        setErro('Selecione um lead ou preencha nome e telefone');
        return;
      }

      setLoading(true);

      const response = await api.post(`/conversas/iniciar`, {
        lead_id: leadSelecionado?.id || null,
        telefone: modoNovoContato ? novoTelefone : null,
        nome: modoNovoContato ? novoNome : null,
        mensagem_inicial: mensagemInicial.trim(),
      });

      const sessaoId = response.data?.data?.sessao_id;
      if (!sessaoId) {
        throw new Error('Não foi retornado ID da sessão');
      }

      toast({
        title: 'Sucesso',
        description: 'Conversa iniciada com sucesso!',
      });

      // Resetar estados e fechar
      setQuery('');
      setLeads([]);
      setLeadSelecionado(null);
      setModoNovoContato(false);
      setNovoNome('');
      setNovoTelefone('');
      setMensagemInicial('');
      setErro(null);

      onConversaIniciada(sessaoId);
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Erro ao iniciar conversa';
      setErro(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Resetar tudo ao fechar
    setQuery('');
    setLeads([]);
    setLeadSelecionado(null);
    setModoNovoContato(false);
    setNovoNome('');
    setNovoTelefone('');
    setMensagemInicial('');
    setErro(null);
    onClose();
  };

  const isFormValid =
    !loading &&
    mensagemInicial.trim().length > 0 &&
    (leadSelecionado || (modoNovoContato && novoNome.trim() && novoTelefone.trim()));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!modoNovoContato ? (
            <>
              {/* Busca de lead existente */}
              <div>
                <label className="text-sm font-medium">Buscar lead</label>
                <Input
                  placeholder="Buscar por nome ou telefone..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={leadSelecionado !== null || loading}
                  className="mt-1"
                />
              </div>

              {/* Lead selecionado */}
              {leadSelecionado && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{leadSelecionado.nome}</p>
                    <p className="text-xs text-gray-600">{leadSelecionado.telefone}</p>
                  </div>
                  <button
                    onClick={handleDeselectLead}
                    className="p-1 hover:bg-blue-100 rounded transition-colors"
                    aria-label="Remover lead"
                  >
                    <X className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              )}

              {/* Lista de resultados */}
              {!leadSelecionado && leads.length > 0 && (
                <Card className="border">
                  <div className="max-h-48 overflow-y-auto">
                    {leads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => handleSelectLead(lead)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0 transition-colors"
                      >
                        <p className="font-medium text-sm">{lead.nome}</p>
                        <p className="text-xs text-gray-600">{lead.telefone}</p>
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              {/* Loading */}
              {buscandoLeads && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}

              {/* Botão novo contato */}
              {!leadSelecionado && query.trim().length > 0 && leads.length === 0 && !buscandoLeads && (
                <button
                  onClick={() => setModoNovoContato(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-dashed rounded text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo contato
                </button>
              )}
            </>
          ) : (
            <>
              {/* Modo novo contato */}
              <div>
                <label className="text-sm font-medium">Nome completo</label>
                <Input
                  placeholder="Digite o nome..."
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Telefone com DDD</label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={novoTelefone}
                  onChange={(e) => setNovoTelefone(e.target.value)}
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              <button
                onClick={() => {
                  setModoNovoContato(false);
                  setNovoNome('');
                  setNovoTelefone('');
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar à busca
              </button>
            </>
          )}

          {/* Mensagem inicial */}
          <div>
            <label className="text-sm font-medium">Mensagem inicial</label>
            <Textarea
              placeholder="Digite a mensagem inicial..."
              value={mensagemInicial}
              onChange={(e) => setMensagemInicial(e.target.value)}
              disabled={loading}
              className="mt-1 resize-none"
              rows={4}
            />
          </div>

          {/* Erro */}
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800">
              {erro}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleIniciarConversa} disabled={!isFormValid}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Iniciando...
              </>
            ) : (
              'Iniciar Conversa'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
