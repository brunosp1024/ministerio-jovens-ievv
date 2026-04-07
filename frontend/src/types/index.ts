// ─── Jovem ───────────────────────────────────────────────────────────────────
export interface Jovem {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  data_nascimento: string;
  endereco?: string;
  foto_url?: string;
  habilitado_financeiro: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface JovemCreate {
  nome: string;
  email?: string;
  telefone?: string;
  data_nascimento: string;
  endereco?: string;
  foto_url?: string;
  habilitado_financeiro?: boolean;
  ativo?: boolean;
}

export type JovemUpdate = Partial<JovemCreate>;

// ─── Evento ──────────────────────────────────────────────────────────────────
export interface Evento {
  id: number;
  nome: string;
  descricao?: string;
  data_evento: string;
  local?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventoCreate {
  nome: string;
  descricao?: string;
  data_evento: string;
  local?: string;
  ativo?: boolean;
}

export type EventoUpdate = Partial<EventoCreate>;

// ─── Financeiro ──────────────────────────────────────────────────────────────
export interface ItemVenda {
  id: number;
  venda_id: number;
  produto: string;
  quantidade: number;
  preco_unitario: string;
  total: string;
  created_at: string;
}

export interface ItemVendaCreate {
  produto: string;
  quantidade: number;
  preco_unitario: string;
  total: string;
}

export interface VendaSemanal {
  id: number;
  semana_inicio: string;
  semana_fim: string;
  total_investido: string;
  total_arrecadado: string;
  valor_dinheiro: string;
  valor_pix: string;
  lucro_liquido: string;
  observacoes?: string;
  itens: ItemVenda[];
  created_at: string;
  updated_at: string;
}

export interface VendaSemanalCreate {
  semana_inicio: string;
  semana_fim: string;
  total_investido: string;
  total_arrecadado: string;
  valor_dinheiro?: string;
  valor_pix?: string;
  observacoes?: string;
  itens?: ItemVendaCreate[];
}

export interface DistribuicaoItem {
  jovem_id: number;
  valor: string;
}

export interface DistribuirGanhosRequest {
  venda_id: number;
  distribuicoes: DistribuicaoItem[];
}

export interface GanhoMensalJovem {
  jovem_id: number;
  jovem_nome: string;
  total_mensal: string;
}

export interface GanhoVenda {
  id: number;
  jovem_id: number;
  venda_id: number;
  valor: string;
  created_at: string;
}

export interface ResumoFinanceiro {
  total_dinheiro: string;
  total_pix: string;
  total_caixa: string;
  total_investido: string;
  total_arrecadado: string;
  lucro_liquido: string;
}

// ─── Notificação ─────────────────────────────────────────────────────────────
export interface Notificacao {
  id: number;
  jovem_id: number;
  jovem_nome?: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

// ─── Filtros ─────────────────────────────────────────────────────────────────
export interface FiltroVendas {
  semana_inicio?: string;
  semana_fim?: string;
  mes?: number;
  ano?: number;
}

export interface AuthUser {
  username: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthSession {
  access_token: string;
  token_type: "bearer";
  user: AuthUser;
}
