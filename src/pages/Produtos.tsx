import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Loader2, Package } from "lucide-react";

interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  categoria?: string;
  tipo: string;
  preco_venda: number;
  duracao_minutos?: number;
  ativo: boolean;
}

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando produtos...');

      const response = await fetch(
        'https://viewlessly-unadjoining-lashanda.ngrok-free.dev/api/v1/produtos?t=' + Date.now(),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            'User-Agent': 'MaxiResults/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      
      if (!text.startsWith('{')) {
        throw new Error('Abra a URL no navegador e clique em "Visit Site"');
      }

      const data = JSON.parse(text);
      console.log('📦 Produtos:', data);

      const produtosArray = data.success && data.data 
        ? (Array.isArray(data.data) ? data.data : [])
        : [];

      console.log('✅ Total:', produtosArray.length);
      setProdutos(produtosArray);

    } catch (err: any) {
      console.error('❌ Erro:', err);
      setError(err.message);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (loading) {
    return (
      <DashboardLayout title="Produtos e Serviços">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando produtos...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Produtos e Serviços">
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-bold mb-3">❌ Erro ao carregar</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchProdutos} variant="destructive">
              🔄 Tentar novamente
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Produtos e Serviços">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              Total: {produtos.length} {produtos.length === 1 ? 'produto' : 'produtos'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchProdutos} variant="outline" size="sm">
              🔄 Recarregar
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {produtos.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhum produto cadastrado</p>
            <p className="text-sm text-muted-foreground mt-2">
              Clique em "Novo Produto" para adicionar
            </p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro Produto
            </Button>
          </div>
        ) : (
          /* Tabela */
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{produto.nome}</p>
                        {produto.descricao && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {produto.descricao}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {produto.categoria ? (
                        <Badge variant="outline">{produto.categoria}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={
                          produto.tipo === 'servico' 
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-purple-100 text-purple-800 border-purple-200'
                        }
                      >
                        {produto.tipo === 'servico' ? 'Serviço' : 'Produto'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatPrice(produto.preco_venda)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDuration(produto.duracao_minutos)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={produto.ativo ? "default" : "secondary"}
                        className={
                          produto.ativo
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                        }
                      >
                        {produto.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
