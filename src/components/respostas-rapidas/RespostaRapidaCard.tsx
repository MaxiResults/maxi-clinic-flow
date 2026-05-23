import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { RespostaRapida } from '@/hooks/useRespostasRapidas';

interface RespostaRapidaCardProps {
  resposta: RespostaRapida;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RespostaRapidaCard({
  resposta,
  onEdit,
  onDelete,
}: RespostaRapidaCardProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(resposta.conteudo);
    toast.success('Conteúdo copiado');
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="font-mono">
              /{resposta.atalho}
            </Badge>
            {resposta.ativo ? (
              <Badge variant="default">Ativo</Badge>
            ) : (
              <Badge variant="outline">Inativo</Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(resposta.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar conteúdo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(resposta.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-base pt-2">{resposta.titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
          {resposta.conteudo}
        </p>
      </CardContent>
    </Card>
  );
}