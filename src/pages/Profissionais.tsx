import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Plus, Edit, Trash2, Loader2, Calendar, Phone, Mail, UserCog,
  Upload, X
} from "lucide-react";
import * as Icons from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const API_BASE_URL = "https://viewlessly-unadjoining-lashanda.ngrok-free.dev/api/v1";

interface HorarioDia {
  ativo: boolean;
  inicio: string | null;
  fim: string | null;
  intervalo_inicio: string | null;
  intervalo_fim: string | null;
}

interface Profissional {
  id: string;
  cliente_id: number;
  empresa_id: number;
  funcao_id: number;
  user_id?: string;
  nome: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  cpf?: string;
  foto_url?: string;
  registro_profissional?: string;
  biografia?: string;
  horario_trabalho: {
    seg: HorarioDia;
    ter: HorarioDia;
    qua: HorarioDia;
    qui: HorarioDia;
    sex: HorarioDia;
    sab: HorarioDia;
    dom: HorarioDia;
  };
  duracao_padrao_consulta: string;
  permite_agendamento_online: boolean;
  comissao_percentual?: number;
  status: string;
  data_admissao?: string;
  data_desligamento?: string;
  observacoes?: string;
  especialidades?: Array<{
    id: string;
    nivel: string;
    principal: boolean;
    ordem: number;
    especialidade: {
      id: string;
      nome: string;
      icone: string;
      cor: string;
    };
  }>;
  created_at: string;
  updated_at: string;
}

interface Especialidade {
  id: string;
  nome: string;
  icone: string;
  cor: string;
}

const profissionalSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  cpf: z.string().optional(),
  registro_profissional: z.string().optional(),
  biografia: z.string().optional(),
  duracao_padrao_consulta: z.coerce.number().min(15).default(60),
  permite_agendamento_online: z.boolean().default(true),
  comissao_percentual: z.coerce.number().min(0).max(100).optional(),
  data_admissao: z.string().optional(),
  observacoes: z.string().optional(),
});

const diasSemana = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

const horarioPadrao: HorarioDia = {
  ativo: true,
  inicio: "08:00",
  fim: "18:00",
  intervalo_inicio: "12:00",
  intervalo_fim: "13:00",
};

const horarioInativo: HorarioDia = {
  ativo: false,
  inicio: null,
  fim: null,
  intervalo_inicio: null,
  intervalo_fim: null,
};

export default function Profissionais() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [especialidadesSelecionadas, setEspecialidadesSelecionadas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);

  const [fotoUrl, setFotoUrl] = useState<string>("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/(-)?$/, '');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/(-)?$/, '');
  };

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').replace(/(-)?$/, '');
  };

  const [horarios, setHorarios] = useState({
    seg: { ...horarioPadrao },
    ter: { ...horarioPadrao },
    qua: { ...horarioPadrao },
    qui: { ...horarioPadrao },
    sex: { ...horarioPadrao },
    sab: { ...horarioInativo },
    dom: { ...horarioInativo },
  });

  const form = useForm({
    resolver: zodResolver(profissionalSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      whatsapp: "",
      cpf: "",
      registro_profissional: "",
      biografia: "",
      duracao_padrao_consulta: 60,
      permite_agendamento_online: true,
      comissao_percentual: 0,
      data_admissao: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    fetchProfissionais();
    fetchEspecialidades();
  }, []);

  const fetchProfissionais = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/profissionais`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const result = await response.json();
      if (result.success) {
        setProfissionais(result.data || []);
      }
    } catch (error) {
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os profissionais",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEspecialidades = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/especialidades?ativo=true`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const result = await response.json();
      if (result.success) {
        setEspecialidades(result.data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar especialidades:", error);
    }
  };

  const uploadFoto = async (file: File): Promise<string> => {
    if (file.size > 2 * 1024 * 1024) {
      throw new Error("Foto deve ter no máximo 2 MB");
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Formato deve ser JPG, PNG ou WEBP");
    }

    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const clienteId = 2;
    const empresaId = 2;
    const filePath = `${clienteId}/${empresaId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from("profissionais")
      .upload(filePath, file);

    if (error) throw new Error(`Erro no upload: ${error.message}`);

    const { data: urlData } = supabase.storage
      .from("profissionais")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFoto = () => {
    setFotoFile(null);
    setFotoPreview("");
    setFotoUrl("");
  };

  const copiarHorarioParaTodos = () => {
    const primeiroAtivo = Object.entries(horarios).find(([_, h]) => h.ativo);
    if (primeiroAtivo) {
      const [_, horarioBase] = primeiroAtivo;
      const novosHorarios: any = { ...horarios };
      diasSemana.forEach(({ key }) => {
        if (horarios[key as keyof typeof horarios].ativo) {
          novosHorarios[key] = { ...horarioBase };
        }
      });
      setHorarios(novosHorarios);
      toast({
        title: "Horários copiados",
        description: "Horário copiado para todos os dias ativos",
      });
    }
  };

  const openNew = () => {
    form.reset();
    setEspecialidadesSelecionadas([]);
    setFotoUrl("");
    setFotoFile(null);
    setFotoPreview("");
    setHorarios({
      seg: { ...horarioPadrao },
      ter: { ...horarioPadrao },
      qua: { ...horarioPadrao },
      qui: { ...horarioPadrao },
      sex: { ...horarioPadrao },
      sab: { ...horarioInativo },
      dom: { ...horarioInativo },
    });
    setIsNewOpen(true);
  };

  const openEdit = (profissional: Profissional) => {
    setSelectedProfissional(profissional);
    form.reset({
      nome: profissional.nome,
      email: profissional.email || "",
      telefone: profissional.telefone || "",
      whatsapp: profissional.whatsapp || "",
      cpf: profissional.cpf || "",
      registro_profissional: profissional.registro_profissional || "",
      biografia: profissional.biografia || "",
      duracao_padrao_consulta: parseInt(profissional.duracao_padrao_consulta.split(":")[1]) || 60,
      permite_agendamento_online: profissional.permite_agendamento_online,
      comissao_percentual: profissional.comissao_percentual || 0,
      data_admissao: profissional.data_admissao || "",
      observacoes: profissional.observacoes || "",
    });
    
    setFotoUrl(profissional.foto_url || "");
    setFotoPreview(profissional.foto_url || "");
    setFotoFile(null);
    
    setEspecialidadesSelecionadas(
      profissional.especialidades?.map((e) => e.especialidade.id) || []
    );
    
    setHorarios(profissional.horario_trabalho);
    setIsEditOpen(true);
  };

  const openDelete = (profissional: Profissional) => {
    setSelectedProfissional(profissional);
    setIsDeleteOpen(true);
  };

  const handleCreate = async (data: any) => {
    try {
      let finalFotoUrl = fotoUrl;

      if (fotoFile) {
        setUploading(true);
        finalFotoUrl = await uploadFoto(fotoFile);
      }

      const payload = {
        funcao_id: 1,
        nome: data.nome,
        email: data.email || null,
        telefone: data.telefone || null,
        whatsapp: data.whatsapp || null,
        cpf: data.cpf || null,
        foto_url: finalFotoUrl || null,
        registro_profissional: data.registro_profissional || null,
        biografia: data.biografia || null,
        horario_trabalho: horarios,
        duracao_padrao_consulta: `00:${String(data.duracao_padrao_consulta).padStart(2, "0")}:00`,
        permite_agendamento_online: data.permite_agendamento_online,
        comissao_percentual: data.comissao_percentual || null,
        data_admissao: data.data_admissao || null,
        observacoes: data.observacoes || null,
        especialidades: especialidadesSelecionadas,
      };

      const response = await fetch(`${API_BASE_URL}/profissionais`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro do backend:', errorData);
        throw new Error(errorData.error || errorData.message || "Erro ao criar profissional");
      }

      toast({
        title: "Profissional criado",
        description: "Profissional cadastrado com sucesso",
      });

      setIsNewOpen(false);
      fetchProfissionais();
    } catch (error: any) {
      toast({
        title: "Erro ao criar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    if (!selectedProfissional) return;

    try {
      let finalFotoUrl = fotoUrl;

      if (fotoFile) {
        setUploading(true);
        finalFotoUrl = await uploadFoto(fotoFile);
      }

      const payload = {
        nome: data.nome,
        email: data.email || null,
        telefone: data.telefone || null,
        whatsapp: data.whatsapp || null,
        cpf: data.cpf || null,
        foto_url: finalFotoUrl || null,
        registro_profissional: data.registro_profissional || null,
        biografia: data.biografia || null,
        horario_trabalho: horarios,
        duracao_padrao_consulta: `00:${String(data.duracao_padrao_consulta).padStart(2, "0")}:00`,
        permite_agendamento_online: data.permite_agendamento_online,
        comissao_percentual: data.comissao_percentual || null,
        data_admissao: data.data_admissao || null,
        observacoes: data.observacoes || null,
        especialidades: especialidadesSelecionadas,
      };

      const response = await fetch(`${API_BASE_URL}/profissionais/${selectedProfissional.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro do backend:', errorData);
        throw new Error(errorData.error || errorData.message || "Erro ao atualizar profissional");
      }

      toast({
        title: "Profissional atualizado",
        description: "Dados atualizados com sucesso",
      });

      setIsEditOpen(false);
      fetchProfissionais();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProfissional) return;

    try {
      const response = await fetch(`${API_BASE_URL}/profissionais/${selectedProfissional.id}`, {
        method: "DELETE",
        headers: { "ngrok-skip-browser-warning": "true" },
      });

      if (!response.ok) throw new Error("Erro ao excluir profissional");

      toast({
        title: "Profissional excluído",
        description: "Profissional removido com sucesso",
      });

      setIsDeleteOpen(false);
      fetchProfissionais();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getHorarioResumo = (horario: any) => {
    const diasAtivos = Object.entries(horario)
      .filter(([_, h]: any) => h.ativo)
      .map(([dia]) => dia.charAt(0).toUpperCase() + dia.slice(1));

    if (diasAtivos.length === 0) return "Não configurado";
    if (
      diasAtivos.length === 5 &&
      !diasAtivos.includes("Sab") &&
      !diasAtivos.includes("Dom")
    ) {
      return "Seg-Sex: 08:00-18:00";
    }
    return diasAtivos.join(", ");
  };

  const ProfissionalForm = () => (
    <Form {...form}>
      <form className="space-y-4">
        <Accordion type="single" collapsible defaultValue="basico">
          {/* INFORMAÇÕES BÁSICAS */}
          <AccordionItem value="basico">
            <AccordionTrigger>📝 Informações Básicas</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              {/* Upload de Foto */}
              <div className="space-y-3">
                <FormLabel>Foto do Profissional</FormLabel>
                <div className="flex items-center gap-4">
                  {fotoPreview ? (
                    <div className="relative">
                      <img
                        src={fotoPreview}
                        alt="Preview"
                        className="w-32 h-32 rounded-full object-cover border-4 border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 rounded-full h-8 w-8"
                        onClick={handleRemoveFoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                      <UserCog className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoChange}
                      className="max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG ou WEBP. Máximo 2 MB.
                    </p>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome do profissional" />
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
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@exemplo.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={field.value || ''}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            field.onChange(formatted);
                          }}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={field.value || ''}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            field.onChange(formatted);
                          }}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          value={field.value || ''}
                          onChange={(e) => {
                            const formatted = formatCPF(e.target.value);
                            field.onChange(formatted);
                          }}
                          maxLength={14}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registro_profissional"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registro Profissional</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: CRM 12345" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="biografia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biografia</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Breve descrição do profissional..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>

          {/* ESPECIALIDADES */}
          <AccordionItem value="especialidades">
            <AccordionTrigger>⭐ Especialidades</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-3">
                <FormLabel>Selecione as especialidades *</FormLabel>
                <div className="border rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                  {especialidades.map((esp, index) => {
                    const Icon = (Icons as any)[esp.icone] || Icons.Star;
                    const isSelected = especialidadesSelecionadas.includes(esp.id);
                    const isPrimeira = especialidadesSelecionadas[0] === esp.id;

                    return (
                      <div
                        key={esp.id}
                        className="flex items-center space-x-3 p-2 hover:bg-muted rounded-md cursor-pointer"
                        onClick={() => {
                          if (isSelected) {
                            setEspecialidadesSelecionadas(
                              especialidadesSelecionadas.filter((id) => id !== esp.id)
                            );
                          } else {
                            setEspecialidadesSelecionadas([
                              ...especialidadesSelecionadas,
                              esp.id,
                            ]);
                          }
                        }}
                      >
                        <Checkbox checked={isSelected} />
                        <div
                          className="p-2 rounded"
                          style={{
                            backgroundColor: `${esp.cor}20`,
                            color: esp.cor,
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{esp.nome}</span>
                            {isPrimeira && (
                              <Badge variant="default" className="text-xs">
                                ⭐ Principal
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  A primeira especialidade selecionada será marcada como principal
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* HORÁRIOS */}
          <AccordionItem value="horarios">
            <AccordionTrigger>⏰ Horários de Trabalho</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="space-y-3">
                <FormLabel>Configure os horários semanais</FormLabel>

                {diasSemana.map(({ key, label }) => {
                  const horario = horarios[key as keyof typeof horarios];

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-3 border rounded-lg flex-wrap"
                    >
                      <Checkbox
                        checked={horario.ativo}
                        onCheckedChange={(checked) => {
                          setHorarios({
                            ...horarios,
                            [key]: {
                              ...horario,
                              ativo: !!checked,
                            },
                          });
                        }}
                      />

                      <span className="w-20 font-medium">{label}</span>

                      {horario.ativo ? (
                        <>
                          <Input
                            type="time"
                            value={horario.inicio || ""}
                            onChange={(e) => {
                              setHorarios({
                                ...horarios,
                                [key]: { ...horario, inicio: e.target.value },
                              });
                            }}
                            className="w-24"
                          />
                          <span>-</span>
                          <Input
                            type="time"
                            value={horario.fim || ""}
                            onChange={(e) => {
                              setHorarios({
                                ...horarios,
                                [key]: { ...horario, fim: e.target.value },
                              });
                            }}
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">
                            Almoço:
                          </span>
                          <Input
                            type="time"
                            value={horario.intervalo_inicio || ""}
                            onChange={(e) => {
                              setHorarios({
                                ...horarios,
                                [key]: {
                                  ...horario,
                                  intervalo_inicio: e.target.value,
                                },
                              });
                            }}
                            className="w-24"
                          />
                          <span>-</span>
                          <Input
                            type="time"
                            value={horario.intervalo_fim || ""}
                            onChange={(e) => {
                              setHorarios({
                                ...horarios,
                                [key]: {
                                  ...horario,
                                  intervalo_fim: e.target.value,
                                },
                              });
                            }}
                            className="w-24"
                          />
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Não trabalha
                        </span>
                      )}
                    </div>
                  );
                })}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copiarHorarioParaTodos}
                >
                  Copiar horário para todos os dias ativos
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* CONFIGURAÇÕES ADICIONAIS */}
          <AccordionItem value="config">
            <AccordionTrigger>⚙️ Configurações Adicionais</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="duracao_padrao_consulta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração Padrão de Atendimento (minutos)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={15} step={15} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permite_agendamento_online"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">
                      Permite agendamento online
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comissao_percentual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comissão (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min={0} max={100} step={0.1} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_admissao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Admissão</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
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
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </form>
    </Form>
  );

  if (loading) {
    return (
      <DashboardLayout title="Profissionais">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando profissionais...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profissionais">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">👨‍⚕️ Profissionais</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie sua equipe de profissionais
            </p>
          </div>
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Profissional
          </Button>
        </div>

        {profissionais.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  Nenhum profissional cadastrado
                </p>
                <Button onClick={openNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar primeiro profissional
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profissionais.map((prof) => {
              return (
                <Card
                  key={prof.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        {prof.foto_url ? (
                          <img
                            src={prof.foto_url}
                            alt={prof.nome}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <UserCog className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div
                          className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                            prof.status === "ativo"
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        />
                      </div>

                      <div className="flex-1">
                        <CardTitle className="text-lg">{prof.nome}</CardTitle>
                        {prof.registro_profissional && (
                          <p className="text-sm text-muted-foreground">
                            {prof.registro_profissional}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {prof.telefone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {prof.telefone}
                      </div>
                    )}
                    {prof.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {prof.email}
                      </div>
                    )}

                    {prof.especialidades && prof.especialidades.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">
                          Especialidades:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {prof.especialidades.map((esp) => {
                            const Icon =
                              (Icons as any)[esp.especialidade.icone] ||
                              Icons.Star;
                            return (
                              <Badge
                                key={esp.id}
                                variant={
                                  esp.principal ? "default" : "secondary"
                                }
                                className="flex items-center gap-1"
                              >
                                <Icon className="h-3 w-3" />
                                {esp.especialidade.nome}
                                {esp.principal && " ⭐"}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="text-sm">
                      <p className="font-medium mb-1">Horário:</p>
                      <p className="text-muted-foreground">
                        {getHorarioResumo(prof.horario_trabalho)}
                      </p>
                    </div>

                    <Badge
                      variant={
                        prof.status === "ativo" ? "default" : "secondary"
                      }
                      className="w-fit"
                    >
                      {prof.status === "ativo" ? "🟢 Ativo" : "🔴 Inativo"}
                    </Badge>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEdit(prof)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDelete(prof)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL NOVO */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>✏️ Novo Profissional</DialogTitle>
          </DialogHeader>
          <ProfissionalForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={form.handleSubmit(handleCreate)}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Criar Profissional"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>✏️ Editar Profissional</DialogTitle>
          </DialogHeader>
          <ProfissionalForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={form.handleSubmit(handleUpdate)}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL EXCLUIR */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o profissional{" "}
              <strong>{selectedProfissional?.nome}</strong>? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
