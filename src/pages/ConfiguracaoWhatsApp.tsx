import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  MessageSquare,
  Wifi,
  WifiOff,
  QrCode,
  RefreshCw,
  Loader2,
  Edit,
  Plus,
  Info,
  Phone,
  User,
  Settings2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface InstanciaData {
  id?: string;
  nome?: string;
  telefone?: string;
  status?: 'ativa' | 'inativa' | 'desconectada';
  evolution_instance_name?: string;
  evolution_instance_id?: string;
  metadata?: { base_url?: string };
  created_at?: string;
  updated_at?: string;
}

interface StatusData {
  connected: boolean;
  state: string;
  instanceName?: string | null;
  number?: string | null;
  profileName?: string | null;
}

interface QRCodeData {
  qrcode?: string | null;
  pairingCode?: string | null;
  alreadyConnected?: boolean;
}

export default function ConfiguracaoWhatsApp() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [instancia, setInstancia] = useState<InstanciaData | null>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loadingInstancia, setLoadingInstancia] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formInstanceName, setFormInstanceName] = useState('');
  const [editando, setEditando] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    pollingRef.current = null;
    pollingTimeoutRef.current = null;
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    let pollCount = 0;
    pollingRef.current = setInterval(() => {
      fetchStatus();
      pollCount++;
    }, 5000);
    pollingTimeoutRef.current = setTimeout(() => {
      stopPolling();
    }, 60000);
  }, [stopPolling]);

  const fetchInstancia = useCallback(async () => {
    try {
      setLoadingInstancia(true);
      const response = await api.get('/evolution/instancia');
      setInstancia(response.data);
    } catch (err: any) {
      console.error('Erro ao buscar instância:', err);
      setInstancia(null);
    } finally {
      setLoadingInstancia(false);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const response = await api.get('/evolution/instancia/status');
      setStatus(response.data);
    } catch (err: any) {
      console.error('Erro ao buscar status:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const fetchQRCode = useCallback(async () => {
    try {
      setLoadingQR(true);
      const response = await api.get('/evolution/instancia/qrcode');
      setQrData(response.data);
    } catch (err: any) {
      console.error('Erro ao gerar QR Code:', err);
      setQrData(null);
    } finally {
      setLoadingQR(false);
    }
  }, []);

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      await api.post('/evolution/instancia', {
        nome: formNome,
        evolution_instance_name: formInstanceName,
      });
      toast({ title: 'Instância salva com sucesso' });
      setEditando(false);
      await fetchInstancia();
      await fetchStatus();
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err?.response?.data?.error || 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleDesconectar = async () => {
    try {
      await api.post('/evolution/instancia/desconectar');
      toast({ title: 'WhatsApp desconectado' });
      await fetchStatus();
    } catch {
      toast({ title: 'Erro ao desconectar', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchInstancia();
    fetchStatus();
    return () => stopPolling();
  }, [fetchInstancia, fetchStatus, stopPolling]);

  useEffect(() => {
    if (status?.connected && qrModalOpen) {
      stopPolling();
      setQrModalOpen(false);
      toast({ title: '✅ WhatsApp conectado com sucesso!' });
      fetchInstancia();
    }
  }, [status?.connected, qrModalOpen, stopPolling, fetchInstancia]);

  return (
    <DashboardLayout title="WhatsApp — Integração">
      <div className="max-w-3xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-green-500/10">
            <MessageSquare className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WhatsApp Business</h1>
            <p className="text-muted-foreground text-sm">
              Configure a integração com o WhatsApp para atendimento via chat
            </p>
          </div>
        </div>

        {/* Card: Status da Conexão */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Status da Conexão
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchStatus}
                disabled={loadingStatus}
              >
                <RefreshCw className={`h-4 w-4 ${loadingStatus ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStatus ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Verificando conexão...</span>
              </div>
            ) : status?.connected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium text-green-700">Conectado</span>
                </div>
                {status.number && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>+{status.number}</span>
                  </div>
                )}
                {status.profileName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{status.profileName}</span>
                  </div>
                )}
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive mt-2"
                    onClick={handleDesconectar}
                  >
                    <WifiOff className="h-4 w-4 mr-2" />
                    Desconectar
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="font-medium text-red-700">Desconectado</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR Code para conectar o WhatsApp Business desta clínica.
                </p>
                {isAdmin && instancia?.evolution_instance_name && (
                  <Button
                    onClick={() => {
                      setQrModalOpen(true);
                      fetchQRCode();
                      startPolling();
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Conectar via QR Code
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card: Configuração da Instância — só admin */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Configuração da Instância
                </CardTitle>
                {instancia && !editando && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormNome(instancia.nome || '');
                      setFormInstanceName(instancia.evolution_instance_name || '');
                      setEditando(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
              <CardDescription>
                Dados da instância Evolution API vinculada a este tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!editando ? (
                <div className="space-y-3">
                  {instancia ? (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Nome</p>
                          <p className="font-medium">{instancia.nome || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Instância Evolution</p>
                          <p className="font-medium font-mono text-xs">
                            {instancia.evolution_instance_name || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Telefone</p>
                          <p className="font-medium">{instancia.telefone || '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <Badge variant={instancia.status === 'ativa' ? 'default' : 'secondary'}>
                            {instancia.status || 'inativa'}
                          </Badge>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Nenhuma instância configurada para este tenant.
                      </p>
                      <Button
                        onClick={() => setEditando(true)}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Configurar Instância
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Nome de exibição *</Label>
                    <Input
                      value={formNome}
                      onChange={e => setFormNome(e.target.value)}
                      placeholder="Ex: Skin&Co WhatsApp"
                    />
                    <p className="text-xs text-muted-foreground">
                      Nome amigável para identificar esta integração
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Nome da instância Evolution API *</Label>
                    <Input
                      value={formInstanceName}
                      onChange={e => setFormInstanceName(e.target.value)}
                      placeholder="Ex: SkinCo-Principal"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Nome exato da instância cadastrada na Evolution API
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSalvar}
                      disabled={salvando || !formNome.trim() || !formInstanceName.trim()}
                    >
                      {salvando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditando(false)}
                      disabled={salvando}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Card: Informações — para todos */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Como funciona</p>
                <p>O WhatsApp Business é integrado via Evolution API. Cada clínica tem sua própria instância conectada a um número de telefone.</p>
                <p>Para conectar: configure o nome da instância → clique em "Conectar via QR Code" → escaneie com o WhatsApp do celular.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal QR Code */}
      <Dialog open={qrModalOpen} onOpenChange={(open) => {
        if (!open) stopPolling();
        setQrModalOpen(open);
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Conectar WhatsApp
            </DialogTitle>
            <DialogDescription>
              Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo → Escaneie o QR Code
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2">
            {loadingQR ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
              </div>
            ) : qrData?.alreadyConnected ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-sm font-medium text-green-700">WhatsApp já está conectado!</p>
              </div>
            ) : qrData?.qrcode ? (
              <>
                <img
                  src={qrData.qrcode}
                  alt="QR Code WhatsApp"
                  className="w-56 h-56 rounded-lg border"
                />
                <p className="text-xs text-muted-foreground text-center">
                  QR Code expira em 60 segundos. Aguardando conexão...
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Verificando conexão...
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm text-muted-foreground text-center">
                  Não foi possível gerar o QR Code. Verifique se a instância está configurada corretamente.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { fetchQRCode(); startPolling(); }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              stopPolling();
              setQrModalOpen(false);
            }}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
