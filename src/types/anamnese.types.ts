// ============================================================================
// TYPES E INTERFACES - Sistema de Anamnese (Frontend)
// ============================================================================

export interface AnamneseTemplate {
  id: string;
  cliente_id: number;
  empresa_id: number;
  nome: string;
  descricao?: string;
  tipo: 'estetica_facial' | 'estetica_corporal' | 'odontologico' | 'geral' | 'outro';
  versao: number;
  ativo: boolean;
  data_inativacao?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  secoes?: AnamneseSecaoCompleta[];
}

export interface AnamneseSecao {
  id: string;
  template_id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  obrigatorio: boolean;
  condicional?: {
    show_if?: {
      campo_id: string;
      valor: any;
    };
  };
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AnamneseSecaoCompleta extends AnamneseSecao {
  campos: AnamneseCampo[];
}

export interface AnamneseCampo {
  id: string;
  secao_id: string;
  tipo_campo: TipoCampo;
  label: string;
  campo_sistema?: CampoSistema;
  placeholder?: string;
  opcoes?: string[] | { label: string; value: string }[];
  validacao?: CampoValidacao;
  condicional?: {
    show_if?: {
      campo_id: string;
      valor: any;
    };
  };
  mascara?: string;
  ordem: number;
  obrigatorio: boolean;
  largura: 'full' | 'half' | 'third';
  ajuda?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type TipoCampo = 
  | 'text'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'number'
  | 'email'
  | 'phone'
  | 'cpf'
  | 'signature';

export type CampoSistema =
  | 'nome_completo'
  | 'nome_preferencia'
  | 'cpf'
  | 'rg'
  | 'data_nascimento'
  | 'genero'
  | 'estado_civil'
  | 'telefone'
  | 'telefone_secundario'
  | 'whatsapp'
  | 'email'
  | 'endereco_cep'
  | 'endereco_logradouro'
  | 'endereco_numero'
  | 'endereco_complemento'
  | 'endereco_bairro'
  | 'endereco_cidade'
  | 'endereco_estado'
  | 'endereco_pais';

export interface CampoValidacao {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customMessage?: string;
}

export interface TemplateCompleto extends AnamneseTemplate {
  secoes: AnamneseSecaoCompleta[];
}

export interface Anamnese {
  id: string;
  cliente_id: number;
  empresa_id: number;
  lead_id?: string;
  cliente_final_id?: string;
  agendamento_id?: string;
  template_id: string;
  template_versao: number;
  link_token: string;
  link_expira_em?: string;
  status: StatusAnamnese;
  progresso_percentual: number;
  data_envio?: string;
  data_preenchimento?: string;
  assinatura_digital?: string;
  consentimento_lgpd: boolean;
  consentimento_fotos: boolean;
  consentimento_tratamento: boolean;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export type StatusAnamnese =
  | 'pendente'
  | 'em_preenchimento'
  | 'preenchido'
  | 'expirado'
  | 'cancelado';

// ============================================================================
// FORMS E INPUTS
// ============================================================================

export interface CriarTemplateForm {
  nome: string;
  descricao?: string;
  tipo: AnamneseTemplate['tipo'];
}

export interface CriarSecaoForm {
  titulo: string;
  descricao?: string;
  ordem: number;
  obrigatorio?: boolean;
}

export interface CriarCampoForm {
  tipo_campo: TipoCampo;
  label: string;
  campo_sistema?: CampoSistema;
  placeholder?: string;
  opcoes?: string[];
  validacao?: CampoValidacao;
  mascara?: string;
  ordem: number;
  obrigatorio?: boolean;
  largura?: 'full' | 'half' | 'third';
  ajuda?: string;
}

// ============================================================================
// BUILDER - Drag and Drop
// ============================================================================

export interface CampoDisponivel {
  id: string;
  tipo: TipoCampo;
  label: string;
  icon: string;
  descricao: string;
}

export interface BuilderState {
  template: AnamneseTemplate | null;
  secoes: AnamneseSecaoCompleta[];
  secaoSelecionada: string | null;
  campoSelecionado: string | null;
  modoEdicao: boolean;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
}

export interface ListaTemplatesResponse {
  success: true;
  data: AnamneseTemplate[];
  total: number;
}

export interface TemplateCompletoResponse {
  success: true;
  data: TemplateCompleto;
}

// ============================================================================
// LABELS E CONSTANTES
// ============================================================================

export const TIPOS_TEMPLATE_LABELS: Record<AnamneseTemplate['tipo'], string> = {
  estetica_facial: 'Estética Facial',
  estetica_corporal: 'Estética Corporal',
  odontologico: 'Odontológico',
  geral: 'Geral',
  outro: 'Outro'
};

export const TIPOS_CAMPO_LABELS: Record<TipoCampo, string> = {
  text: 'Texto Curto',
  textarea: 'Texto Longo',
  select: 'Lista de Seleção',
  checkbox: 'Múltipla Escolha',
  radio: 'Escolha Única',
  date: 'Data',
  number: 'Número',
  email: 'E-mail',
  phone: 'Telefone',
  cpf: 'CPF',
  signature: 'Assinatura Digital'
};

export const CAMPOS_SISTEMA_LABELS: Record<CampoSistema, string> = {
  nome_completo: 'Nome Completo',
  nome_preferencia: 'Nome de Preferência',
  cpf: 'CPF',
  rg: 'RG',
  data_nascimento: 'Data de Nascimento',
  genero: 'Gênero',
  estado_civil: 'Estado Civil',
  telefone: 'Telefone',
  telefone_secundario: 'Telefone Secundário',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  endereco_cep: 'CEP',
  endereco_logradouro: 'Logradouro',
  endereco_numero: 'Número',
  endereco_complemento: 'Complemento',
  endereco_bairro: 'Bairro',
  endereco_cidade: 'Cidade',
  endereco_estado: 'Estado',
  endereco_pais: 'País'
};

export const STATUS_ANAMNESE_LABELS: Record<StatusAnamnese, string> = {
  pendente: 'Pendente',
  em_preenchimento: 'Em Preenchimento',
  preenchido: 'Preenchido',
  expirado: 'Expirado',
  cancelado: 'Cancelado'
};

export const STATUS_ANAMNESE_COLORS: Record<StatusAnamnese, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  em_preenchimento: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  preenchido: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  expirado: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
};