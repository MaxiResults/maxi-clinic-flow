export interface Anamnese {
  id: string;
  cliente_id: number;
  empresa_id: number;
  lead_id: string | null;
  cliente_final_id: string | null;
  agendamento_id: string | null;
  template_id: string;
  template_versao: number;
  template_snapshot: any;
  link_token: string;
  link_expira_em: string;
  status: 'em_preenchimento' | 'preenchido' | 'expirado';
  progresso_percentual: number;
  data_envio: string | null;
  data_preenchimento: string | null;
  ip_preenchimento: string | null;
  user_agent: string | null;
  tempo_preenchimento_segundos: number | null;
  assinatura_digital: string | null;
  consentimento_lgpd: boolean;
  consentimento_fotos: boolean;
  consentimento_tratamento: boolean;
  observacoes: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  token: string;
  template?: {
    id: string;
    nome: string;
    tipo: string;
  };
  lead?: {
    id: string;
    nome: string;
    email: string;
    telefone: string;
  };
}

export interface AnamneseMetricas {
  total: number;
  em_preenchimento: number;
  preenchidas: number;
  expiradas: number;
  taxa_conversao: number;
}

export interface AnamneseListResponse {
  success: boolean;
  data: {
    anamneses: Anamnese[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface AnamneseMetricasResponse {
  success: boolean;
  data: AnamneseMetricas;
}