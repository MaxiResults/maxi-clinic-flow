import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Eye } from "lucide-react";
import { useLeadsData } from "@/hooks/useLeadsData";
import { useLeadFilters } from "@/hooks/useLeadFilters";
import { useLeadStats } from "@/hooks/useLeadStats";
import { LeadCard } from "@/components/leads/LeadCard";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { LeadStats } from "@/components/leads/LeadStats";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { LeadViewToggle } from "@/components/leads/LeadViewToggle";
import { FormattedDate } from "@/components/ui/FormattedDate";
import type { Lead } from "@/hooks/useLeadsData";

export default function Leads() {
  const { leads, loading, error, deleteLead, refreshLeads } = useLeadsData();
  const filters = useLeadFilters(leads);
  const stats = useLeadStats(leads);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedLeadId, setSelectedLeadId] = useState<string>();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');

  const handleCreate = () => {
    setDialogMode('create');
    setSelectedLeadId(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setDialogMode('edit');
    setSelectedLeadId(id);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (lead) {
      setLeadToDelete(lead);
      setIsDeleteOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (leadToDelete) {
      await deleteLead(leadToDelete.id);
      setIsDeleteOpen(false);
      setLeadToDelete(null);
    }
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const withoutCountry = cleaned.startsWith('55') ? cleaned.slice(2) : cleaned;
    
    if (withoutCountry.length === 11) {
      return `(${withoutCountry.slice(0, 2)}) ${withoutCountry.slice(2, 7)}-${withoutCountry.slice(7)}`;
    } else if (withoutCountry.length === 10) {
      return `(${withoutCountry.slice(0, 2)}) ${withoutCountry.slice(2, 6)}-${withoutCountry.slice(6)}`;
    }
    return phone;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      novo: { label: "Novo", className: "bg-blue-100 text-blue-800 border-blue-200" },
      qualificado: { label: "Qualificado", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      convertido: { label: "Convertido", className: "bg-green-100 text-green-800 border-green-200" },
    };
    
    return config[status as keyof typeof config] || config.novo;
  };

  if (loading) {
    return (
      <DashboardLayout title="Leads">
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg text-foreground">Carregando leads...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Leads">
        <div className="p-8">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h3 className="text-destructive font-bold mb-3">❌ Erro ao carregar</h3>
            <p className="text-destructive/80 mb-4">{error}</p>
            <Button onClick={refreshLeads} variant="destructive">
              🔄 Tentar novamente
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Leads">
      <div className="p-8">
        {/* Estatísticas */}
        <LeadStats stats={stats} loading={loading} />
        
        {/* Filtros + View Toggle + Novo */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex-1 w-full">
            <LeadFilters
              searchTerm={filters.searchTerm}
              onSearchChange={filters.setSearchTerm}
              filterStatus={filters.filterStatus}
              onStatusChange={filters.setFilterStatus}
              filterOrigin={filters.filterOrigin}
              onOriginChange={filters.setFilterOrigin}
            />
          </div>
          <div className="flex gap-2">
            <LeadViewToggle view={viewMode} onViewChange={setViewMode} />
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lead
            </Button>
          </div>
        </div>
        
        {/* Lista vazia */}
        {filters.filteredLeads.length === 0 && (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground text-lg">
              {leads.length === 0 ? "Nenhum lead encontrado" : "Nenhum lead corresponde aos filtros"}
            </p>
            {leads.length === 0 && (
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Criar primeiro lead
              </Button>
            )}
          </div>
        )}
        
        {/* Grid View */}
        {viewMode === 'grid' && filters.filteredLeads.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.filteredLeads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
        
        {/* List View */}
        {viewMode === 'list' && filters.filteredLeads.length > 0 && (
          <div className="space-y-2">
            {filters.filteredLeads.map(lead => {
              const statusConfig = getStatusBadge(lead.status);
              return (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{lead.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatPhone(lead.telefone)} • {lead.email || 'Sem email'}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">{lead.canal_origem}</div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}>
                      {statusConfig.label}
                    </div>
                    <FormattedDate value={lead.created_at} format="short" className="text-sm text-muted-foreground" />
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(lead.id)}
                      className="h-8 w-8"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(lead.id)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Plus className="h-4 w-4 rotate-45" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Table View */}
        {viewMode === 'table' && filters.filteredLeads.length > 0 && (
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Nome</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Telefone</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Canal</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Data</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filters.filteredLeads.map((lead) => {
                    const statusConfig = getStatusBadge(lead.status);
                    return (
                      <tr key={lead.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{lead.nome}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">📱 {formatPhone(lead.telefone)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {lead.email ? `✉️ ${lead.email}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{lead.canal_origem}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          <FormattedDate value={lead.created_at} format="short" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(lead.id)}
                              title="Editar"
                              className="h-8 w-8"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(lead.id)}
                              title="Excluir"
                              className="h-8 w-8 text-destructive"
                            >
                              <Plus className="h-4 w-4 rotate-45" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Dialog Create/Edit */}
      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        leadId={selectedLeadId}
        onSuccess={() => {
          setDialogOpen(false);
          refreshLeads();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead <strong>{leadToDelete?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
