import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Loader2, Search, Calendar as CalendarIcon, Clock, DollarSign, User
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const API_BASE_URL = "https://viewlessly-unadjoining-lashanda.ngrok-free.dev/api/v1";

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
}

interface Profissional {
  id: string;
  nome: string;
  foto_url?: string;
}

interface Produto {
  id: number;
  nome: string;
  preco_padrao: number;
  duracao_padrao_minutos?: number;
}

export default function AgendamentoForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Dados
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);

  // Formulário
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [profissionalId, setProfissionalId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [data, setData] = useState<Date>();
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [valorServico, setValorServico] = useState(0);
  const [valorDesconto, setValorDesconto] = useState(0);
  const [observacoes, setObservacoes] = useState("");
  const [observacoesInternas, setObservacoesInternas] = useState("");

  // Busca de lead
  const [buscaLead, setBuscaLead] = useState("");
  const [leadComboOpen, setLeadComboOpen] = useState(false);

  // Modal criar lead
  const [criarLeadOpen, setCriarLeadOpen] = useState(false);
  const [novoLeadNome, setNovoLeadNome] = useState("");
  const [novoLeadTelefone, setNovoLeadTelefone] = useState("");
  const [novoLeadEmail, setNovoLeadEmail] = useState("");

  // Carregamento de horários
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  useEffect(() => {
    carregarDados();
    if (isEdit) {
      carregarAgendamento();
    }
  }, [id]);

  useEffect(() => {
    if (profissionalId && data) {
      buscarHorariosDisponiveis();
    }
  }, [profissionalId, data, produtoId]);

  const carregarDados = async () => {
    try {
      const [leadsRes, profissionaisRes, produtosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/leads`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        }),
        fetch(`${API_BASE_URL}/profissionais`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        }),
        fetch(`${API_BASE_URL}/produtos`, {
          headers: { "ngrok-skip-browser-warning": "true" }
        })
      ]);

      const leadsData = await leadsRes.json();
      const profissionaisData = await profissionaisRes.json();
      const produtosData = await produtosRes.json();

      if (leadsData.success) setLeads(leadsData.data || []);
      if (profissionaisData.success) setProfissionais(profissionaisData.data || []);
      if (produtosData.success) setProdutos(produtosData.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const carregarAgendamento = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/agendamentos/${id}`, {
        headers: { "ngrok-skip-browser-warning": "true" }
      });
      const result = await response.json();

      if (result.success && result.data) {
        const agendamento = result.data;
        setLeadSelecionado(agendamento.Lead);
        setProfissionalId(agendamento.profissional_id);
        setProdutoId(agendamento.produto_id);
        setData(new Date(agendamento.data_hora_inicio));
        setHorarioSelecionado(format(new Date(agendamento.data_hora_inicio), "HH:mm"));
        setValorServico(agendamento.valor || 0);
        setValorDesconto(agendamento.valor_desconto || 0);
        setObservacoes(agendamento.observacoes || "");
        setObservacoesInternas(agendamento.observacoes_internas || "");
      }
    } catch (error) {
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar o agendamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buscarHorariosDisponiveis = async () => {
    if (!profissionalId || !data) return;

    try {
      setLoadingHorarios(true);
      const dataFormatada = format(data, "yyyy-MM-dd");
      const produtoSelecionado = produtos.find(p => p.id === parseInt(produtoId));
      const duracao = produtoSelecionado?.duracao_padrao_minutos || 60;

      const response = await fetch(
        `${API_BASE_URL}/agendamentos/horarios-disponiveis?profissional_id=${profissionalId}&data=${dataFormatada}&duracao_minutos=${duracao}`,
        { headers: { "ngrok-skip-browser-warning": "true" } }
      );
      const result = await response.json();

      if (result.success) {
        setHorariosDisponiveis(result.horarios || []);
      }
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const criarNovoLead = async () => {
    if (!novoLeadNome || !novoLeadTelefone) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e telefone são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          nome: novoLeadNome,
          telefone: novoLeadTelefone,
          email: novoLeadEmail,
          canal_origem: "agendamento_manual",
          status: "novo"
        }),
      });

      const result = await response.json();

      if (result.success) {
        const novoLead = result.data;
        setLeads([...leads, novoLead]);
        setLeadSelecionado(novoLead);
        setCriarLeadOpen(false);
        setNovoLeadNome("");
        setNovoLeadTelefone("");
        setNovoLeadEmail("");
        
        toast({
          title: "Lead criado",
          description: "Lead criado e selecionado com sucesso",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao criar lead",
        description: "Não foi possível criar o lead",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leadSelecionado || !profissionalId || !produtoId || !data || !horarioSelecionado) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const produtoSelecionado = produtos.find(p => p.id === parseInt(produtoId));
      const duracao = produtoSelecionado?.duracao_padrao_minutos || 60;

      const dataFormatada = format(data, "yyyy-MM-dd");
      const dataHoraInicio = `${dataFormatada}T${horarioSelecionado}:00`;
      
      const [hora, minuto] = horarioSelecionado.split(":").map(Number);
      const totalMinutos = hora * 60 + minuto + duracao;
      const horaFim = Math.floor(totalMinutos / 60);
      const minutoFim = totalMinutos % 60;
      const dataHoraFim = `${dataFormatada}T${String(horaFim).padStart(2, "0")}:${String(minutoFim).padStart(2, "0")}:00`;

      const valorFinal = valorServico - valorDesconto;

      const payload = {
        lead_id: leadSelecionado.id,
        profissional_id: profissionalId,
        produto_id: parseInt(produtoId),
        data_hora_inicio: dataHoraInicio,
        data_hora_fim: dataHoraFim,
        duracao_minutos: duracao,
        valor: valorServico,
        valor_desconto: valorDesconto,
        valor_final: valorFinal,
        observacoes,
        observacoes_internas: observacoesInternas,
      };

      const url = isEdit
        ? `${API_BASE_URL}/agendamentos/${id}`
        : `${API_BASE_URL}/agendamentos`;

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erro ao salvar agendamento");
      }

      toast({
        title: isEdit ? "Agendamento atualizado" : "Agendamento criado",
        description: isEdit
          ? "Agendamento atualizado com sucesso"
          : "Agendamento criado com sucesso",
      });

      navigate("/agendamentos");
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const leadsFiltrados = leads.filter(
    (lead) =>
      lead.nome.toLowerCase().includes(buscaLead.toLowerCase()) ||
      lead.telefone?.includes(buscaLead)
  );

  if (loading) {
    return (
      <DashboardLayout title={isEdit ? "Editar Agendamento" : "Novo Agendamento"}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEdit ? "Editar Agendamento" : "Novo Agendamento"}>
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/agendamentos")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para lista
        </Button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CLIENTE/LEAD */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
              <CardDescription>
                Busque um cliente existente ou crie um novo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Buscar Cliente *</Label>
                <Popover open={leadComboOpen} onOpenChange={setLeadComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {leadSelecionado
                        ? `${leadSelecionado.nome} - ${leadSelecionado.telefone}`
                        : "Selecione um cliente..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Buscar por nome ou telefone..."
                        value={buscaLead}
                        onValueChange={setBuscaLead}
                      />
                      <CommandEmpty>
                        <div className="p-4 text-center">
                          <p className="text-sm text-muted-foreground mb-3">
                            Nenhum cliente encontrado
                          </p>
                          <Button
                            size="sm"
                            onClick={() => {
                              setLeadComboOpen(false);
                              setCriarLeadOpen(true);
                            }}
                          >
                            + Criar novo cliente
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {leadsFiltrados.map((lead) => (
                          <CommandItem
                            key={lead.id}
                            value={lead.id}
                            onSelect={() => {
                              setLeadSelecionado(lead);
                              setLeadComboOpen(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{lead.nome}</span>
                              <span className="text-sm text-muted-foreground">
                                {lead.telefone}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {leadSelecionado && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{leadSelecionado.nome}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        📱 {leadSelecionado.telefone}
                      </div>
                      {leadSelecionado.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          ✉️ {leadSelecionado.email}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* PROFISSIONAL E SERVIÇO */}
          <Card>
            <CardHeader>
              <CardTitle>Profissional e Serviço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profissional">Profissional *</Label>
                  <select
                    id="profissional"
                    value={profissionalId}
                    onChange={(e) => setProfissionalId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="">Selecione...</option>
                    {profissionais.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="produto">Serviço *</Label>
                  <select
                    id="produto"
                    value={produtoId}
                    onChange={(e) => {
                      setProdutoId(e.target.value);
                      const produto = produtos.find(
                        (p) => p.id === parseInt(e.target.value)
                      );
                      if (produto) {
                        setValorServico(produto.preco_padrao || 0);
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="">Selecione...</option>
                    {produtos.map((produto) => (
                      <option key={produto.id} value={produto.id}>
                        {produto.nome} - R$ {produto.preco_padrao?.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DATA E HORÁRIO */}
          <Card>
            <CardHeader>
              <CardTitle>Data e Horário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {data ? format(data, "PPP", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={data}
                      onSelect={setData}
                      locale={ptBR}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {profissionalId && data && (
                <div className="space-y-2">
                  <Label>Horários Disponíveis *</Label>
                  {loadingHorarios ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : horariosDisponiveis.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center bg-muted rounded">
                      Nenhum horário disponível nesta data
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {horariosDisponiveis.map((horario) => (
                        <button
                          key={horario}
                          type="button"
                          onClick={() => setHorarioSelecionado(horario)}
                          className={`px-3 py-2 rounded border text-sm transition-colors ${
                            horarioSelecionado === horario
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-muted border-muted"
                          }`}
                        >
                          <Clock className="h-3 w-3 mx-auto mb-1" />
                          {horario}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* VALORES */}
          <Card>
            <CardHeader>
              <CardTitle>Valores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valorServico">Valor do Serviço</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="valorServico"
                      type="number"
                      step="0.01"
                      value={valorServico}
                      onChange={(e) => setValorServico(parseFloat(e.target.value) || 0)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valorDesconto">Desconto</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="valorDesconto"
                      type="number"
                      step="0.01"
                      value={valorDesconto}
                      onChange={(e) => setValorDesconto(parseFloat(e.target.value) || 0)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Valor Final</Label>
                  <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted font-bold text-green-600">
                    R$ {(valorServico - valorDesconto).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OBSERVAÇÕES */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações para o Cliente</Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                  placeholder="Informações que o cliente verá..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoesInternas">Observações Internas</Label>
                <Textarea
                  id="observacoesInternas"
                  value={observacoesInternas}
                  onChange={(e) => setObservacoesInternas(e.target.value)}
                  rows={3}
                  placeholder="Anotações internas (não visíveis ao cliente)..."
                />
              </div>
            </CardContent>
          </Card>

          {/* BOTÕES */}
          <div className="sticky bottom-0 bg-background border-t p-4 flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/agendamentos")}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>{isEdit ? "Atualizar" : "Criar"} Agendamento</>
              )}
            </Button>
          </div>
        </form>

        {/* MODAL CRIAR LEAD */}
        <Dialog open={criarLeadOpen} onOpenChange={setCriarLeadOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo cliente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="novoNome">Nome *</Label>
                <Input
                  id="novoNome"
                  value={novoLeadNome}
                  onChange={(e) => setNovoLeadNome(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novoTelefone">Telefone *</Label>
                <Input
                  id="novoTelefone"
                  value={novoLeadTelefone}
                  onChange={(e) => setNovoLeadTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novoEmail">E-mail</Label>
                <Input
                  id="novoEmail"
                  type="email"
                  value={novoLeadEmail}
                  onChange={(e) => setNovoLeadEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCriarLeadOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={criarNovoLead}>
                Criar Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
