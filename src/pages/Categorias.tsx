import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import * as Icons from "lucide-react";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Eye,
  Folder,
} from "lucide-react";
import api from '@/lib/api';

interface Categoria {
  id: string;
  cliente_id: number;
  empresa_id: number;
  nome: string;
  descricao?: string;
  icone?: string;
  cor?: string;
  slug: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface Grupo {
  id: string;
  categoria_id: string;
  cliente_id: number;
  empresa_id: number;
  nome: string;
  descricao?: string;
  slug: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  categoria?: {
    id: string;
    nome: string;
    icone: string;
    cor: string;
  };
}

const categoriaSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  descricao: z.string().optional(),
  icone: z.string().optional(),
  cor: z.string().optional(),
  slug: z.string().min(1, "Slug é obrigatório"),
  ordem: z.coerce.number().default(0),
});

const grupoSchema = z.object({
  categoria_id: z.string().min(1, "Selecione uma categoria"),
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  descricao: z.string().optional(),
  slug: z.string().min(1, "Slug é obrigatório"),
  ordem: z.coerce.number().default(0),
});

const iconOptions = [
  { value: "Sparkles", label: "Sparkles ✨" },
  { value: "Heart", label: "Heart ❤️" },
  { value: "Scissors", label: "Scissors ✂️" },
  { value: "Hand", label: "Hand ✋" },
  { value: "Waves", label: "Waves 🌊" },
  { value: "Smile", label: "Smile 😊" },
  { value: "Sun", label: "Sun ☀️" },
  { value: "Droplet", label: "Droplet 💧" },
  { value: "Shield", label: "Shield 🛡️" },
  { value: "Activity", label: "Activity 📊" },
  { value: "Stethoscope", label: "Stethoscope 🩺" },
  { value: "FileText", label: "FileText 📄" },
];

const colorOptions = [
  { value: "#ec4899", label: "Rosa" },
  { value: "#f97316", label: "Laranja" },
  { value: "#8b5cf6", label: "Roxo" },
  { value: "#10b981", label: "Verde" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#f59e0b", label: "Amarelo" },
  { value: "#06b6d4", label: "Ciano" },
  { value: "#6366f1", label: "Índigo" },
];

const gerarSlug = (nome: string): string => {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
};

export default function Categorias() {
  const { toast } = useToast();

  // Estados Categorias
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isNewCategoriaOpen, setIsNewCategoriaOpen] = useState(false);
  const [isEditCategoriaOpen, setIsEditCategoriaOpen] = useState(false);
  const [isDeleteCategoriaOpen, setIsDeleteCategoriaOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  // Estados Grupos
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [isNewGrupoOpen, setIsNewGrupoOpen] = useState(false);
  const [isEditGrupoOpen, setIsEditGrupoOpen] = useState(false);
  const [isDeleteGrupoOpen, setIsDeleteGrupoOpen] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");

  const categoriaForm = useForm<z.infer<typeof categoriaSchema>>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      icone: "Package",
      cor: "#ec4899",
      slug: "",
      ordem: 0,
    },
  });

  const grupoForm = useForm<z.infer<typeof grupoSchema>>({
    resolver: zodResolver(grupoSchema),
    defaultValues: {
      categoria_id: "",
      nome: "",
      descricao: "",
      slug: "",
      ordem: 0,
    },
  });

  // Fetch Categorias
  const fetchCategorias = async () => {
    try {
      setLoadingCategorias(true);
      const response = await api.get('/categorias');
      setCategorias(response.data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar categorias",
        description: "Não foi possível carregar as categorias.",
        variant: "destructive",
      });
    } finally {
      setLoadingCategorias(false);
    }
  };

  // Fetch Grupos
  const fetchGrupos = async () => {
    try {
      setLoadingGrupos(true);
      const params = filtroCategoria ? { categoria_id: filtroCategoria } : {};
      const response = await api.get('/grupos', { params });
      setGrupos(response.data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar grupos",
        description: "Não foi possível carregar os grupos.",
        variant: "destructive",
      });
    } finally {
      setLoadingGrupos(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
    fetchGrupos();
  }, []);

  useEffect(() => {
    fetchGrupos();
  }, [filtroCategoria]);

  // Auto-gerar slug ao digitar nome (Categoria)
  const watchNomeCategoria = categoriaForm.watch("nome");
  useEffect(() => {
    if (watchNomeCategoria && !isEditCategoriaOpen) {
      categoriaForm.setValue("slug", gerarSlug(watchNomeCategoria));
    }
  }, [watchNomeCategoria, isEditCategoriaOpen]);

  // Auto-gerar slug ao digitar nome (Grupo)
  const watchNomeGrupo = grupoForm.watch("nome");
  useEffect(() => {
    if (watchNomeGrupo && !isEditGrupoOpen) {
      grupoForm.setValue("slug", gerarSlug(watchNomeGrupo));
    }
  }, [watchNomeGrupo, isEditGrupoOpen]);

  // Handlers Categorias
  const handleCreateCategoria = async (data: z.infer<typeof categoriaSchema>) => {
    try {
      await api.post('/categorias', {
        nome: data.nome,
        descricao: data.descricao || "",
        icone: data.icone || "Package",
        cor: data.cor || "#ec4899",
        slug: data.slug,
        ordem: data.ordem || 0,
      });
      toast({
        title: "Categoria criada!",
        description: "A categoria foi criada com sucesso.",
      });
      setIsNewCategoriaOpen(false);
      categoriaForm.reset();
      fetchCategorias();
    } catch (error) {
      toast({
        title: "Erro ao criar categoria",
        description: "Não foi possível criar a categoria.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategoria = async (data: z.infer<typeof categoriaSchema>) => {
    if (!selectedCategoria) return;

    try {
      await api.patch(`/categorias/${selectedCategoria.id}`, data);
      toast({
        title: "Categoria atualizada!",
        description: "A categoria foi atualizada com sucesso.",
      });
      setIsEditCategoriaOpen(false);
      setSelectedCategoria(null);
      categoriaForm.reset();
      fetchCategorias();
    } catch (error) {
      toast({
        title: "Erro ao atualizar categoria",
        description: "Não foi possível atualizar a categoria.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategoria = async () => {
    if (!selectedCategoria) return;

    try {
      await api.delete(`/categorias/${selectedCategoria.id}`);
      toast({
        title: "Categoria excluída!",
        description: "A categoria foi excluída com sucesso.",
      });
      setIsDeleteCategoriaOpen(false);
      setSelectedCategoria(null);
      fetchCategorias();
      fetchGrupos();
    } catch (error) {
      toast({
        title: "Erro ao excluir categoria",
        description: "Não foi possível excluir a categoria.",
        variant: "destructive",
      });
    }
  };

  // Handlers Grupos
  const handleCreateGrupo = async (data: z.infer<typeof grupoSchema>) => {
    try {
      await api.post('/grupos', {
        categoria_id: data.categoria_id,
        nome: data.nome,
        descricao: data.descricao || "",
        slug: data.slug,
        ordem: data.ordem || 0,
      });
      toast({
        title: "Grupo criado!",
        description: "O grupo foi criado com sucesso.",
      });
      setIsNewGrupoOpen(false);
      grupoForm.reset();
      fetchGrupos();
    } catch (error) {
      toast({
        title: "Erro ao criar grupo",
        description: "Não foi possível criar o grupo.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateGrupo = async (data: z.infer<typeof grupoSchema>) => {
    if (!selectedGrupo) return;

    try {
      await api.patch(`/grupos/${selectedGrupo.id}`, data);
      toast({
        title: "Grupo atualizado!",
        description: "O grupo foi atualizado com sucesso.",
      });
      setIsEditGrupoOpen(false);
      setSelectedGrupo(null);
      grupoForm.reset();
      fetchGrupos();
    } catch (error) {
      toast({
        title: "Erro ao atualizar grupo",
        description: "Não foi possível atualizar o grupo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGrupo = async () => {
    if (!selectedGrupo) return;

    try {
      await api.delete(`/grupos/${selectedGrupo.id}`);
      toast({
        title: "Grupo excluído!",
        description: "O grupo foi excluído com sucesso.",
      });
      setIsDeleteGrupoOpen(false);
      setSelectedGrupo(null);
      fetchGrupos();
    } catch (error) {
      toast({
        title: "Erro ao excluir grupo",
        description: "Não foi possível excluir o grupo.",
        variant: "destructive",
      });
    }
  };

  const openEditCategoria = (categoria: Categoria) => {
    setSelectedCategoria(categoria);
    categoriaForm.reset({
      nome: categoria.nome,
      descricao: categoria.descricao || "",
      icone: categoria.icone || "Package",
      cor: categoria.cor || "#ec4899",
      slug: categoria.slug,
      ordem: categoria.ordem,
    });
    setIsEditCategoriaOpen(true);
  };

  const openEditGrupo = (grupo: Grupo) => {
    setSelectedGrupo(grupo);
    grupoForm.reset({
      categoria_id: grupo.categoria_id,
      nome: grupo.nome,
      descricao: grupo.descricao || "",
      slug: grupo.slug,
      ordem: grupo.ordem,
    });
    setIsEditGrupoOpen(true);
  };

  // Agrupar grupos por categoria
  const gruposFiltrados = filtroCategoria && filtroCategoria !== 'all'
    ? grupos.filter(g => g.categoria_id === filtroCategoria)
    : grupos;

  const gruposPorCategoria = gruposFiltrados.reduce((acc, grupo) => {
    const catId = grupo.categoria_id;
    if (!acc[catId]) {
      acc[catId] = [];
    }
    acc[catId].push(grupo);
    return acc;
  }, {} as Record<string, Grupo[]>);

  return (
    <DashboardLayout title="Configurações">
      <Tabs defaultValue="categorias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categorias">
            <Package className="h-4 w-4 mr-2" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="grupos">
            <Folder className="h-4 w-4 mr-2" />
            Grupos
          </TabsTrigger>
        </TabsList>

        {/* ABA CATEGORIAS */}
        <TabsContent value="categorias" className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">📦 Categorias de Produtos</h2>
              <p className="text-muted-foreground">
                Organize seus produtos em categorias personalizadas
              </p>
            </div>
            <Button onClick={() => setIsNewCategoriaOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>

          {loadingCategorias ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : categorias.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground">
                Nenhuma categoria cadastrada
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Crie sua primeira categoria para organizar seus produtos
              </p>
              <Button onClick={() => setIsNewCategoriaOpen(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {categorias.map((categoria) => {
                const IconComponent = (Icons as any)[categoria.icone || "Package"] || Icons.Package;
                return (
                  <Card key={categoria.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${categoria.cor}20` }}
                          >
                            <IconComponent
                              className="h-6 w-6"
                              style={{ color: categoria.cor }}
                            />
                          </div>
                          <div>
                            <CardTitle>{categoria.nome}</CardTitle>
                            <CardDescription>{categoria.descricao}</CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditCategoria(categoria)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCategoria(categoria);
                              setIsDeleteCategoriaOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ABA GRUPOS */}
        <TabsContent value="grupos" className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">📁 Grupos de Produtos</h2>
              <p className="text-muted-foreground">
                Organize produtos em grupos dentro das categorias
              </p>
            </div>
            <Button onClick={() => setIsNewGrupoOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Grupo
            </Button>
          </div>

          <div className="flex gap-4">
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Todas categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingGrupos ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : grupos.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground">
                Nenhum grupo cadastrado
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Crie seu primeiro grupo para organizar melhor seus produtos
              </p>
              <Button onClick={() => setIsNewGrupoOpen(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Novo Grupo
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(gruposPorCategoria).map(([catId, gruposCategoria]) => {
                const categoria = categorias.find((c) => c.id === catId);
                if (!categoria) return null;

                const IconComponent = (Icons as any)[categoria.icone || "Package"] || Icons.Package;

                return (
                  <div key={catId} className="space-y-3">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${categoria.cor}20` }}
                      >
                        <IconComponent
                          className="h-5 w-5"
                          style={{ color: categoria.cor }}
                        />
                      </div>
                      <h3 className="text-lg font-semibold">{categoria.nome}</h3>
                    </div>

                    <div className="grid gap-3 ml-12">
                      {gruposCategoria.map((grupo) => (
                        <Card key={grupo.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="py-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">{grupo.nome}</CardTitle>
                                {grupo.descricao && (
                                  <CardDescription className="text-sm">
                                    {grupo.descricao}
                                  </CardDescription>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditGrupo(grupo)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedGrupo(grupo);
                                    setIsDeleteGrupoOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* MODAL NOVA CATEGORIA */}
      <Dialog open={isNewCategoriaOpen} onOpenChange={setIsNewCategoriaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria para organizar seus produtos
            </DialogDescription>
          </DialogHeader>
          <Form {...categoriaForm}>
            <form onSubmit={categoriaForm.handleSubmit(handleCreateCategoria)} className="space-y-4">
              <FormField
                control={categoriaForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Facial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoriaForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva a categoria..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={categoriaForm.control}
                  name="icone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ícone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um ícone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {iconOptions.map((icon) => (
                            <SelectItem key={icon.value} value={icon.value}>
                              {icon.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoriaForm.control}
                  name="cor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma cor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colorOptions.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: color.value }}
                                />
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={categoriaForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input placeholder="facial" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoriaForm.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewCategoriaOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={categoriaForm.formState.isSubmitting}>
                  {categoriaForm.formState.isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Criar Categoria
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR CATEGORIA */}
      <Dialog open={isEditCategoriaOpen} onOpenChange={setIsEditCategoriaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Atualize as informações da categoria
            </DialogDescription>
          </DialogHeader>
          <Form {...categoriaForm}>
            <form onSubmit={categoriaForm.handleSubmit(handleUpdateCategoria)} className="space-y-4">
              <FormField
                control={categoriaForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Facial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoriaForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva a categoria..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={categoriaForm.control}
                  name="icone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ícone</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um ícone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {iconOptions.map((icon) => (
                            <SelectItem key={icon.value} value={icon.value}>
                              {icon.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoriaForm.control}
                  name="cor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma cor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {colorOptions.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: color.value }}
                                />
                                {color.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={categoriaForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input placeholder="facial" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoriaForm.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditCategoriaOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={categoriaForm.formState.isSubmitting}>
                  {categoriaForm.formState.isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG EXCLUIR CATEGORIA */}
      <AlertDialog open={isDeleteCategoriaOpen} onOpenChange={setIsDeleteCategoriaOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Excluir Categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{selectedCategoria?.nome}"?
              <br />
              Esta ação não pode ser desfeita. Todos os grupos e produtos associados
              ficarão sem categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategoria}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL NOVO GRUPO */}
      <Dialog open={isNewGrupoOpen} onOpenChange={setIsNewGrupoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Grupo</DialogTitle>
            <DialogDescription>
              Crie um novo grupo dentro de uma categoria
            </DialogDescription>
          </DialogHeader>
          <Form {...grupoForm}>
            <form onSubmit={grupoForm.handleSubmit(handleCreateGrupo)} className="space-y-4">
              <FormField
                control={grupoForm.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={grupoForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Limpeza de Pele" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={grupoForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o grupo..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={grupoForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input placeholder="limpeza-de-pele" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={grupoForm.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewGrupoOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={grupoForm.formState.isSubmitting}>
                  {grupoForm.formState.isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Criar Grupo
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR GRUPO */}
      <Dialog open={isEditGrupoOpen} onOpenChange={setIsEditGrupoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Grupo</DialogTitle>
            <DialogDescription>
              Atualize as informações do grupo
            </DialogDescription>
          </DialogHeader>
          <Form {...grupoForm}>
            <form onSubmit={grupoForm.handleSubmit(handleUpdateGrupo)} className="space-y-4">
              <FormField
                control={grupoForm.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={grupoForm.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Limpeza de Pele" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={grupoForm.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o grupo..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={grupoForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input placeholder="limpeza-de-pele" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={grupoForm.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditGrupoOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={grupoForm.formState.isSubmitting}>
                  {grupoForm.formState.isSubmitting && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG EXCLUIR GRUPO */}
      <AlertDialog open={isDeleteGrupoOpen} onOpenChange={setIsDeleteGrupoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Excluir Grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o grupo "{selectedGrupo?.nome}"?
              <br />
              Esta ação não pode ser desfeita. Produtos associados ficarão sem grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGrupo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
