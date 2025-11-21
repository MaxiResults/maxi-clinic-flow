import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, Edit, Trash2, Plus, Loader2 } from "lucide-react";

const API_BASE_URL = 'https://viewlessly-unadjoining-lashanda.ngrok-free.dev/api/v1';

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  canal_origem: string;
  campanha?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  origem_url?: string;
  status: 'novo' | 'qualificado' | 'convertido';
  interesse?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

const leadSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  telefone: z.string()
    .min(1, "Telefone é obrigatório")
    .transform(val => val.replace(/\D/g, ''))
    .refine(val => val.length === 10 || val.length === 11, "Telefone deve ter 10 ou 11 dígitos"),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  cpf: z.string()
    .optional()
    .refine(val => !val || val.replace(/\D/g, '').length === 11, "CPF deve ter 11 dígitos"),
  canal_origem: z.string().min(1, "Selecione o canal de origem"),
  status: z.enum(['novo', 'qualificado', 'convertido']),
  interesse: z.string().optional(),
  observacoes: z.string().optional(),
  campanha: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  origem_url: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      cpf: "",
      canal_origem: "",
      status: "novo",
      interesse: "",
      observacoes: "",
      campanha: "",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_content: "",
      origem_url: "",
    },
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/leads?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'MaxiResults/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      
      if (!text.startsWith('{')) {
        throw new Error('Ainda recebendo HTML. Tente: 1) Abrir a URL no navegador e clicar "Visit Site" 2) Voltar aqui e recarregar');
      }
      
      const data = JSON.parse(text);
      const leadsArray = data.success && data.data 
        ? (Array.isArray(data.data) ? data.data : [])
        : [];
      
      setLeads(leadsArray);
    } catch (err: any) {
      setError(err.message);
      setLeads([]);
    } finally {
      setLoading(false);
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

  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
    }
    return cpf;
  };

const cleanPhone = (phone: string): string => {
  // Remove tudo exceto números
  const digits = phone.replace(/\D/g, '');
  
  // Adiciona +55 se não tiver
  if (digits.startsWith('55')) {
    return '+' + digits;
  }
  
  return '+55' + digits;
};

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
      if (value.length > 6) {
        if (value.length === 11) {
          value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        } else {
          value = `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
        }
      } else if (value.length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      }
      e.target.value = value;
    }
  };

  const handleCPFInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
      if (value.length > 9) {
        value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
      } else if (value.length > 6) {
        value = `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6)}`;
      } else if (value.length > 3) {
        value = `${value.slice(0, 3)}.${value.slice(3)}`;
      }
      e.target.value = value;
    }
  };

  const handleCreate = async (data: LeadFormData) => {
  try {
    setActionLoading(true);
    
    console.log('📤 DADOS ORIGINAIS:', data);
    
    const payload = {
      ...data,
      telefone: cleanPhone(data.telefone),
      cpf: data.cpf ? data.cpf.replace(/\D/g, '') : undefined,
      email: data.email || undefined,
    };
    
    console.log('📦 PAYLOAD FINAL:', payload);
    
    const response = await fetch(`${API_BASE_URL}/leads`, {  // ← CORRIGIDO!
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📡 RESPONSE STATUS:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ ERROR DATA:', errorData);
      throw new Error(errorData.error || 'Erro ao criar lead');
    }
    
    const result = await response.json();
    console.log('✅ RESULTADO:', result);
    
    toast({
      title: "✅ Sucesso!",
      description: "Lead criado com sucesso!",
    });
    
    setIsNewLeadOpen(false);
    form.reset();
    fetchLeads();
    
  } catch (err: any) {
    console.error('❌ ERRO COMPLETO:', err);
    toast({
      title: "❌ Erro",
      description: err.message || "Erro ao criar lead. Tente novamente.",
      variant: "destructive",
    });
  } finally {
    setActionLoading(false);
  }
};

  const handleUpdate = async (data: LeadFormData) => {
    if (!selectedLead) return;

    try {
      setActionLoading(true);
      
      const payload = {
        ...data,
        telefone: cleanPhone(data.telefone),
        cpf: data.cpf ? data.cpf.replace(/\D/g, '') : undefined,
        email: data.email || undefined,
      };

      const response = await fetch(`${API_BASE_URL}/leads/${selectedLead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar lead');
      }

      toast({
        title: "✅ Sucesso!",
        description: "Lead atualizado com sucesso!",
      });

      setIsEditLeadOpen(false);
      setSelectedLead(null);
      form.reset();
      fetchLeads();
    } catch (err: any) {
      toast({
        title: "❌ Erro",
        description: err.message || "Erro ao atualizar lead. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedLead) return;

    try {
      setActionLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/leads/${selectedLead.id}`, {
        method: 'DELETE',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir lead');
      }

      toast({
        title: "✅ Sucesso!",
        description: "Lead excluído com sucesso!",
      });

      setIsDeleteOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (err: any) {
      toast({
        title: "❌ Erro",
        description: err.message || "Erro ao excluir lead. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openNewLeadModal = () => {
    form.reset();
    setIsNewLeadOpen(true);
  };

  const openEditLeadModal = (lead: Lead) => {
    setSelectedLead(lead);
    form.reset({
      nome: lead.nome,
      telefone: formatPhone(lead.telefone),
      email: lead.email || "",
      cpf: lead.cpf ? formatCPF(lead.cpf) : "",
      canal_origem: lead.canal_origem,
      status: lead.status,
      interesse: lead.interesse || "",
      observacoes: lead.observacoes || "",
      campanha: lead.campanha || "",
      utm_source: lead.utm_source || "",
      utm_medium: lead.utm_medium || "",
      utm_campaign: lead.utm_campaign || "",
      utm_content: lead.utm_content || "",
      origem_url: lead.origem_url || "",
    });
    setIsEditLeadOpen(true);
  };

  const openDetailsModal = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  const openDeleteDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDeleteOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      novo: { label: "Novo", className: "bg-blue-100 text-blue-800 border-blue-200" },
      qualificado: { label: "Qualificado", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      convertido: { label: "Convertido", className: "bg-green-100 text-green-800 border-green-200" },
    };
    
    const statusConfig = config[status as keyof typeof config] || config.novo;
    
    return (
      <Badge variant="outline" className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    );
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
            <p className="text-destructive/80 mb-4 whitespace-pre-wrap">{error}</p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>💡 Solução:</strong>
              </p>
              <ol className="text-sm text-yellow-700 list-decimal list-inside mt-2 space-y-1">
                <li>Abra esta URL em uma nova aba:</li>
                <li className="ml-4 font-mono text-xs break-all">
                  {API_BASE_URL}/leads
                </li>
                <li>Clique em "Visit Site" se aparecer</li>
                <li>Volte aqui e clique em "Tentar novamente"</li>
              </ol>
            </div>
            
            <Button onClick={fetchLeads} variant="destructive">
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Total de Leads: {leads.length}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie seus leads e potenciais clientes
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchLeads} variant="outline">
              🔄 Recarregar
            </Button>
            <Button onClick={openNewLeadModal}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lead
            </Button>
          </div>
        </div>
        
        {leads.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground text-lg">Nenhum lead encontrado</p>
            <Button onClick={openNewLeadModal} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Criar primeiro lead
            </Button>
          </div>
        ) : (
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
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {lead.nome}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        📱 {formatPhone(lead.telefone)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {lead.email ? `✉️ ${lead.email}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {lead.canal_origem}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetailsModal(lead)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditLeadModal(lead)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(lead)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Novo Lead */}
      <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo lead
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(11) 98765-4321"
                          {...field}
                          onChange={(e) => {
                            handlePhoneInput(e);
                            field.onChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          {...field}
                          onChange={(e) => {
                            handleCPFInput(e);
                            field.onChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="canal_origem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canal de Origem *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o canal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="Site">Site</SelectItem>
                          <SelectItem value="Indicação">Indicação</SelectItem>
                          <SelectItem value="Google Ads">Google Ads</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="qualificado">Qualificado</SelectItem>
                          <SelectItem value="convertido">Convertido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="interesse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interesse</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Limpeza de pele, Botox" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Anotações sobre o lead" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Accordion type="single" collapsible className="border rounded-lg">
                <AccordionItem value="marketing" className="border-0">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    📊 Dados de Marketing
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="campanha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Campanha</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da campanha" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="utm_source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UTM Source</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: google, facebook" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="utm_medium"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UTM Medium</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: cpc, email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="utm_campaign"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UTM Campaign</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da campanha UTM" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="utm_content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UTM Content</FormLabel>
                            <FormControl>
                              <Input placeholder="Conteúdo do anúncio" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="origem_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Origem URL</FormLabel>
                            <FormControl>
                              <Input placeholder="URL de origem" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsNewLeadOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Lead'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Lead */}
      <Dialog open={isEditLeadOpen} onOpenChange={setIsEditLeadOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
            <DialogDescription>
              Atualize os dados do lead
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(11) 98765-4321"
                          {...field}
                          onChange={(e) => {
                            handlePhoneInput(e);
                            field.onChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          {...field}
                          onChange={(e) => {
                            handleCPFInput(e);
                            field.onChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="canal_origem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canal de Origem *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o canal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="Site">Site</SelectItem>
                          <SelectItem value="Indicação">Indicação</SelectItem>
                          <SelectItem value="Google Ads">Google Ads</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="novo">Novo</SelectItem>
                          <SelectItem value="qualificado">Qualificado</SelectItem>
                          <SelectItem value="convertido">Convertido</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="interesse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interesse</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Limpeza de pele, Botox" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Anotações sobre o lead" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Accordion type="single" collapsible className="border rounded-lg">
                <AccordionItem value="marketing" className="border-0">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    📊 Dados de Marketing
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="campanha"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Campanha</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da campanha" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="utm_source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UTM Source</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: google, facebook" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="utm_medium"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UTM Medium</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: cpc, email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="utm_campaign"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UTM Campaign</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da campanha UTM" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="utm_content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UTM Content</FormLabel>
                            <FormControl>
                              <Input placeholder="Conteúdo do anúncio" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="origem_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Origem URL</FormLabel>
                            <FormControl>
                              <Input placeholder="URL de origem" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditLeadOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedLead?.nome}
              {selectedLead && getStatusBadge(selectedLead.status)}
            </DialogTitle>
            <DialogDescription>
              Informações completas do lead
            </DialogDescription>
          </DialogHeader>
          
          {selectedLead && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground">📱 Contato</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefone:</span>
                    <span className="font-medium">{formatPhone(selectedLead.telefone)}</span>
                  </div>
                  {selectedLead.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{selectedLead.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedLead.cpf && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground">📄 Documentos</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CPF:</span>
                      <span className="font-medium">{formatCPF(selectedLead.cpf)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground">📍 Origem</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Canal:</span>
                    <span className="font-medium">{selectedLead.canal_origem}</span>
                  </div>
                  {selectedLead.campanha && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Campanha:</span>
                      <span className="font-medium">{selectedLead.campanha}</span>
                    </div>
                  )}
                </div>
              </div>

              {(selectedLead.utm_source || selectedLead.utm_medium || selectedLead.utm_campaign) && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground">📊 Marketing</h3>
                  <div className="space-y-2 text-sm">
                    {selectedLead.utm_source && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">UTM Source:</span>
                        <span className="font-medium">{selectedLead.utm_source}</span>
                      </div>
                    )}
                    {selectedLead.utm_medium && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">UTM Medium:</span>
                        <span className="font-medium">{selectedLead.utm_medium}</span>
                      </div>
                    )}
                    {selectedLead.utm_campaign && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">UTM Campaign:</span>
                        <span className="font-medium">{selectedLead.utm_campaign}</span>
                      </div>
                    )}
                    {selectedLead.utm_content && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">UTM Content:</span>
                        <span className="font-medium">{selectedLead.utm_content}</span>
                      </div>
                    )}
                    {selectedLead.origem_url && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Origem URL:</span>
                        <span className="font-medium text-xs break-all">{selectedLead.origem_url}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(selectedLead.interesse || selectedLead.observacoes) && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-foreground">📝 Informações</h3>
                  <div className="space-y-2 text-sm">
                    {selectedLead.interesse && (
                      <div>
                        <span className="text-muted-foreground">Interesse:</span>
                        <p className="font-medium mt-1">{selectedLead.interesse}</p>
                      </div>
                    )}
                    {selectedLead.observacoes && (
                      <div>
                        <span className="text-muted-foreground">Observações:</span>
                        <p className="font-medium mt-1">{selectedLead.observacoes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground">📅 Datas</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criado em:</span>
                    <span className="font-medium">
                      {new Date(selectedLead.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atualizado em:</span>
                    <span className="font-medium">
                      {new Date(selectedLead.updated_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDetailsOpen(false);
                if (selectedLead) {
                  openEditLeadModal(selectedLead);
                }
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsDetailsOpen(false);
                if (selectedLead) {
                  openDeleteDialog(selectedLead);
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
            <Button
              variant="default"
              onClick={() => {
                toast({
                  title: "Em breve",
                  description: "Funcionalidade de conversão em cliente será implementada em breve!",
                });
              }}
            >
              Converter em Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Confirmar Exclusão */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O lead <strong>{selectedLead?.nome}</strong> será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
