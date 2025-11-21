import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Loader2 } from "lucide-react";

interface Profissional {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  especialidades?: string[];
  status: string;
  permite_agendamento: boolean;
  Funcao?: {
    nome: string;
  };
}

export default function Profissionais() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfissionais();
  }, []);

  const fetchProfissionais = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Buscando profissionais...');

      const response = await fetch(
        'https://viewlessly-unadjoining-lashanda.ngrok-free.dev/api/v1/profissionais?t=' + Date.now(),
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
      console.log('📦 Profissionais:', data);

      const profissionaisArray = data.success && data.data 
        ? (Array.isArray(data.data) ? data.data : [])
        : [];

      console.log('✅ Total:', profissionaisArray.length);
      setProfissionais(profissionaisArray);

    } catch (err: any) {
      console.error('❌ Erro:', err);
      setError(err.message);
      setProfissionais([]);
    } finally {
      setLoading(false);
    }
  };

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

  if (error) {
    return (
      <DashboardLayout title="Profissionais">
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-bold mb-3">❌ Erro ao carregar</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchProfissionais} variant="destructive">
              🔄 Tentar novamente
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (profissionais.length === 0) {
    return (
      <DashboardLayout title="Profissionais">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Nenhum profissional cadastrado</p>
          <Button className="mt-4">Adicionar Profissional</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profissionais">
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Total: {profissionais.length} profissionais
        </p>
        <Button onClick={fetchProfissionais} variant="outline" size="sm">
          🔄 Recarregar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profissionais.map((profissional) => (
          <Card key={profissional.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profissional.nome.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{profissional.nome}</CardTitle>
                    {profissional.Funcao?.nome && (
                      <p className="text-sm text-muted-foreground">
                        {profissional.Funcao.nome}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant={profissional.status === "ativo" ? "default" : "secondary"}
                  className={
                    profissional.status === "ativo"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-gray-100 text-gray-800 border-gray-200"
                  }
                >
                  {profissional.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Especialidades */}
              {profissional.especialidades && profissional.especialidades.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Especialidades</p>
                  <div className="flex flex-wrap gap-2">
                    {profissional.especialidades.map((specialty, idx) => (
                      <Badge key={idx} variant="outline">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Contato */}
              <div className="space-y-1 text-sm text-muted-foreground">
                {profissional.telefone && (
                  <p>📱 {profissional.telefone}</p>
                )}
                {profissional.email && (
                  <p className="truncate">✉️ {profissional.email}</p>
                )}
              </div>

              {/* Agendamento */}
              {profissional.permite_agendamento && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Aceita agendamento
                </Badge>
              )}

              {/* Botão */}
              <Button className="w-full" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Ver Disponibilidade
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
