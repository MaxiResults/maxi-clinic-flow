import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, Phone, Mail, Calendar, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  status: "novo" | "qualificado" | "convertido";
  canal_origem: string;
  created_at: string;
  observacoes: string | null;
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { toast } = useToast();

  // Buscar leads da API
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leads');
      
      console.log('📦 Response completa:', response);
      console.log('📋 Response.data:', response.data);
      console.log('🔍 Tipo:', typeof response.data);
      console.log('📊 É array?', Array.isArray(response.data));
      
      // GARANTIR QUE É UM ARRAY
      const leadsData = Array.isArray(response.data) ? response.data : [];
      
      console.log('✅ Leads finais:', leadsData);
      setLeads(leadsData);
      
      if (leadsData.length === 0) {
        toast({
          title: "Nenhum lead encontrado",
          description: "A lista de leads está vazia",
        });
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao carregar leads:', error);
      toast({
        title: "Erro ao carregar leads",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
      setLeads([]); // Garantir array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = Array.isArray(leads) ? leads.filter((lead) => {
    const matchesSearch = 
      lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone?.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  if (loading) {
    return (
      <DashboardLayout title="Leads">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando leads...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Leads">
      <div className="space-y-4">
        {/* Debug info */}
        <div className="text-xs text-muted-foreground">
          Total de leads: {leads.length} | Filtrados: {filteredLeads.length}
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="qualificado">Qualificado</SelectItem>
                <SelectItem value="convertido">Convertido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={fetchLeads}>
            <Plus className="mr-2 h-4 w-4" />
            Recarregar
          </Button>
        </div>

        {/* Empty State */}
        {filteredLeads.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              Nenhum lead encontrado
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm || statusFilter !== "all" 
                ? "Tente ajustar os filtros" 
                : "Clique em 'Recarregar' para tentar novamente"}
            </p>
          </div>
        )}

        {/* Table */}
        {filteredLeads.length > 0 && (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <TableCell className="font-medium">{lead.nome || 'Sem nome'}</TableCell>
                    <TableCell>{lead.telefone}</TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell>{lead.canal_origem || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Lead Details Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
            <DialogDescription>Informações completas do lead</DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedLead.nome}</h3>
                <StatusBadge status={selectedLead.status} />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedLead.telefone}</span>
                </div>
                {selectedLead.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedLead.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(selectedLead.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Canal de Origem</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedLead.canal_origem || 'Não informado'}
                </p>
              </div>

              {selectedLead.observacoes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Observações</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedLead.observacoes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
