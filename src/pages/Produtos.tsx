import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Loader2, Package, Eye, Edit, Trash2, Search, X } from "lucide-react";
import * as Icons from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";

// Configuração do Supabase
const supabase = createClient(
  "https://sunccjukvrximjiqzdkm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1bmNjanVrdnJ4aW1qaXF6ZGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzMyODUsImV4cCI6MjA3NDg0OTI4NX0.Xt68Jol4GQ-GeL7g4z_wmm6ui81BIpTNJmNO7WhR_7E"
);

const API_BASE_URL = "https://viewlessly-unadjoining-lashanda.ngrok-free.dev/api/v1";

interface Produto {
  id: number;
  cliente_id: number;
  empresa_id: number;
  nome: string;
  slug: string;
  descricao_curta?: string;
  descricao_completa?: string;
  categoria_id?: string;
  grupo_id?: string;
  tipo_estoque?: string;
  preco_padrao: number;
  preco_custo?: number;
  preco_promocional?: number;
  sku?: string;
  imagem_principal?: string;
  controla_estoque: string;
  quantidade_estoque: number;
  estoque_minimo: number;
  tem_variacoes: boolean;
  destaque: boolean;
  principal_destaque: boolean;
  ativo: boolean;
  status: string;
  variacoes?: Variacao[];
  created_at: string;
  updated_at: string;
}

interface Variacao {
  id?: string;
  produto_id?: number;
  nome: string;
  preco_venda: number;
  preco_custo?: number;
  preco_promocional?: number;
  duracao_minutos?: number;
  quantidade_estoque: number;
  estoque_minimo: number;
  imagem_url?: string;
  ativo: boolean;
  ordem: number;
}

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  cor: string;
}

interface Grupo {
  id: string;
  nome: string;
  categoria_id: string;
}

// Schema de validação
const produtoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  tipo_estoque: z.enum(["servico", "produto", "combo"], {
    required_error: "Selecione o tipo",
  }),
  categoria_id: z.string().min(1, "Selecione uma categoria"),
  grupo_id: z.string().optional(),
  descricao_curta: z.string().optional(),
  descricao_completa: z.string().optional(),
  preco_padrao: z.coerce.number().min(0, "Preço deve ser maior ou igual a zero").optional(),
  preco_custo: z.coerce.number().optional(),
  preco_promocional: z.coerce.number().optional(),
  sku: z.string().optional(),
  imagem_principal: z.string().optional(),
  controla_estoque: z.boolean().default(false),
  quantidade_estoque: z.coerce.number().default(0),
  estoque_minimo: z.coerce.number().default(0),
  tem_variacoes: z.boolean().default(false),
  destaque: z.boolean().default(false),
});

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);

  const [filtroCategoria, setFiltroCategoria] = useState("all");
  const [filtroGrupo, setFiltroGrupo] = useState("all");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [busca, setBusca] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingGaleria, setUploadingGaleria] = useState(false);
  const [galeriaImagens, setGaleriaImagens] = useState<string[]>([]);

  const form = useForm<z.infer<typeof produtoSchema>>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: "",
      tipo_estoque: "servico",
      categoria_id: "",
      grupo_id: "",
      descricao_curta: "",
      descricao_completa: "",
      preco_padrao: 0,
      preco_custo: 0,
      preco_promocional: 0,
      sku: "",
      imagem_principal: "",
      controla_estoque: false,
      quantidade_estoque: 0,
      estoque_minimo: 0,
      tem_variacoes: false,
      destaque: false,
    },
  });

  useEffect(() => {
    fetchCategorias();
    fetchGrupos();
    fetchProdutos();
  }, []);

  useEffect(() => {
    fetchProdutos();
  }, [filtroCategoria, filtroGrupo, filtroTipo, busca]);

  const fetchCategorias = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categorias`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });
      const result = await response.json();
      if (result.success) {
        setCategorias(result.data);
      }
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  const fetchGrupos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/grupos`, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });
      const result = await response.json();
      if (result.success) {
        setGrupos(result.data);
      }
    } catch (error) {
      console.error("Erro ao buscar grupos:", error);
    }
  };

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/produtos`;

      const params = new URLSearchParams();
      if (filtroCategoria && filtroCategoria !== "all") {
        params.append("categoria_id", filtroCategoria);
      }
      if (filtroGrupo && filtroGrupo !== "all") {
        params.append("grupo_id", filtroGrupo);
      }
      if (filtroTipo && filtroTipo !== "all") {
        params.append("tipo", filtroTipo);
      }
      if (busca) {
        params.append("busca", busca);
      }

      if (params.toString()) url += "?" + params.toString();

      const response = await fetch(url, {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });

      const result = await response.json();
      if (result.success) {
        setProdutos(result.data || []);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      toast({
        title: "❌ Erro ao carregar produtos",
        description: "Não foi possível carregar os produtos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadImagem = async (file: File): Promise<string> => {
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('Imagem deve ter no máximo 2 MB');
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Formato deve ser JPG, PNG ou WEBP');
    }
    
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const clienteId = 2;
    const empresaId = 2;
    const filePath = `${clienteId}/${empresaId}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('produtos')
      .upload(filePath, file);
    
    if (error) {
      throw new Error(`Erro no upload: ${error.message}`);
    }
    
    const { data: urlData } = supabase.storage
      .from('produtos')
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  };

  // Adicionar imagem à galeria
  const adicionarImagemGaleria = async (file: File) => {
    console.log('adicionarImagemGaleria chamado', file);
    console.log('galeriaImagens.length:', galeriaImagens.length);
    
    if (galeriaImagens.length >= 6) {
      toast({
        title: "⚠️ Limite atingido",
        description: "Máximo de 6 imagens na galeria",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setUploadingGaleria(true);
      console.log('Iniciando upload...');
      const url = await uploadImagem(file);
      console.log('Upload concluído, URL:', url);
      setGaleriaImagens([...galeriaImagens, url]);
      toast({
        title: "✅ Imagem adicionada!",
        description: "Imagem adicionada à galeria.",
      });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "❌ Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingGaleria(false);
    }
  };

  // Remover imagem da galeria
  const removerImagemGaleria = (index: number) => {
    setGaleriaImagens(galeriaImagens.filter((_, i) => i !== index));
  };

  const adicionarVariacao = () => {
    setVariacoes([
      ...variacoes,
      {
        id: `temp-${Date.now()}`,
        nome: "",
        preco_venda: 0,
        duracao_minutos: 0,
        quantidade_estoque: 0,
        estoque_minimo: 0,
        ativo: true,
        ordem: variacoes.length,
      },
    ]);
  };

  const removerVariacao = (id: string) => {
    setVariacoes(variacoes.filter((v) => v.id !== id));
  };

  const atualizarVariacao = (id: string, campo: string, valor: any) => {
    setVariacoes(variacoes.map((v) => (v.id === id ? { ...v, [campo]: valor } : v)));
  };

  const handleCreateProduto = async (data: z.infer<typeof produtoSchema>) => {
    try {
      const payload = {
        nome: data.nome,
        descricao_curta: data.descricao_curta,
        descricao_completa: data.descricao_completa,
        categoria_id: data.categoria_id,
        grupo_id: data.grupo_id || null,
        tipo_estoque: data.tipo_estoque,
        preco_padrao: data.tem_variacoes ? null : data.preco_padrao,
        preco_custo: data.preco_custo,
        preco_promocional: data.preco_promocional,
        sku: data.sku,
        imagem_principal: data.imagem_principal,
        imagem_galeria: galeriaImagens.length > 0 ? {
          principal: data.imagem_principal || galeriaImagens[0],
          galeria: galeriaImagens
        } : null,
        controla_estoque: data.controla_estoque ? 'sim' : 'nao',
        quantidade_estoque: data.quantidade_estoque,
        estoque_minimo: data.estoque_minimo,
        tem_variacoes: data.tem_variacoes,
        destaque: data.destaque,
        principal_destaque: data.destaque,
        variacoes: data.tem_variacoes ? variacoes.map((v, i) => ({
          ...v,
          ordem: i,
          imagem_url: v.imagem_url || null
        })) : [],
      };

      const response = await fetch(`${API_BASE_URL}/produtos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erro ao criar produto");

      const result = await response.json();

      toast({
        title: "✅ Produto criado!",
        description: "Produto criado com sucesso.",
      });

      setIsNewOpen(false);
      form.reset();
      setVariacoes([]);
      setGaleriaImagens([]);
      fetchProdutos();
    } catch (error: any) {
      toast({
        title: "❌ Erro ao criar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduto = async (data: z.infer<typeof produtoSchema>) => {
    if (!selectedProduto) return;

    try {
      const payload = {
        nome: data.nome,
        descricao_curta: data.descricao_curta,
        descricao_completa: data.descricao_completa,
        categoria_id: data.categoria_id,
        grupo_id: data.grupo_id || null,
        tipo_estoque: data.tipo_estoque,
        preco_padrao: data.tem_variacoes ? null : data.preco_padrao,
        preco_custo: data.preco_custo,
        preco_promocional: data.preco_promocional,
        sku: data.sku,
        imagem_principal: data.imagem_principal,
        imagem_galeria: galeriaImagens.length > 0 ? {
          principal: data.imagem_principal || galeriaImagens[0],
          galeria: galeriaImagens
        } : null,
        controla_estoque: data.controla_estoque ? 'sim' : 'nao',
        quantidade_estoque: data.quantidade_estoque,
        estoque_minimo: data.estoque_minimo,
        tem_variacoes: data.tem_variacoes,
        destaque: data.destaque,
        principal_destaque: data.destaque,
        variacoes: data.tem_variacoes ? variacoes.map((v, i) => ({
          ...v,
          ordem: i,
          imagem_url: v.imagem_url || null
        })) : [],
      };

      const response = await fetch(`${API_BASE_URL}/produtos/${selectedProduto.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erro ao atualizar produto");

      toast({
        title: "✅ Produto atualizado!",
        description: "Produto atualizado com sucesso.",
      });

      setIsEditOpen(false);
      form.reset();
      setVariacoes([]);
      setGaleriaImagens([]);
      setSelectedProduto(null);
      fetchProdutos();
    } catch (error: any) {
      toast({
        title: "❌ Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduto = async () => {
    if (!selectedProduto) return;

    try {
      const response = await fetch(`${API_BASE_URL}/produtos/${selectedProduto.id}`, {
        method: "DELETE",
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) throw new Error("Erro ao excluir produto");

      toast({
        title: "✅ Produto excluído!",
        description: "Produto excluído com sucesso.",
      });

      setIsDeleteOpen(false);
      setSelectedProduto(null);
      fetchProdutos();
    } catch (error: any) {
      toast({
        title: "❌ Erro ao excluir produto",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openNovo = () => {
    form.reset();
    setVariacoes([]);
    setGaleriaImagens([]);
    setIsNewOpen(true);
  };

  const openEditar = (produto: Produto) => {
    setSelectedProduto(produto);
    form.reset({
      nome: produto.nome,
      tipo_estoque: produto.tipo_estoque as any,
      categoria_id: produto.categoria_id || "",
      grupo_id: produto.grupo_id || "",
      descricao_curta: produto.descricao_curta || "",
      descricao_completa: produto.descricao_completa || "",
      preco_padrao: produto.preco_padrao || 0,
      preco_custo: produto.preco_custo || 0,
      preco_promocional: produto.preco_promocional || 0,
      sku: produto.sku || "",
      imagem_principal: produto.imagem_principal || "",
      controla_estoque: produto.controla_estoque === "sim",
      quantidade_estoque: produto.quantidade_estoque || 0,
      estoque_minimo: produto.estoque_minimo || 0,
      tem_variacoes: produto.tem_variacoes || false,
      destaque: produto.destaque || false,
    });
    setVariacoes(produto.variacoes || []);
    setGaleriaImagens(
      (produto as any).imagem_galeria?.galeria || []
    );
    setIsEditOpen(true);
  };

  const openDetalhes = (produto: Produto) => {
    setSelectedProduto(produto);
    setIsDetailsOpen(true);
  };

  const openExcluir = (produto: Produto) => {
    setSelectedProduto(produto);
    setIsDeleteOpen(true);
  };

  const gruposFiltrados = filtroCategoria && filtroCategoria !== "all"
    ? grupos.filter((g) => g.categoria_id === filtroCategoria)
    : grupos;

  const temVariacoes = form.watch("tem_variacoes");
  const categoriaId = form.watch("categoria_id");
  const tipoEstoque = form.watch("tipo_estoque");
  const controlaEstoque = form.watch("controla_estoque");

  if (loading) {
    return (
      <DashboardLayout title="Produtos">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando produtos...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Produtos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              Total: {produtos.length} {produtos.length === 1 ? "produto" : "produtos"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openNovo}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-[200px]">
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

          <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos grupos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos grupos</SelectItem>
              {gruposFiltrados.map((grupo) => (
                <SelectItem key={grupo.id} value={grupo.id}>
                  {grupo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              <SelectItem value="servico">Serviço</SelectItem>
              <SelectItem value="produto">Produto</SelectItem>
              <SelectItem value="combo">Combo</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Cards de Produtos */}
        {produtos.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhum produto encontrado</p>
            <p className="text-sm text-muted-foreground mt-2">
              Crie seu primeiro produto ou ajuste os filtros
            </p>
            <Button className="mt-4" onClick={openNovo}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produtos.map((produto) => {
              const categoria = categorias.find((c) => c.id === produto.categoria_id);
              const IconComponent = categoria ? (Icons as any)[categoria.icone] || Icons.Package : Icons.Package;

              return (
          <Card key={produto.id} className="hover:shadow-lg transition-shadow overflow-hidden">
            {/* Carousel de imagens ou imagem única */}
            {(() => {
              // Combinar imagem principal + galeria
              const todasImagens: string[] = [];
              if (produto.imagem_principal) {
                todasImagens.push(produto.imagem_principal);
              }
              if ((produto as any).imagem_galeria?.galeria) {
                todasImagens.push(...(produto as any).imagem_galeria.galeria);
              }
              
              // Se tem mais de uma imagem, mostrar carousel
              if (todasImagens.length > 1) {
                return (
                  <div className="relative aspect-square bg-muted">
                    <Carousel className="w-full h-full">
                      <CarouselContent>
                        {todasImagens.map((url: string, index: number) => (
                          <CarouselItem key={index}>
                            <img 
                              src={url} 
                              alt={`${produto.nome} - ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </Carousel>
                    
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {todasImagens.length} fotos
                    </div>
                  </div>
                );
              }
              
              // Se tem apenas uma imagem
              if (todasImagens.length === 1) {
                return (
                  <div className="aspect-square bg-muted overflow-hidden">
                    <img 
                      src={todasImagens[0]} 
                      alt={produto.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                );
              }
              
              // Se não tem imagem
              return (
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground/30" />
                </div>
              );
            })()}

                  <CardHeader className="pb-3">
                    <CardTitle className="text-base line-clamp-2 min-h-[3rem]">{produto.nome}</CardTitle>

                    {categoria && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconComponent className="h-4 w-4" style={{ color: categoria.cor }} />
                        {categoria.nome}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Preço ou Variações */}
                    {produto.tem_variacoes ? (
                      <div>
                        <Badge variant="secondary">{produto.variacoes?.length || 0} variações</Badge>
                        {produto.variacoes && produto.variacoes.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-1">
                            A partir de R${" "}
                            {Math.min(...produto.variacoes.map((v: any) => v.preco_venda)).toFixed(2)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl font-bold">R$ {Number(produto.preco_padrao || 0).toFixed(2)}</p>
                        {produto.preco_promocional && (
                          <p className="text-sm text-muted-foreground line-through">
                            R$ {Number(produto.preco_promocional).toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {produto.destaque && (
                        <Badge variant="default" className="bg-amber-500">
                          ⭐ Destaque
                        </Badge>
                      )}
                      {produto.controla_estoque === "sim" && (
                        <Badge variant="outline">📦 {produto.quantidade_estoque} un.</Badge>
                      )}
                      {!produto.ativo && <Badge variant="destructive">Inativo</Badge>}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openDetalhes(produto)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditar(produto)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Novo Produto */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>✏️ Novo Produto</DialogTitle>
            <DialogDescription>Preencha as informações do produto</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateProduto)} className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Informações Básicas</h3>

                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome do produto" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_estoque"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <FormControl>
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="servico" id="servico" />
                            <Label htmlFor="servico">Serviço</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="produto" id="produto" />
                            <Label htmlFor="produto">Produto</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="combo" id="combo" />
                            <Label htmlFor="combo">Combo</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoria_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
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
                    control={form.control}
                    name="grupo_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grupo</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {gruposFiltrados.map((grupo) => (
                              <SelectItem key={grupo.id} value={grupo.id}>
                                {grupo.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="descricao_curta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Curta</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Breve descrição" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao_completa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Completa</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descrição detalhada" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Imagem */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Imagem do Produto</h3>

                <FormField
                  control={form.control}
                  name="imagem_principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-4">
                          {/* Preview da imagem */}
                          {field.value && (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                              <img src={field.value} alt="Preview" className="w-full h-full object-cover" />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => field.onChange("")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}

                          {/* Input de arquivo */}
                          <Input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  setUploading(true);
                                  const url = await uploadImagem(file);
                                  field.onChange(url);
                                  toast({
                                    title: "✅ Imagem enviada!",
                                    description: "Imagem carregada com sucesso.",
                                  });
                                } catch (error: any) {
                                  toast({
                                    title: "❌ Erro no upload",
                                    description: error.message,
                                    variant: "destructive",
                                  });
                                } finally {
                                  setUploading(false);
                                }
                              }
                            }}
                            disabled={uploading}
                          />

                          {/* Loading durante upload */}
                          {uploading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Enviando imagem...
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            Formatos aceitos: JPG, PNG ou WEBP. Tamanho máximo: 2 MB.
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Galeria de Imagens */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Galeria de Imagens (até 6)</h3>
                
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {galeriaImagens.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group">
                      <img 
                        src={url} 
                        alt={`Galeria ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removerImagemGaleria(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                  
                  {galeriaImagens.length < 6 && (
                    <label className="relative aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer flex flex-col items-center justify-center text-muted-foreground">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log('Arquivo selecionado:', file.name);
                            await adicionarImagemGaleria(file);
                            e.target.value = '';
                          }
                        }}
                        disabled={uploadingGaleria}
                      />
                      {uploadingGaleria ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-6 w-6" />
                          <span className="text-xs mt-1">Adicionar</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Primeira imagem será a principal no card. Máximo: 6 imagens.
                </p>
              </div>

              {/* Preço e Estoque */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Preço e Estoque</h3>

                <FormField
                  control={form.control}
                  name="tem_variacoes"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">Este produto tem variações</FormLabel>
                    </FormItem>
                  )}
                />

                {!temVariacoes && (
                  <>
                    <FormField
                      control={form.control}
                      name="preco_padrao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="0.00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {tipoEstoque === "produto" && (
                      <>
                        <FormField
                          control={form.control}
                          name="controla_estoque"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="!mt-0 cursor-pointer">Controlar estoque</FormLabel>
                            </FormItem>
                          )}
                        />

                        {controlaEstoque && (
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="quantidade_estoque"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Quantidade</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="estoque_minimo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Estoque Mínimo</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Variações */}
              {temVariacoes && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Variações</h3>
                    <Button type="button" variant="outline" size="sm" onClick={adicionarVariacao}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Variação
                    </Button>
                  </div>

                  {variacoes.map((variacao, index) => (
                    <Card key={variacao.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-sm">Variação {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerVariacao(variacao.id!)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label>Nome</Label>
                          <Input
                            value={variacao.nome}
                            onChange={(e) => atualizarVariacao(variacao.id!, "nome", e.target.value)}
                            placeholder="Ex: Básica"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Preço</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={variacao.preco_venda}
                              onChange={(e) =>
                                atualizarVariacao(variacao.id!, "preco_venda", parseFloat(e.target.value))
                              }
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <Label>Duração (min)</Label>
                            <Input
                              type="number"
                              value={variacao.duracao_minutos || ""}
                              onChange={(e) =>
                                atualizarVariacao(variacao.id!, "duracao_minutos", parseInt(e.target.value))
                              }
                              placeholder="45"
                            />
                          </div>
                        </div>

                        {/* Imagem da Variação */}
                        <div>
                          <Label>Imagem desta Variação (opcional)</Label>
                          {(variacao as any).imagem_url ? (
                            <div className="relative w-full h-32 rounded-lg border overflow-hidden mt-2">
                              <img 
                                src={(variacao as any).imagem_url} 
                                alt={variacao.nome}
                                className="w-full h-full object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8"
                                onClick={() => atualizarVariacao(variacao.id!, 'imagem_url', '')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const url = await uploadImagem(file);
                                      atualizarVariacao(variacao.id!, 'imagem_url', url);
                                      toast({
                                        title: "✅ Imagem da variação enviada!",
                                      });
                                    } catch (error: any) {
                                      toast({
                                        title: "❌ Erro",
                                        description: error.message,
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}
                              />
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Foto específica desta variação
                          </p>
                        </div>

                        {tipoEstoque === "produto" && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Quantidade</Label>
                              <Input
                                type="number"
                                value={variacao.quantidade_estoque}
                                onChange={(e) =>
                                  atualizarVariacao(variacao.id!, "quantidade_estoque", parseInt(e.target.value))
                                }
                              />
                            </div>

                            <div>
                              <Label>Estoque Mínimo</Label>
                              <Input
                                type="number"
                                value={variacao.estoque_minimo}
                                onChange={(e) =>
                                  atualizarVariacao(variacao.id!, "estoque_minimo", parseInt(e.target.value))
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}

                  {variacoes.length === 0 && (
                    <div className="text-center py-6 border rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Nenhuma variação adicionada</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={adicionarVariacao}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar Primeira Variação
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Campos Avançados */}
              <Accordion type="single" collapsible>
                <AccordionItem value="advanced">
                  <AccordionTrigger className="text-sm font-semibold">Detalhes Adicionais</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Código SKU" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="preco_custo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço de Custo</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" placeholder="0.00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="preco_promocional"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço Promocional</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" placeholder="0.00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="destaque"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer">Produto em destaque</FormLabel>
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsNewOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Produto</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Produto */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>✏️ Editar Produto</DialogTitle>
            <DialogDescription>Atualize as informações do produto</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateProduto)} className="space-y-6">
              {/* Mesmo conteúdo do modal de criação */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Informações Básicas</h3>

                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome do produto" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_estoque"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <FormControl>
                        <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="servico" id="edit-servico" />
                            <Label htmlFor="edit-servico">Serviço</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="produto" id="edit-produto" />
                            <Label htmlFor="edit-produto">Produto</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="combo" id="edit-combo" />
                            <Label htmlFor="edit-combo">Combo</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoria_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
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
                    control={form.control}
                    name="grupo_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grupo</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {gruposFiltrados.map((grupo) => (
                              <SelectItem key={grupo.id} value={grupo.id}>
                                {grupo.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="descricao_curta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Curta</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Breve descrição" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao_completa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Completa</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descrição detalhada" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Imagem do Produto</h3>

                <FormField
                  control={form.control}
                  name="imagem_principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-4">
                          {field.value && (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border bg-muted">
                              <img src={field.value} alt="Preview" className="w-full h-full object-cover" />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => field.onChange("")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}

                          <Input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  setUploading(true);
                                  const url = await uploadImagem(file);
                                  field.onChange(url);
                                  toast({
                                    title: "✅ Imagem enviada!",
                                    description: "Imagem carregada com sucesso.",
                                  });
                                } catch (error: any) {
                                  toast({
                                    title: "❌ Erro no upload",
                                    description: error.message,
                                    variant: "destructive",
                                  });
                                } finally {
                                  setUploading(false);
                                }
                              }
                            }}
                            disabled={uploading}
                          />

                          {uploading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Enviando imagem...
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground">
                            Formatos aceitos: JPG, PNG ou WEBP. Tamanho máximo: 2 MB.
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Galeria de Imagens */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Galeria de Imagens (até 6)</h3>
                
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {galeriaImagens.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group">
                      <img 
                        src={url} 
                        alt={`Galeria ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removerImagemGaleria(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                  
                  {galeriaImagens.length < 6 && (
                    <label className="relative aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer flex flex-col items-center justify-center text-muted-foreground">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log('Arquivo selecionado:', file.name);
                            await adicionarImagemGaleria(file);
                            e.target.value = '';
                          }
                        }}
                        disabled={uploadingGaleria}
                      />
                      {uploadingGaleria ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-6 w-6" />
                          <span className="text-xs mt-1">Adicionar</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Primeira imagem será a principal no card. Máximo: 6 imagens.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Preço e Estoque</h3>

                <FormField
                  control={form.control}
                  name="tem_variacoes"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0 cursor-pointer">Este produto tem variações</FormLabel>
                    </FormItem>
                  )}
                />

                {!temVariacoes && (
                  <>
                    <FormField
                      control={form.control}
                      name="preco_padrao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço *</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" placeholder="0.00" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {tipoEstoque === "produto" && (
                      <>
                        <FormField
                          control={form.control}
                          name="controla_estoque"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="!mt-0 cursor-pointer">Controlar estoque</FormLabel>
                            </FormItem>
                          )}
                        />

                        {controlaEstoque && (
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="quantidade_estoque"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Quantidade</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="estoque_minimo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Estoque Mínimo</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {temVariacoes && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Variações</h3>
                    <Button type="button" variant="outline" size="sm" onClick={adicionarVariacao}>
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Variação
                    </Button>
                  </div>

                  {variacoes.map((variacao, index) => (
                    <Card key={variacao.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-sm">Variação {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerVariacao(variacao.id!)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label>Nome</Label>
                          <Input
                            value={variacao.nome}
                            onChange={(e) => atualizarVariacao(variacao.id!, "nome", e.target.value)}
                            placeholder="Ex: Básica"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Preço</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={variacao.preco_venda}
                              onChange={(e) =>
                                atualizarVariacao(variacao.id!, "preco_venda", parseFloat(e.target.value))
                              }
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <Label>Duração (min)</Label>
                            <Input
                              type="number"
                              value={variacao.duracao_minutos || ""}
                              onChange={(e) =>
                                atualizarVariacao(variacao.id!, "duracao_minutos", parseInt(e.target.value))
                              }
                              placeholder="45"
                            />
                          </div>
                        </div>

                        {/* Imagem da Variação */}
                        <div>
                          <Label>Imagem desta Variação (opcional)</Label>
                          {(variacao as any).imagem_url ? (
                            <div className="relative w-full h-32 rounded-lg border overflow-hidden mt-2">
                              <img 
                                src={(variacao as any).imagem_url} 
                                alt={variacao.nome}
                                className="w-full h-full object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8"
                                onClick={() => atualizarVariacao(variacao.id!, 'imagem_url', '')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const url = await uploadImagem(file);
                                      atualizarVariacao(variacao.id!, 'imagem_url', url);
                                      toast({
                                        title: "✅ Imagem da variação enviada!",
                                      });
                                    } catch (error: any) {
                                      toast({
                                        title: "❌ Erro",
                                        description: error.message,
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                }}
                              />
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Foto específica desta variação
                          </p>
                        </div>

                        {tipoEstoque === "produto" && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Quantidade</Label>
                              <Input
                                type="number"
                                value={variacao.quantidade_estoque}
                                onChange={(e) =>
                                  atualizarVariacao(variacao.id!, "quantidade_estoque", parseInt(e.target.value))
                                }
                              />
                            </div>

                            <div>
                              <Label>Estoque Mínimo</Label>
                              <Input
                                type="number"
                                value={variacao.estoque_minimo}
                                onChange={(e) =>
                                  atualizarVariacao(variacao.id!, "estoque_minimo", parseInt(e.target.value))
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <Accordion type="single" collapsible>
                <AccordionItem value="advanced">
                  <AccordionTrigger className="text-sm font-semibold">Detalhes Adicionais</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Código SKU" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="preco_custo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço de Custo</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" placeholder="0.00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="preco_promocional"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço Promocional</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" step="0.01" placeholder="0.00" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="destaque"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer">Produto em destaque</FormLabel>
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <DialogFooter>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setIsEditOpen(false);
                    openExcluir(selectedProduto!);
                  }}
                >
                  Excluir
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto</DialogTitle>
          </DialogHeader>

          {selectedProduto && (
            <div className="space-y-6">
              {selectedProduto.imagem_principal && (
                <div className="aspect-video rounded-lg overflow-hidden border">
                  <img
                    src={selectedProduto.imagem_principal}
                    alt={selectedProduto.nome}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h3 className="text-2xl font-bold">{selectedProduto.nome}</h3>
                {selectedProduto.descricao_curta && (
                  <p className="text-muted-foreground mt-2">{selectedProduto.descricao_curta}</p>
                )}
              </div>

              {selectedProduto.tem_variacoes ? (
                <div>
                  <h4 className="font-semibold mb-3">Variações ({selectedProduto.variacoes?.length || 0})</h4>
                  <div className="space-y-2">
                    {selectedProduto.variacoes?.map((variacao) => (
                      <div key={variacao.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{variacao.nome}</p>
                          {variacao.duracao_minutos && (
                            <p className="text-sm text-muted-foreground">{variacao.duracao_minutos} minutos</p>
                          )}
                        </div>
                        <p className="text-lg font-bold">R$ {Number(variacao.preco_venda).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-3xl font-bold">R$ {Number(selectedProduto.preco_padrao).toFixed(2)}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedProduto.destaque && <Badge className="bg-amber-500">⭐ Destaque</Badge>}
                {selectedProduto.controla_estoque === "sim" && (
                  <Badge variant="outline">📦 {selectedProduto.quantidade_estoque} em estoque</Badge>
                )}
                <Badge variant={selectedProduto.ativo ? "default" : "secondary"}>
                  {selectedProduto.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Excluir */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ Excluir Produto?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o produto "{selectedProduto?.nome}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduto}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
