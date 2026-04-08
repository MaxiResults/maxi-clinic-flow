// ─────────────────────────────────────────
// Entidades
// ─────────────────────────────────────────

export interface Oportunidade {
  id: string;
  cliente_id: number;
  empresa_id: number;
  lead_id: string;
  titulo: string;
  valor_estimado: number;
  etapa_id: number;
  status: 'aberta' | 'ganha' | 'perdida' | 'cancelada';
  data_previsao_fechamento: string | null;
  data_fechamento: string | null;
  orcamento_id: string | null;
  pedido_id: string | null;
  responsavel_id: string | null;
  motivo_perda: string | null;
  observacoes: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  // Dados de JOIN
  lead_nome?: string;
  lead_email?: string;
  lead_telefone?: string;
  etapa_nome?: string;
  etapa_cor?: string;
  etapa_ordem?: number;
}

export interface WorkflowEtapa {
  id: number;
  cliente_id: number;
  empresa_id: number;
  nome: string;
  ordem: number;
  cor: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadAtividade {
  id: string;
  tipo_acao: string;
  descricao: string;
  dados_extra: any;
  created_by: string | null;
  created_at: string;
}

// ─────────────────────────────────────────
// Respostas da API
// ─────────────────────────────────────────

export interface ListarOportunidadesResponse {
  success: boolean;
  data: Oportunidade[];
  total?: number;
  error?: string;
}

export interface BuscarOportunidadeResponse {
  success: boolean;
  data?: Oportunidade;
  error?: string;
}

export interface CriarOportunidadeResponse {
  success: boolean;
  data?: { oportunidade_id: string };
  error?: string;
}

export interface AtualizarOportunidadeResponse {
  success: boolean;
  error?: string;
}

export interface ListarEtapasResponse {
  success: boolean;
  data: WorkflowEtapa[];
  total?: number;
  error?: string;
}

export interface ListarAtividadesResponse {
  success: boolean;
  data: LeadAtividade[];
  total?: number;
  error?: string;
}

// ─────────────────────────────────────────
// DTOs de requisição
// ─────────────────────────────────────────

export interface CriarOportunidadeDTO {
  lead_id: string;
  titulo: string;
  valor_estimado?: number;
  etapa_id?: number;
  data_previsao_fechamento?: string;
  observacoes?: string;
}

export interface AtualizarOportunidadeDTO {
  titulo?: string;
  valor_estimado?: number;
  data_previsao_fechamento?: string;
  observacoes?: string;
}

export interface MoverEtapaDTO {
  nova_etapa_id: number;
}

export interface AtualizarStatusDTO {
  status: 'ganha' | 'perdida' | 'cancelada';
  motivo_perda?: string;
}
