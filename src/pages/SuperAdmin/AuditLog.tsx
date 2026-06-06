import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Label } from '@/components/ui/label';

interface AuditLogEntry {
  id: string;
  usuario_email: string;
  acao: string;
  recurso: string;
  recurso_id?: string;
  ip_address?: string;
  dados_anteriores?: any;
  dados_novos?: any;
  created_at: string;
}

const LIMIT_PER_PAGE = 20;

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [recursoFilter, setRecursoFilter] = useState('');
  const [usuarioFilter, setUsuarioFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [recursoFilter, usuarioFilter, offset]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('limit', String(LIMIT_PER_PAGE));
      params.append('offset', String(offset));
      if (recursoFilter) params.append('recurso', recursoFilter);
      if (usuarioFilter) params.append('usuario_id', usuarioFilter);

      const response = await api.get(`/superadmin/audit-log?${params.toString()}`);
      setLogs(response.data.data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatData = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const getAcaoColor = (acao: string) => {
    if (acao === 'CREATE') return 'bg-emerald-100 text-emerald-800';
    if (acao.includes('UPDATE')) return 'bg-indigo-100 text-indigo-800';
    if (acao === 'RESET_SENHA') return 'bg-amber-100 text-amber-800';
    if (acao === 'IMPERSONATE') return 'bg-red-100 text-red-800';
    return 'bg-slate-100 text-slate-800';
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Recurso</Label>
              <Select value={recursoFilter} onValueChange={(v) => {
                setRecursoFilter(v);
                setOffset(0);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="empresa">Empresa</SelectItem>
                  <SelectItem value="usuario">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Usuário ID</Label>
              <Input
                placeholder="UUID do usuário"
                value={usuarioFilter}
                onChange={(e) => {
                  setUsuarioFilter(e.target.value);
                  setOffset(0);
                }}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => {
                  setRecursoFilter('');
                  setUsuarioFilter('');
                  setOffset(0);
                }}
                variant="outline"
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nenhum log encontrado
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id}>
                  {/* Log Row */}
                  <div className="flex items-center gap-3 p-3 border border-slate-200 rounded hover:bg-slate-50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="p-0 h-auto"
                      disabled={!log.dados_anteriores && !log.dados_novos}
                    >
                      {expandedLog === log.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm">
                        {log.usuario_email}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatData(log.created_at)}
                      </p>
                    </div>

                    <Badge className={getAcaoColor(log.acao)}>
                      {log.acao}
                    </Badge>

                    <Badge variant="outline">{log.recurso}</Badge>

                    {log.recurso_id && (
                      <Badge variant="secondary" className="font-mono text-xs">
                        {log.recurso_id.substring(0, 8)}
                      </Badge>
                    )}

                    {log.ip_address && (
                      <span className="text-xs text-slate-500">{log.ip_address}</span>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedLog === log.id && (
                    <div className="ml-10 mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950 rounded text-white font-mono text-xs mb-2">
                      {log.dados_anteriores && (
                        <div>
                          <p className="text-slate-400 mb-2">Dados Anteriores:</p>
                          <pre className="overflow-x-auto bg-slate-900 p-2 rounded">
                            {JSON.stringify(log.dados_anteriores, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.dados_novos && (
                        <div>
                          <p className="text-slate-400 mb-2">Dados Novos:</p>
                          <pre className="overflow-x-auto bg-slate-900 p-2 rounded">
                            {JSON.stringify(log.dados_novos, null, 2)}
                          </pre>
                        </div>
                      )}

                      {!log.dados_anteriores && !log.dados_novos && (
                        <p className="text-slate-400 col-span-2">Sem detalhes de dados</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {logs.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Mostrando {offset + 1} - {offset + logs.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOffset(Math.max(0, offset - LIMIT_PER_PAGE))}
              disabled={offset === 0}
            >
              ← Anterior
            </Button>
            <Button
              variant="outline"
              onClick={() => setOffset(offset + LIMIT_PER_PAGE)}
              disabled={logs.length < LIMIT_PER_PAGE}
            >
              Próximo →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
