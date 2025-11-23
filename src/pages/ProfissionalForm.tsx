import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Loader2, Upload, X, Save
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

const diasSemana = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

export default function ProfissionalForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [especialidadesSelecionadas, setEspecialidadesSelecionadas] = useState<string[]>([]);

  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");

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
    fetchEspecialidades();
    if (isEdit) {
      fetchProfissional();
    }
  }, [id]);

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

  const fetchProfissional = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/profissionais/${id}`, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        const prof = result.data;
        
        form.reset({
          nome: prof.nome,
          email: prof.email || "",
          telefone: prof.telefone || "",
          whatsapp: prof.whatsapp || "",
          cpf: prof.cpf || "",
          registro_profissional: prof.registro_profissional || "",
          biografia: prof.biografia || "",
          duracao_padrao_consulta: parseInt(prof.duracao_padrao_consulta.split(":")[1]) || 60,
          permite_agendamento_online: prof.permite_agendamento_online,
          comissao_percentual: prof.comissao_percentual || 0,
          data_admissao: prof.data_admissao || "",
          observacoes: prof.observacoes || "",
        });

        setFotoUrl(prof.foto_url || "");
        setFotoPreview(prof.foto_url || "");
        setEspecialidadesSelecionadas(prof.especialidades?.map((e: any) => e.especialidade.id) || []);
        setHorarios(prof.horario_trabalho);
      }
    } catch (error) {
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os dados do profissional",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const handleHorarioChange = (key: string, field: keyof HorarioDia, value: any) => {
    setHorarios((prev) => ({
      ...prev,
      [key]: {
        ...prev[key as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const copiarHorarioParaTodos = () => {
    const primeiroAtivo = Object.entries(horarios).find(([_, h]) => h.ativo);
    if (primeiroAtivo) {
      const [_, horarioBase] = primeiroAtivo;
      const novosHorarios: any = {};

      diasSemana.forEach(({ key }) => {
        if (horarios[key as keyof typeof horarios].ativo) {
          novosHorarios[key] = { ...horarioBase };
        } else {
          novosHorarios[key] = horarios[key as keyof typeof horarios];
        }
      });

      setHorarios(novosHorarios);
      toast({
        title: "Horários copiados",
        description: "Horário copiado para todos os dias ativos",
      });
    }
  };

  const onSubmit = async (data: any) => {
    try {
      // Validar especialidades
      if (especialidadesSelecionadas.length === 0) {
        toast({
          title: "⚠️ Especialidade obrigatória",
          description: "Selecione pelo menos uma especialidade",
          variant: "destructive",
        });
        return;
      }

      setSubmitting(true);
      let finalFotoUrl = fotoUrl;

      // Upload de foto se houver
      if (fotoFile) {
        setUploading(true);
        try {
          finalFotoUrl = await uploadFoto(fotoFile);
        } catch (error: any) {
          toast({
            title: "⚠️ Erro no upload da foto",
            description: error.message,
            variant: "destructive",
          });
          setUploading(false);
          setSubmitting(false);
          return;
        }
        setUploading(false);
      }

      const payload = {
        ...(isEdit ? {} : { funcao_id: 1 }),
        nome: data.nome,
        email: data.email || null,
        telefone: data.telefone || null,
        whatsapp: data.whatsapp || null,
        cpf: data.cpf || null,
        foto_url: finalFotoUrl || null,
        registro_profissional: data.registro_profissional || null,
        biografia: data.biografia || null,
        horario_trabalho: horarios,
        duracao_padrao_consulta: (() => {
          const totalMinutos = data.duracao_padrao_consulta;
          const horas = Math.floor(totalMinutos / 60);
          const minutos = totalMinutos % 60;
          return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:00`;
        })(),
        permite_agendamento_online: data.permite_agendamento_online,
        comissao_percentual: data.comissao_percentual || null,
        data_admissao: data.data_admissao || null,
        observacoes: data.observacoes || null,
        especialidades: especialidadesSelecionadas,
      };

      const url = isEdit
        ? `${API_BASE_URL}/profissionais/${id}`
        : `${API_BASE_URL}/profissionais`;

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Erro do backend:", errorData);
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      toast({
        title: isEdit ? "Profissional atualizado" : "Profissional criado",
        description: isEdit 
          ? "Dados atualizados com sucesso" 
          : "Profissional cadastrado com sucesso",
      });

      navigate("/profissionais");
    } catch (error: any) {
      toast({
        title: isEdit ? "Erro ao atualizar" : "Erro ao criar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title={isEdit ? "Editar Profissional" : "Novo Profissional"}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEdit ? "Editar Profissional" : "Novo Profissional"}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/profissionais")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para lista
        </Button>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* DADOS BÁSICOS */}
            <Card>
              <CardHeader>
                <CardTitle>Dados Básicos</CardTitle>
                <CardDescription>
                  Informações principais do profissional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload de Foto */}
                <div className="space-y-2">
                  <FormLabel>Foto do Profissional</FormLabel>
                  <div className="flex items-center gap-4">
                    {fotoPreview ? (
                      <div className="relative">
                        <img
                          src={fotoPreview}
                          alt="Preview"
                          className="w-24 h-24 rounded-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={handleRemoveFoto}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFotoChange}
                        className="max-w-xs"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG ou WEBP. Máximo 2MB
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
                        <Input placeholder="Nome do profissional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
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
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
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
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="registro_profissional"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registro Profissional</FormLabel>
                      <FormControl>
                        <Input placeholder="CRM, CRO, etc" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="biografia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biografia</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Breve descrição do profissional..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* ESPECIALIDADES */}
            <Card>
              <CardHeader>
                <CardTitle>Especialidades *</CardTitle>
                <CardDescription>
                  Selecione as especialidades do profissional. A primeira será marcada como principal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {especialidades.map((esp, index) => {
                    const Icon = (Icons as any)[esp.icone] || Icons.Star;
                    const isSelected = especialidadesSelecionadas.includes(esp.id);
                    const isPrimeira = especialidadesSelecionadas[0] === esp.id;

                    return (
                      <div
                        key={esp.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-primary/50"
                        }`}
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
                        {/* Indicador visual em vez de Checkbox */}
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected ? 'bg-primary border-primary' : 'border-muted'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        
                        <div
                          className="p-2 rounded"
                          style={{
                            backgroundColor: `${esp.cor}20`,
                            color: esp.cor,
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {esp.nome}
                            </span>
                            {isPrimeira && (
                              <Badge variant="default" className="text-xs">
                                ⭐
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* HORÁRIOS DE TRABALHO */}
            <Card>
              <CardHeader>
                <CardTitle>Horários de Trabalho</CardTitle>
                <CardDescription>
                  Configure os horários semanais do profissional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {diasSemana.map(({ key, label }) => {
                  const horario = horarios[key as keyof typeof horarios];

                  return (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-[120px]">
                        <Checkbox
                          checked={horario.ativo}
                          onCheckedChange={(checked) =>
                            handleHorarioChange(key, "ativo", !!checked)
                          }
                        />
                        <span className="font-medium">{label}</span>
                      </div>

                      {horario.ativo ? (
                        <div className="flex flex-wrap items-center gap-2 flex-1">
                          <Input
                            type="time"
                            value={horario.inicio || ""}
                            onChange={(e) =>
                              handleHorarioChange(key, "inicio", e.target.value)
                            }
                            className="w-24"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="time"
                            value={horario.fim || ""}
                            onChange={(e) =>
                              handleHorarioChange(key, "fim", e.target.value)
                            }
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground ml-2">
                            Almoço:
                          </span>
                          <Input
                            type="time"
                            value={horario.intervalo_inicio || ""}
                            onChange={(e) =>
                              handleHorarioChange(
                                key,
                                "intervalo_inicio",
                                e.target.value
                              )
                            }
                            className="w-24"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="time"
                            value={horario.intervalo_fim || ""}
                            onChange={(e) =>
                              handleHorarioChange(key, "intervalo_fim", e.target.value)
                            }
                            className="w-24"
                          />
                        </div>
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
              </CardContent>
            </Card>

            {/* CONFIGURAÇÕES ADICIONAIS */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="duracao_padrao_consulta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duração Padrão de Atendimento (minutos)</FormLabel>
                        <FormControl>
                          <Input type="number" min="15" step="15" {...field} />
                        </FormControl>
                        <FormMessage />
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
                          <Input type="number" min="0" max="100" step="0.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="data_admissao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Admissão</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permite_agendamento_online"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Permite agendamento online</FormLabel>
                        <FormDescription>
                          Clientes podem agendar horários com este profissional pela plataforma
                        </FormDescription>
                      </div>
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
                        <Textarea
                          placeholder="Observações internas sobre o profissional..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* BOTÕES FIXOS */}
            <div className="sticky bottom-0 bg-background border-t p-4 flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/profissionais")}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando foto...
                  </>
                ) : submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEdit ? "Atualizar" : "Criar"} Profissional
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
