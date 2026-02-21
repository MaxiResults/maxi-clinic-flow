import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChevronRight, ChevronLeft, Loader2, CheckCircle } from 'lucide-react';
import { anamnesesApi } from '@/lib/anamneseApi';
import { AnamneseSecao, AnamneseCampo } from '@/types/anamnese.types';
import { AnamneseFormSection } from '@/components/anamnese/public/AnamneseFormSection';
import { useToast } from '@/hooks/use-toast';

interface AnamnesePublicaData {
  anamnese: {
    id: string;
    status: string;
    progresso_percentual: number;
  };
  template: {
    nome: string;
    tipo: string;
    secoes: Array<{
      secao: AnamneseSecao;
      campos: AnamneseCampo[];
    }>;
  };
  paciente: any;
  respostas_salvas: Array<{
    campo_id: string;
    resposta: string;
  }>;
}

export default function AnamnesePublica() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [anamnese, setAnamnese] = useState<AnamnesePublicaData | null>(null);
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [finalizado, setFinalizado] = useState(false);

  // Consentimentos LGPD
  const [consentimentoLGPD, setConsentimentoLGPD] = useState(false);
  const [consentimentoFotos, setConsentimentoFotos] = useState(false);
  const [consentimentoTratamento, setConsentimentoTratamento] = useState(false);

  useEffect(() => {
    if (token) {
      carregarAnamnese();
    }
  }, [token]);

  // Auto-save a cada 30 segundos
  useEffect(() => {
    if (!anamnese || finalizado) return;

    const interval = setInterval(() => {
      salvarRascunho();
    }, 30000);

    return () => clearInterval(interval);
  }, [respostas, anamnese, finalizado]);

  const carregarAnamnese = async () => {
    try {
      setLoading(true);
      const data = await anamnesesApi.buscarPorToken(token!);
      
      if (data.status === 'finalizada') {
        setFinalizado(true);
      }

      setAnamnese(data);

      // Carregar respostas salvas
      if (data.respostas_salvas) {
        const respostasSalvas: Record<string, any> = {};
        data.respostas_salvas.forEach((r: any) => {
          respostasSalvas[r.campo_id] = r.resposta;
        });
        setRespostas(respostasSalvas);
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar formulário',
        description: error.message || 'Verifique o link e tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const salvarRascunho = async () => {
    if (!anamnese || finalizado) return;

    try {
      const respostasArray = Object.entries(respostas).map(([campo_id, resposta]) => ({
        campo_id,
        resposta: typeof resposta === 'object' ? JSON.stringify(resposta) : String(resposta)
      }));

      const progresso = calcularProgresso();

      await anamnesesApi.salvarRascunho(token!, respostasArray, progresso);
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
    }
  };

  const calcularProgresso = () => {
    if (!anamnese) return 0;

    const totalCampos = anamnese.template.secoes.reduce(
      (acc, s) => acc + s.campos.length,
      0
    );

    const camposPreenchidos = Object.keys(respostas).filter(
      (key) => respostas[key] !== '' && respostas[key] !== null && respostas[key] !== undefined
    ).length;

    return totalCampos > 0 ? Math.round((camposPreenchidos / totalCampos) * 100) : 0;
  };

  const validarSecao = (secao: AnamneseSecao, campos: AnamneseCampo[]) => {
    const novosErros: Record<string, string> = {};

    campos.forEach((campo) => {
      if (campo.obrigatorio) {
        const valor = respostas[campo.id];
        if (!valor || valor === '' || (Array.isArray(valor) && valor.length === 0)) {
          novosErros[campo.id] = 'Este campo é obrigatório';
        }
      }
    });

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleProximo = () => {
    if (!anamnese) return;

    const secaoData = anamnese.template.secoes[etapaAtual];
    if (!validarSecao(secaoData.secao, secaoData.campos)) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios antes de continuar.',
        variant: 'destructive'
      });
      return;
    }

    salvarRascunho();

    if (etapaAtual < anamnese.template.secoes.length - 1) {
      setEtapaAtual(etapaAtual + 1);
      setErros({});
    }
  };

  const handleAnterior = () => {
    if (etapaAtual > 0) {
      setEtapaAtual(etapaAtual - 1);
      setErros({});
    }
  };

  const handleFinalizar = async () => {
    if (!anamnese) return;

    // Validar última seção
    const secaoData = anamnese.template.secoes[etapaAtual];
    if (!validarSecao(secaoData.secao, secaoData.campos)) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios antes de finalizar.',
        variant: 'destructive'
      });
      return;
    }

    // Validar consentimentos
    if (!consentimentoLGPD || !consentimentoTratamento) {
      toast({
        title: 'Consentimentos obrigatórios',
        description: 'Você precisa aceitar os termos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);

      const respostasArray = Object.entries(respostas).map(([campo_id, resposta]) => ({
        campo_id,
        resposta: typeof resposta === 'object' ? JSON.stringify(resposta) : String(resposta)
      }));

      await anamnesesApi.finalizar(token!, {
        respostas: respostasArray,
        consentimento_lgpd: consentimentoLGPD,
        consentimento_fotos: consentimentoFotos,
        consentimento_tratamento: consentimentoTratamento
      });

      setFinalizado(true);

      toast({
        title: 'Anamnese finalizada!',
        description: 'Suas respostas foram enviadas com sucesso.'
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao finalizar',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background">
        <Card className="p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando formulário...</p>
        </Card>
      </div>
    );
  }

  if (!anamnese) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Link inválido</h2>
          <p className="text-muted-foreground">
            Este link de anamnese não é válido ou expirou.
          </p>
        </Card>
      </div>
    );
  }

  if (finalizado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
        <Card className="p-8 max-w-md text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Anamnese finalizada!</h2>
          <p className="text-muted-foreground mb-6">
            Suas respostas foram enviadas com sucesso. A clínica entrará em contato em breve.
          </p>
          <p className="text-sm text-muted-foreground">
            Você pode fechar esta janela.
          </p>
        </Card>
      </div>
    );
  }

  const secaoAtual = anamnese.template.secoes[etapaAtual];
  const progresso = calcularProgresso();
  const isUltimaEtapa = etapaAtual === anamnese.template.secoes.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{anamnese.template.nome}</h1>
          <p className="text-muted-foreground">
            Preencha as informações abaixo com atenção
          </p>
        </div>

        {/* Progresso */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Etapa {etapaAtual + 1} de {anamnese.template.secoes.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {progresso}% completo
            </span>
          </div>
          <Progress value={progresso} className="h-2" />
        </Card>

        {/* Formulário */}
        <Card className="p-8 mb-6">
          <AnamneseFormSection
            secao={secaoAtual.secao}
            campos={secaoAtual.campos}
            respostas={respostas}
            erros={erros}
            onChange={setRespostas}
          />

          {/* Consentimentos (apenas na última etapa) */}
          {isUltimaEtapa && (
            <div className="mt-8 pt-8 border-t space-y-4">
              <h3 className="font-semibold mb-4">Termos e Consentimentos</h3>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="lgpd"
                  checked={consentimentoLGPD}
                  onCheckedChange={(checked) => setConsentimentoLGPD(checked as boolean)}
                />
                <Label htmlFor="lgpd" className="font-normal cursor-pointer">
                  <span className="text-destructive">*</span> Autorizo o uso dos meus dados conforme a LGPD
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="fotos"
                  checked={consentimentoFotos}
                  onCheckedChange={(checked) => setConsentimentoFotos(checked as boolean)}
                />
                <Label htmlFor="fotos" className="font-normal cursor-pointer">
                  Autorizo o uso de fotos para fins de registro do tratamento
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="tratamento"
                  checked={consentimentoTratamento}
                  onCheckedChange={(checked) => setConsentimentoTratamento(checked as boolean)}
                />
                <Label htmlFor="tratamento" className="font-normal cursor-pointer">
                  <span className="text-destructive">*</span> Autorizo a realização do tratamento proposto
                </Label>
              </div>
            </div>
          )}
        </Card>

        {/* Navegação */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleAnterior}
            disabled={etapaAtual === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {isUltimaEtapa ? (
            <Button onClick={handleFinalizar} disabled={submitting} size="lg">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finalizando...
                </>
              ) : (
                'Finalizar Anamnese'
              )}
            </Button>
          ) : (
            <Button onClick={handleProximo}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}