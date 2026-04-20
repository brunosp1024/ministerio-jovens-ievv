import axios from "axios";
import { getAuthToken } from "@/lib/auth";
import type {
  Jovem, JovemCreate, JovemUpdate,
  Evento, EventoCreate, EventoUpdate,
  VendaSemanal, VendaSemanalCreate,
  DistribuirGanhosRequest, GanhoMensalJovem, GanhoVenda,
  ResumoFinanceiro, FiltroVendas,
  Notificacao,
  AuthSession, AuthUser, LoginPayload,
  ResumoCaixaResponse,
} from "@/types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (data: LoginPayload) => api.post<AuthSession>("/auth/login", data).then((r) => r.data),
  me: () => api.get<AuthUser>("/auth/me").then((r) => r.data),
};

// ─── Jovens ──────────────────────────────────────────────────────────────────
export const jovensApi = {
  listar: (params?: { ativo?: boolean }) =>
    api.get<Jovem[]>("/jovens/", { params }).then((r) => r.data),
  buscar: (id: number) => api.get<Jovem>(`/jovens/${id}`).then((r) => r.data),
  habilitados: () => api.get<Jovem[]>("/jovens/habilitados-financeiro").then((r) => r.data),
  aniversariantes: () => api.get<Jovem[]>("/jovens/aniversariantes-hoje").then((r) => r.data),
  criar: (data: JovemCreate) => api.post<Jovem>("/jovens/", data).then((r) => r.data),
  atualizar: (id: number, data: JovemUpdate) => api.put<Jovem>(`/jovens/${id}`, data).then((r) => r.data),
  deletar: (id: number) => api.delete(`/jovens/${id}`),
};

// ─── Eventos ─────────────────────────────────────────────────────────────────
export const eventosApi = {
  listar: () => api.get<Evento[]>("/eventos/").then((r) => r.data),
  buscar: (id: number) => api.get<Evento>(`/eventos/${id}`).then((r) => r.data),
  criar: (data: EventoCreate) => api.post<Evento>("/eventos/", data).then((r) => r.data),
  atualizar: (id: number, data: EventoUpdate) => api.put<Evento>(`/eventos/${id}`, data).then((r) => r.data),
  deletar: (id: number) => api.delete(`/eventos/${id}`),
};

// ─── Financeiro ──────────────────────────────────────────────────────────────
export const financeiroApi = {
  listarVendas: (filtros?: FiltroVendas) =>
    api.get<VendaSemanal[]>("/financeiro/vendas", { params: filtros }).then((r) => r.data),
  buscarVenda: (id: number) =>
    api.get<VendaSemanal>(`/financeiro/vendas/${id}`).then((r) => r.data),
  criarVenda: (data: VendaSemanalCreate) =>
    api.post<VendaSemanal>("/financeiro/vendas", data).then((r) => r.data),
  atualizarVenda: (id: number, data: Partial<VendaSemanalCreate>) =>
    api.put<VendaSemanal>(`/financeiro/vendas/${id}`, data).then((r) => r.data),
  deletarVenda: (id: number) => api.delete(`/financeiro/vendas/${id}`),
  distribuirGanhos: (data: DistribuirGanhosRequest) =>
    api.post("/financeiro/distribuir-ganhos", data).then((r) => r.data),
  ganhosMensais: (mes: number, ano: number) =>
    api.get<GanhoMensalJovem[]>('/financeiro/ganhos/mensais', { params: { mes, ano } }).then((r) => r.data),
  resumo: () => api.get<ResumoFinanceiro>("/financeiro/resumo").then((r) => r.data),
  resumoCaixa: () => api.get<ResumoCaixaResponse>("/financeiro/resumo-caixa").then((r) => r.data),
  atualizarResumoCaixa: (data: { total_caixa: string; total_dinheiro: string; total_pix: string }) =>
    api.patch<ResumoCaixaResponse>("/financeiro/resumo-caixa", data).then((r) => r.data),
  ganhosPorVenda: (venda_id: number) =>
    api.get<GanhoVenda[]>(`/financeiro/ganhos/venda/${venda_id}`).then((r) => r.data),
};

// ─── Notificações ─────────────────────────────────────────────────────────────
export const notificacoesApi = {
  listar: (apenas_nao_lidas?: boolean) =>
    api.get<Notificacao[]>("/notificacoes/", { params: { apenas_nao_lidas } }).then((r) => r.data),
  countNaoLidas: () =>
    api.get<{ count: number }>("/notificacoes/count-nao-lidas").then((r) => r.data),
  marcarLida: (id: number) =>
    api.patch(`/notificacoes/${id}/marcar-lida`).then((r) => r.data),
  marcarTodasLidas: () =>
    api.patch("/notificacoes/marcar-todas-lidas").then((r) => r.data),
};

export default api;
