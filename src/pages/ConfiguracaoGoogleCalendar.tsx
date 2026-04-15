import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, RefreshCw, Unplug, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import * as googleCalendarService from '@/services/google-calendar.service';
import type { GoogleCalendarStatus } from '@/services/google-calendar.service';

export default function ConfiguracaoGoogleCalendar() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const fetchStatus = async () => {
    try {
      setError(null);
      const data = await googleCalendarService.getStatus();
      setStatus(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar status da integração';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Detecta callback OAuth (?success=true)
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({ title: 'Google Calendar conectado com sucesso!' });
      setSearchParams({}, { replace: true });
      fetchStatus();
    }
  }, [searchParams]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const { authUrl } = await googleCalendarService.connect();
      window.open(authUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao iniciar conexão';
      toast({ title: 'Erro ao conectar', description: message, variant: 'destructive' });
    } finally {
      setConnecting(false);
    }
  };

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      toast({ title: 'Sincronizando agendamentos...' });
      const result = await googleCalendarService.syncAll();
      toast({
        title: `${result.synced.toLocaleString('pt-BR')} agendamentos sincronizados com sucesso`,
        description: result.errors > 0 ? `${result.errors} erro(s) encontrado(s)` : undefined,
        variant: result.errors > 0 ? 'destructive' : 'default',
      });
      await fetchStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao sincronizar';
      toast({ title: 'Erro ao sincronizar', description: message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Deseja realmente desconectar o Google Calendar? Os eventos já criados no calendário não serão removidos.')) {
      return;
    }
    try {
      setDisconnecting(true);
      await googleCalendarService.disconnect();
      toast({ title: 'Google Calendar desconectado' });
      await fetchStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao desconectar';
      toast({ title: 'Erro ao desconectar', description: message, variant: 'destructive' });
    } finally {
      setDisconnecting(false);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca sincronizado';
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  return (
    <DashboardLayout title="Google Calendar">
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Google Calendar</h1>
          <p className="text-muted-foreground mt-2">
            Sincronize automaticamente os agendamentos com o Google Calendar
          </p>
        </div>

        {/* Erro global */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Card principal */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle>Integração Google Calendar</CardTitle>
                <CardDescription>Conecte sua conta Google para sincronizar agendamentos</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {loading ? (
              <LoadingSkeleton />
            ) : status?.isConnected ? (
              <ConnectedView
                status={status}
                syncing={syncing}
                disconnecting={disconnecting}
                formatLastSync={formatLastSync}
                onSyncAll={handleSyncAll}
                onDisconnect={handleDisconnect}
              />
            ) : (
              <DisconnectedView connecting={connecting} onConnect={handleConnect} />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// --- Sub-componentes ---

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

interface ConnectedViewProps {
  status: GoogleCalendarStatus;
  syncing: boolean;
  disconnecting: boolean;
  formatLastSync: (date: Date | null) => string;
  onSyncAll: () => void;
  onDisconnect: () => void;
}

function ConnectedView({ status, syncing, disconnecting, formatLastSync, onSyncAll, onDisconnect }: ConnectedViewProps) {
  return (
    <div className="space-y-6">
      {/* Status e email */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/20 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
          {status.googleEmail && (
            <p className="text-sm text-muted-foreground">{status.googleEmail}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>Último sync: {formatLastSync(status.lastSync)}</span>
        </div>
      </div>

      {/* Grid de estatísticas */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total de eventos"
          value={status.totalEvents}
          color="text-foreground"
        />
        <StatCard
          label="Sincronizados"
          value={status.syncedEvents}
          color="text-green-600"
          bgColor="bg-green-500/10"
        />
        <StatCard
          label="Pendentes"
          value={status.pendingEvents}
          color="text-yellow-600"
          bgColor="bg-yellow-500/10"
        />
        <StatCard
          label="Com erro"
          value={status.errorEvents}
          color="text-red-600"
          bgColor="bg-red-500/10"
        />
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={onSyncAll} disabled={syncing || disconnecting}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar agora'}
        </Button>
        <Button
          variant="outline"
          onClick={onDisconnect}
          disabled={syncing || disconnecting}
          className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <Unplug className="h-4 w-4 mr-2" />
          {disconnecting ? 'Desconectando...' : 'Desconectar'}
        </Button>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  bgColor?: string;
}

function StatCard({ label, value, color, bgColor = 'bg-muted/50' }: StatCardProps) {
  return (
    <div className={`rounded-lg p-4 ${bgColor}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString('pt-BR')}</p>
    </div>
  );
}

interface DisconnectedViewProps {
  connecting: boolean;
  onConnect: () => void;
}

function DisconnectedView({ connecting, onConnect }: DisconnectedViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant="destructive" className="bg-red-500/15 text-red-700 hover:bg-red-500/20 border-red-500/30">
          <AlertCircle className="h-3 w-3 mr-1" />
          Não conectado
        </Badge>
      </div>

      <Button onClick={onConnect} disabled={connecting} size="lg">
        <ExternalLink className="h-4 w-4 mr-2" />
        {connecting ? 'Aguardando...' : 'Conectar Google Calendar'}
      </Button>

      {/* Card informativo */}
      <Alert>
        <Calendar className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-2">Como funciona</p>
          <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
            <li>Clique em "Conectar" para autorizar o acesso ao seu Google Calendar</li>
            <li>Uma nova aba será aberta para autenticação com o Google</li>
            <li>Após autorizar, os agendamentos serão sincronizados automaticamente</li>
            <li>Novos agendamentos e alterações são refletidos em tempo real</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
