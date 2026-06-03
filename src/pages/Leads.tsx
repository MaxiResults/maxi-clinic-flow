import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { Plus, Eye, Users, AlertCircle, Pencil, Tag as TagIcon, Trash2, Megaphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useLeadsData } from "@/hooks/useLeadsData";
import { useLeadFilters } from "@/hooks/useLeadFilters";
import { useLeadStats } from "@/hooks/useLeadStats";
import { LeadCard } from "@/components/leads/LeadCard";
import { LeadFilters } from "@/components/leads/LeadFilters";
import { LeadStats } from "@/components/leads/LeadStats";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { LeadViewModal } from "@/components/leads/LeadViewModal";
import { LeadViewToggle } from "@/components/leads/LeadViewToggle";
import { FormattedDate } from "@/components/ui/FormattedDate";
import { TagBadge } from "@/components/tags/TagBadge";
import { LeadTagManager } from "@/components/tags/LeadTagManager";
import type { Lead } from "@/hooks/useLeadsData";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";

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
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [leadIdParaTags, setLeadIdParaTags] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [vinculandoCampanha, setVinculandoCampanha] = useState(false);
  const [modalVincularOpen, setModalVincularOpen] = useState(false);
  const [campanhaParaVincular, setCampanhaParaVincular] = useState<string>('');
  const [campanhasDisponiveis, setCampanhasDisponiveis] = useState<Array<{ id: number; nome_campanha: string }>>([]);

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

  const handleView = (id: string) => {
    const lead = leads.find(l => l.id === id);
    if (lead) setViewingLead(lead);
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

  useEffect(() => {
    api.get('/campanhas')
      .then(res => {
        const data = res.data?.data ?? res.data;
        setCampanhasDisponiveis(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  const toggleLeadSelection = (id: string) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filters.filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filters.filteredLeads.map(l => l.id));
    }
  };

  const handleVincularCampanha = async () => {
    if (!campanhaParaVincular || selectedLeadIds.length === 0) return;
    setVinculandoCampanha(true);
    try {
      await api.post(`/campanhas/${campanhaParaVincular}/leads`, {
        lead_ids: selectedLeadIds,
      });
      toast({ title: `${selectedLeadIds.length} lead(s) vinculados à campanha!` });
      setSelectedLeadIds([]);
      setModalVincularOpen(false);
      setCampanhaParaVincular('');
      refreshLeads();
    } catch {
      toast({ title: 'Erro ao vincular leads', description: 'Tente novamente', variant: 'destructive' });
    } finally {
      setVinculandoCampanha(false);
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
        <ListSkeleton />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Leads">
        <div className="p-8">
          <EmptyState
            icon={AlertCircle}
            title="Erro ao carregar leads"
            description={error}
            action={{ label: "Tentar novamente", onClick: refreshLeads }}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lead-card-anim {
          animation: fadeSlideIn 0.35s ease both;
        }
      `}</style>
      <DashboardLayout title="Leads">
        <div className="p-8 animate-fade-in">
        {selectedLeadIds.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl mb-4">
            <span className="text-sm font-medium text-primary">
              {selectedLeadIds.length} lead(s) selecionado(s)
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedLeadIds([])}
                className="h-8"
              >
                Limpar seleção
              </Button>
              <Button
                size="sm"
                onClick={() => setModalVincularOpen(true)}
                className="h-8"
              >
                <Megaphone className="h-3.5 w-3.5 mr-1.5" />
                Atribuir à campanha
              </Button>
            </div>
          </div>
        )}

        <LeadStats stats={stats} loading={loading} />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Leads
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gerencie e qualifique seus contatos e potenciais pacientes
            </p>
          </div>
          <Button onClick={handleCreate} className="rounded-lg shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Novo Lead
          </Button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex-1 w-full">
            <LeadFilters
              searchTerm={filters.searchTerm}
              onSearchChange={filters.setSearchTerm}
              filterStatus={filters.filterStatus}
              onStatusChange={filters.setFilterStatus}
              filterOrigin={filters.filterOrigin}
              onOriginChange={filters.setFilterOrigin}
              filterTag={filters.filterTag}
              onTagChange={filters.setFilterTag}
              filterCampanha={filters.filterCampanha}
              onCampanhaChange={filters.setFilterCampanha}
            />
          </div>
          <div className="flex items-center gap-4">
            {filters.filteredLeads.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedLeadIds.length === filters.filteredLeads.length && filters.filteredLeads.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-xs text-gray-500">Todos</span>
              </div>
            )}
            <LeadViewToggle view={viewMode} onViewChange={setViewMode} />
          </div>
        </div>
        
        {filters.filteredLeads.length === 0 && (
          <EmptyState
            icon={Users}
            title={leads.length === 0 ? "Nenhum lead encontrado" : "Nenhum lead corresponde aos filtros"}
            description={leads.length === 0 ? "Adicione seu primeiro lead para começar a gerenciar seus contatos." : "Tente ajustar os filtros para encontrar o que procura."}
            action={leads.length === 0 ? { label: "Criar primeiro lead", onClick: handleCreate } : undefined}
          />
        )}
        
        {/* Grid View */}
        {viewMode === 'grid' && filters.filteredLeads.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.filteredLeads.map((lead, idx) => (
              <div
                key={lead.id}
                className="lead-card-anim relative"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Checkbox de seleção */}
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedLeadIds.includes(lead.id)}
                    onCheckedChange={() => toggleLeadSelection(lead.id)}
                    onClick={e => e.stopPropagation()}
                    className="bg-white shadow-sm"
                  />
                </div>
                <div className={selectedLeadIds.includes(lead.id) ? 'ring-2 ring-primary/30 rounded-xl' : ''}>
                  <LeadCard
                    lead={lead}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onTag={(id) => {
                      setLeadIdParaTags(id);
                      setTagManagerOpen(true);
                    }}
                  />
                  {lead.tags && lead.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 px-1">
                      {lead.tags.map(tag => (
                        <TagBadge key={tag.id} nome={tag.nome} cor={tag.cor} size="sm" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* List View */}
        {viewMode === 'list' && filters.filteredLeads.length > 0 && (
          <div className="space-y-2">
            {filters.filteredLeads.map((lead, idx) => {
              const config = {
                novo:        { label: 'Novo',        cor: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8' },
                qualificado: { label: 'Qualificado', cor: '#F59E0B', bg: '#FFFBEB', text: '#B45309' },
                convertido:  { label: 'Convertido',  cor: '#10B981', bg: '#ECFDF5', text: '#065F46' },
              }[lead.status] || { label: 'Novo', cor: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8' };

              const initials = (() => {
                const parts = lead.nome.trim().split(/\s+/);
                if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
              })();

              return (
                <div
                  key={lead.id}
                  className="lead-card-anim group relative flex items-center gap-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden px-4 py-3 cursor-pointer"
                  style={{ animationDelay: `${idx * 30}ms` }}
                  onClick={() => handleView(lead.id)}
                >
                  {/* Borda lateral */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                    style={{ backgroundColor: config.cor }}
                  />

                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ml-1"
                    style={{ backgroundColor: config.bg, color: config.cor }}
                  >
                    {initials}
                  </div>

                  {/* Nome + contato */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{lead.nome}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {lead.telefone
                        ? formatPhone(lead.telefone)
                        : lead.whatsapp_id && lead.whatsapp_id.length > 13 && !lead.whatsapp_id.startsWith('55')
                          ? '🔒 Número privado'
                          : '—'
                      }
                      {lead.email && ` • ${lead.email}`}
                    </p>
                  </div>

                  {/* Canal */}
                  <span className="hidden sm:block text-xs text-gray-400 flex-shrink-0">
                    {lead.canal_origem}
                  </span>

                  {/* Status badge */}
                  <span
                    className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                    style={{ backgroundColor: config.bg, color: config.text }}
                  >
                    {config.label}
                  </span>

                  {/* Tags */}
                  {lead.tags && lead.tags.length > 0 && (
                    <div className="hidden lg:flex flex-wrap gap-1 flex-shrink-0">
                      {lead.tags.slice(0, 2).map(tag => (
                        <TagBadge key={tag.id} nome={tag.nome} cor={tag.cor} size="sm" />
                      ))}
                      {lead.tags.length > 2 && (
                        <span className="text-[10px] text-gray-400 self-center">
                          +{lead.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Data */}
                  <FormattedDate
                    value={lead.created_at}
                    format="short"
                    className="hidden md:block text-[10px] text-gray-400 flex-shrink-0"
                  />

                  {/* Quick actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); handleEdit(lead.id); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setLeadIdParaTags(lead.id);
                        setTagManagerOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Tags"
                    >
                      <TagIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteClick(lead.id); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Table View */}
        {viewMode === 'table' && filters.filteredLeads.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contato</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Canal</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filters.filteredLeads.map((lead) => {
                    const config = {
                      novo:        { label: 'Novo',        cor: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8' },
                      qualificado: { label: 'Qualificado', cor: '#F59E0B', bg: '#FFFBEB', text: '#B45309' },
                      convertido:  { label: 'Convertido',  cor: '#10B981', bg: '#ECFDF5', text: '#065F46' },
                    }[lead.status] || { label: 'Novo', cor: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8' };

                    const initials = (() => {
                      const parts = lead.nome.trim().split(/\s+/);
                      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
                      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                    })();

                    return (
                      <tr
                        key={lead.id}
                        className="group hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-0"
                        onClick={() => handleView(lead.id)}
                      >
                        {/* Lead: avatar + nome */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                              style={{ backgroundColor: config.bg, color: config.cor }}
                            >
                              {initials}
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{lead.nome}</span>
                          </div>
                        </td>
                        {/* Contato */}
                        <td className="px-4 py-3">
                          <p className="text-xs text-gray-700">
                            {lead.telefone
                              ? formatPhone(lead.telefone)
                              : lead.whatsapp_id && lead.whatsapp_id.length > 13 && !lead.whatsapp_id.startsWith('55')
                                ? '🔒 Número privado'
                                : '—'
                            }
                          </p>
                          {lead.email && <p className="text-xs text-gray-400 truncate max-w-[160px]">{lead.email}</p>}
                        </td>
                        {/* Canal */}
                        <td className="px-4 py-3 text-xs text-gray-500">{lead.canal_origem || '—'}</td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ backgroundColor: config.bg, color: config.text }}
                          >
                            {config.label}
                          </span>
                        </td>
                        {/* Tags */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(lead.tags || []).slice(0, 3).map(tag => (
                              <TagBadge key={tag.id} nome={tag.nome} cor={tag.cor} size="sm" />
                            ))}
                            {(lead.tags?.length || 0) > 3 && (
                              <span className="text-[10px] text-gray-400 self-center">
                                +{(lead.tags?.length || 0) - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Data */}
                        <td className="px-4 py-3">
                          <FormattedDate value={lead.created_at} format="short" className="text-xs text-gray-400" />
                        </td>
                        {/* Ações */}
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleView(lead.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                              title="Ver"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleEdit(lead.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                              title="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => { setLeadIdParaTags(lead.id); setTagManagerOpen(true); }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Tags"
                            >
                              <TagIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(lead.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
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

      <Dialog open={modalVincularOpen} onOpenChange={setModalVincularOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Atribuir à Campanha</DialogTitle>
            <DialogDescription>
              {selectedLeadIds.length} lead(s) serão vinculados à campanha selecionada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Selecione a campanha</Label>
            <Select
              value={campanhaParaVincular}
              onValueChange={setCampanhaParaVincular}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma campanha..." />
              </SelectTrigger>
              <SelectContent>
                {campanhasDisponiveis.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nome_campanha}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalVincularOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleVincularCampanha}
              disabled={!campanhaParaVincular || vinculandoCampanha}
            >
              {vinculandoCampanha && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LeadDialog open={dialogOpen} onOpenChange={setDialogOpen} mode={dialogMode} leadId={selectedLeadId} onSuccess={() => { setDialogOpen(false); refreshLeads(); }} />

      {viewingLead && (
        <LeadViewModal
          open={!!viewingLead}
          onClose={() => setViewingLead(null)}
          lead={viewingLead}
          onEdit={() => {
            const lead = viewingLead;
            setViewingLead(null);
            handleEdit(lead.id);
          }}
        />
      )}

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead <strong>{leadToDelete?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {leadIdParaTags && (
        <LeadTagManager
          open={tagManagerOpen}
          onOpenChange={(open) => {
            setTagManagerOpen(open);
            if (!open) {
              setLeadIdParaTags(null);
              refreshLeads();
            }
          }}
          leadId={leadIdParaTags}
          onTagsChange={() => refreshLeads()}
        />
      )}
      </DashboardLayout>
    </>
  );
}
