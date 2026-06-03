import { useState, useEffect, useMemo } from "react";
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
import { Plus, Loader2, Package, Package2, Eye, Edit, Trash2, Search, X, Layers, Star } from "lucide-react";
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
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import api from '@/lib/api';

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
  const { user } = useAuth();
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
      const response = await api.get('/categorias');
      setCategorias(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  const fetchGrupos = async () => {
    try {
      const response = await api.get('/grupos');
      setGrupos(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar grupos:", error);
    }
  };

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filtroCategoria && filtroCategoria !== "all") {
        params.categoria_id = filtroCategoria;
      }
      if (filtroGrupo && filtroGrupo !== "all") {
        params.grupo_id = filtroGrupo;
      }
      if (filtroTipo && filtroTipo !== "all") {
        params.tipo = filtroTipo;
      }
      if (busca) {
        params.busca = busca;
      }

      const response = await api.get('/produtos', { params });
      setProdutos(response.data || []);
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
    const clienteId = user!.cliente_id;
    const empresaId = user!.empresa_id;
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

      const response = await api.post('/produtos', payload);
      
      if (!response.data) throw new Error("Erro ao criar produto");

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

      await api.patch(`/produtos/${selectedProduto.id}`, payload);

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
      await api.delete(`/produtos/${selectedProduto.id}`);

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
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .prod-card-anim { animation: fadeSlideIn 0.35s ease both; }
      `}</style>

      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Produtos e Serviços
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gerencie o catálogo de produtos, serviços e combos da clínica
            </p>
          </div>
          <Button onClick={openNovo} className="rounded-lg shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        {/* Stats cards */}
        {!loading && produtos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: 'Total',
                value: produtos.length,
                icon: Package,
                color: '#6366F1',
                suffix: '',
              },
              {
                label: 'Serviços',
                value: produtos.filter(p => p.tipo_estoque === 'servico').length,
                icon: Star,
                color: '#10B981',
                suffix: '',
              },
              {
                label: 'Produtos',
                value: produtos.filter(p => p.tipo_estoque === 'produto').length,
                icon: Package2,
                color: '#3B82F6',
                suffix: '',
              },
              {
                label: 'Combos',
                value: produtos.filter(p => p.tipo_estoque === 'combo').length,
                icon: Layers,
                color: '#F59E0B',
                suffix: '',
              },
            ].map(({ label, value, icon: Icon, color, suffix }, idx) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                style={{
                  animation: 'fadeSlideIn 0.35s ease both',
                  animationDelay: `${idx * 60}ms`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
                  <div className="p-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">
                  {value}{suffix}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-[180px] bg-white border-gray-200">
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
            <SelectTrigger className="w-[180px] bg-white border-gray-200">
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
            <SelectTrigger className="w-[160px] bg-white border-gray-200">
              <SelectValue placeholder="Todos tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              <SelectItem value="servico">✨ Serviço</SelectItem>
              <SelectItem value="produto">📦 Produto</SelectItem>
              <SelectItem value="combo">🎁 Combo</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar produtos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 bg-white border-gray-200"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-72 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && produtos.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Package className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg">
              Nenhum produto cadastrado
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Crie seu primeiro produto ou ajuste os filtros
            </p>
            <Button className="mt-4 rounded-lg" onClick={openNovo}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        )}

        {/* Grid de cards */}
        {!loading && produtos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {produtos.map((produto, idx) => {
              const categoria = categorias.find((c) => c.id === produto.categoria_id);
              const IconComponent = categoria
                ? (Icons as any)[categoria.icone] || Icons.Package
                : Icons.Package;

              // Tipo config
              const tipoConfig = {
                servico:  { cor: '#10B981', bg: '#ECFDF5', label: '✨ Serviço'  },
                produto:  { cor: '#3B82F6', bg: '#EFF6FF', label: '📦 Produto'  },
                combo:    { cor: '#F59E0B', bg: '#FFFBEB', label: '🎁 Combo'    },
              }[produto.tipo_estoque as string] || { cor: '#6366F1', bg: '#EEF2FF', label: produto.tipo_estoque };

              // Todas as imagens
              const todasImagens: string[] = [];
              if (produto.imagem_principal) todasImagens.push(produto.imagem_principal);
              if ((produto as any).imagem_galeria?.galeria) {
                todasImagens.push(...(produto as any).imagem_galeria.galeria);
              }

              return (
                <div
                  key={produto.id}
                  className="prod-card-anim group relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* Borda lateral colorida por tipo */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 z-10"
                    style={{ backgroundColor: produto.ativo ? tipoConfig.cor : '#D1D5DB' }}
                  />

                  {/* Imagem / Carousel */}
                  <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                    {todasImagens.length > 1 ? (
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
                        <CarouselPrevious className="left-2 h-6 w-6" />
                        <CarouselNext className="right-2 h-6 w-6" />
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                          {todasImagens.length} fotos
                        </div>
                      </Carousel>
                    ) : todasImagens.length === 1 ? (
                      <img
                        src={todasImagens[0]}
                        alt={produto.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-200" />
                      </div>
                    )}

                    {/* Badge destaque */}
                    {produto.destaque && (
                      <div className="absolute top-2 left-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ⭐ Destaque
                      </div>
                    )}

                    {/* Badge inativo */}
                    {!produto.ativo && (
                      <div className="absolute top-2 right-2 bg-gray-800/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Inativo
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="pl-4 pr-3 pt-3 pb-3">
                    {/* Tipo badge */}
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mb-2"
                      style={{ backgroundColor: tipoConfig.bg, color: tipoConfig.cor }}
                    >
                      {tipoConfig.label}
                    </span>

                    {/* Nome */}
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight mb-1">
                      {produto.nome}
                    </h3>

                    {/* Categoria */}
                    {categoria && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-2">
                        <IconComponent className="h-3 w-3" style={{ color: categoria.cor }} />
                        <span>{categoria.nome}</span>
                      </div>
                    )}

                    {/* Preço */}
                    <div className="mb-3">
                      {produto.tem_variacoes ? (
                        <div>
                          <p className="text-xs text-gray-400">A partir de</p>
                          {produto.variacoes && produto.variacoes.length > 0 ? (
                            <p className="text-lg font-bold text-gray-900">
                              R$ {Math.min(...produto.variacoes.map((v: any) => v.preco_venda)).toFixed(2)}
                            </p>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600">
                              {produto.variacoes?.length || 0} variações
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            R$ {Number(produto.preco_padrao || 0).toFixed(2)}
                          </p>
                          {produto.preco_promocional && (
                            <p className="text-xs text-gray-400 line-through">
                              R$ {Number(produto.preco_promocional).toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Estoque */}
                    {produto.controla_estoque === 'sim' && (
                      <p className="text-[10px] text-gray-400 mb-2">
                        📦 {produto.quantidade_estoque} em estoque
                      </p>
                    )}

                    {/* Quick actions no hover */}
                    <div className="flex gap-2 pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => openDetalhes(produto)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        onClick={() => openEditar(produto)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
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
