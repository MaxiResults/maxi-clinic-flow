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
import { Plus } from "lucide-react";

const mockProdutos = [
  {
    id: 1,
    name: "Limpeza de Pele Profunda",
    category: "Estética Facial",
    type: "Serviço",
    price: 150,
    duration: "60 min",
    active: true,
  },
  {
    id: 2,
    name: "Massagem Relaxante",
    category: "Massoterapia",
    type: "Serviço",
    price: 120,
    duration: "50 min",
    active: true,
  },
  {
    id: 3,
    name: "Drenagem Linfática",
    category: "Estética Corporal",
    type: "Serviço",
    price: 100,
    duration: "45 min",
    active: true,
  },
  {
    id: 4,
    name: "Consulta Nutricional",
    category: "Nutrição",
    type: "Consulta",
    price: 200,
    duration: "60 min",
    active: true,
  },
  {
    id: 5,
    name: "Avaliação Física",
    category: "Fitness",
    type: "Consulta",
    price: 80,
    duration: "30 min",
    active: false,
  },
];

export default function Produtos() {
  return (
    <DashboardLayout title="Produtos e Serviços">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>

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
              {mockProdutos.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell className="font-medium">{produto.name}</TableCell>
                  <TableCell>{produto.category}</TableCell>
                  <TableCell>{produto.type}</TableCell>
                  <TableCell>R$ {produto.price.toFixed(2)}</TableCell>
                  <TableCell>{produto.duration}</TableCell>
                  <TableCell>
                    <Badge
                      variant={produto.active ? "default" : "secondary"}
                      className={
                        produto.active
                          ? "bg-status-converted/10 text-status-converted border-status-converted/20"
                          : "bg-status-completed/10 text-status-completed border-status-completed/20"
                      }
                    >
                      {produto.active ? "Ativo" : "Inativo"}
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
      </div>
    </DashboardLayout>
  );
}
