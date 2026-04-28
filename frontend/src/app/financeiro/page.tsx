"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeiroApi, jovensApi, eventosApi } from "@/services/api";
import {
  DollarSign, Plus, Filter, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, Pencil, Trash2, Users2, Banknote, Check, X
} from "lucide-react";
import { formatCurrency, formatDate, mesAtual, anoAtual } from "@/lib/utils";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import toast from "react-hot-toast";
import VendaForm from "@/components/financeiro/VendaForm";
import DistribuirGanhosModal from "@/components/financeiro/DistribuirGanhosModal";
import { VendaSemanal } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import Select from "@/components/ui/Select";
import CurrencyInput from "@/components/ui/CurrencyInput";
export default function FinanceiroPage() {
  const [tab, setTab] = useState<'ganhos' | 'arrecadacoes'>('ganhos');
  const [confirmZerar, setConfirmZerar] = useState(false);
  const qc = useQueryClient();
  const { isAuthenticated, openLogin, user } = useAuth();

  const [mes, setMes] = useState(mesAtual());
  const [ano, setAno] = useState(anoAtual());
  const [semanaInicio, setSemanaInicio] = useState("");
  const [semanaFim, setSemanaFim] = useState("");

  const [modalVenda, setModalVenda] = useState(false);
  const [editingVenda, setEditingVenda] = useState<VendaSemanal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendaSemanal | null>(null);
  const [distribuirVenda, setDistribuirVenda] = useState<VendaSemanal | null>(null);
  const [expandedVendas, setExpandedVendas] = useState<Set<number>>(new Set());

  const [isEditResumo, setIsEditResumo] = useState(false);
  const [eventoAlvo, setEventoAlvo] = useState("");
  const { data: eventos = [] } = useQuery({
    queryKey: ["eventos", ano],
    queryFn: ({ queryKey }) => {
      const ano = queryKey[1] !== undefined ? Number(queryKey[1]) : undefined;
      return eventosApi.listar(ano);
    }
  });
  const [resumoEdit, setResumoEdit] = useState({
    total_caixa: "",
    total_dinheiro: "",
    total_pix: ""
  });

  const { data: jovensHab = [] } = useQuery({ queryKey: ["jovens-hab"], queryFn: jovensApi.habilitados });

  const filtros = {
    semana_inicio: semanaInicio || undefined,
    semana_fim: semanaFim || undefined,
    evento_id: eventoAlvo ? Number(eventoAlvo) : undefined,
  };

  const { data: vendas = [], isLoading } = useQuery({
    queryKey: ["vendas", filtros],
    queryFn: () => financeiroApi.listarVendas(filtros),
  });

  // Mutação para zerar ganhos
  const zerarGanhosMut = useMutation({
    mutationFn: financeiroApi.zerarGanhos,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["ganhos-mensais"] });
      toast.success(data.message || "Receitas zeradas!");
    },
    onError: () => toast.error("Erro ao zerar receitas."),
  });

  const { data: resumoCaixa } = useQuery({
    queryKey: ["resumo-caixa"],
    queryFn: financeiroApi.resumoCaixa,
  });

  const atualizarResumoMut = useMutation({
    mutationFn: financeiroApi.atualizarResumoCaixa,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resumo-caixa"] });
      toast.success("Resumo do caixa atualizado!");
      setIsEditResumo(false);
    },
    onError: () => toast.error("Erro ao atualizar resumo do caixa."),
  });

  const { data: ganhosMensais = [] } = useQuery({
    queryKey: ["ganhos-mensais", filtros],
    queryFn: () => financeiroApi.ganhosMensais(filtros),
  });

  const deleteMut = useMutation({
    mutationFn: financeiroApi.deletarVenda,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendas"] });
      qc.invalidateQueries({ queryKey: ["ganhos-mensais"] });
      toast.success("Venda removida!");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Erro ao remover venda."),
  });

  function toggleExpand(id: number) {
    setExpandedVendas((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Totais filtrados
  const totalInvestidoFiltrado = vendas.reduce((s, v) => s + parseFloat(v.total_investido), 0);
  const totalArrecadadoFiltrado = vendas.reduce((s, v) => s + parseFloat(v.total_arrecadado), 0);
  const lucroFiltrado = totalArrecadadoFiltrado - totalInvestidoFiltrado;

  // Monta lista de todos habilitados, preenchendo 0 para quem não tem ganho
  const ganhosPorJovemId: Record<number, typeof ganhosMensais[0]> = {};
  ganhosMensais.forEach(g => { ganhosPorJovemId[g.jovem_id] = g; });
  const todosGanhos = (jovensHab || []).map(jovem =>
    ganhosPorJovemId[jovem.id] || {
      jovem_id: jovem.id,
      jovem_nome: jovem.nome,
      total_mensal: "0",
    }
  );
  const ganhosOrdenados = [...todosGanhos].sort((a, b) => parseFloat(b.total_mensal) - parseFloat(a.total_mensal));
  const totalGanhosMensais = ganhosOrdenados.reduce((s, g) => s + parseFloat(g.total_mensal), 0);
  const destaqueClasse = [
    "top-1", // 1º lugar
    "top-2", // 2º lugar
    "top-3", // 3º lugar
    "top-4", // 4º lugar
    "top-5", // 5º lugar
  ];
  const [jovemOperando, setJovemOperando] = useState<number | null>(null);
  const [valorOperacao, setValorOperacao] = useState<string>("");
  const [tipoOperacao, setTipoOperacao] = useState<"add" | "sub" | null>(null);
  const [salvando, setSalvando] = useState(false);

  function requireAuth(action: () => void) {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    action();
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Caixa Financeiro
          </h1>
          <p className="page-subtitle">Controle de vendas e distribuição de ganhos</p>
        </div>
        {user?.role === "admin" && (
          <Button onClick={() => requireAuth(() => { setEditingVenda(null); setModalVenda(true); })}>
            <Plus className="w-4 h-4" /> Nova Venda
          </Button>
        )}
      </div>

      {/* Resumo do caixa (sempre no topo) */}
      <div className="card-resumo mb-4">
        <div className="resumo-header">
          <Banknote className="w-10 h-10 text-emerald-500" />
          <h2>Resumo do Caixa</h2>
          <hr />
          {user?.role === "admin" && (
            <div className="form-actions" style={{ margin: 0, display: "flex", gap: 8 }}>
              {isEditResumo && (
                <Button variant="outline" type="button" onClick={() => {
                  setIsEditResumo(false);
                  setResumoEdit({
                    total_caixa: resumoEdit?.total_caixa || "",
                    total_dinheiro: resumoEdit?.total_dinheiro || "",
                    total_pix: resumoEdit?.total_pix || ""
                  });
                }}>
                  Cancelar
                </Button>
              )}
              <Button
                type="button"
                variant={isEditResumo ? "primary" : "outline"}
                onClick={() => {
                  if (isEditResumo) {
                    atualizarResumoMut.mutate({
                      total_caixa: resumoEdit.total_caixa || "0",
                      total_dinheiro: resumoEdit.total_dinheiro || "0",
                      total_pix: resumoEdit.total_pix || "0",
                    });
                  } else {
                    setResumoEdit({
                      total_caixa: resumoCaixa?.total_caixa ?? "",
                      total_dinheiro: resumoCaixa?.total_dinheiro ?? "",
                      total_pix: resumoCaixa?.total_pix ?? "",
                    });
                    setIsEditResumo(true);
                  }
                }}
              >
                {isEditResumo ? "Salvar" : "Editar"}
              </Button>
            </div>
          )}
        </div>

        {/* Resumo geral do financeiro */}
        <div className="resumo-grid">
          <div className="form-group">
            <label className="form-label">Total em caixa</label>
            {isEditResumo ? (
              <CurrencyInput
                className="summary-card__input"
                value={resumoEdit.total_caixa}
                onValueChange={value => setResumoEdit(v => ({ ...v, total_caixa: value }))}
                placeholder="0,00"
              />
            ) : (
              <span className="summary-card__value caixa">{formatCurrency(resumoCaixa?.total_caixa ?? 0)}</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Dinheiro</label>
            {isEditResumo ? (
              <CurrencyInput
                className="summary-card__input"
                value={resumoEdit.total_dinheiro}
                onValueChange={value => setResumoEdit(v => ({ ...v, total_dinheiro: value }))}
                placeholder="0,00"
              />
            ) : (
              <span className="summary-card__value dinheiro">{formatCurrency(resumoCaixa?.total_dinheiro ?? 0)}</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Pix</label>
            {isEditResumo ? (
              <CurrencyInput
                className="summary-card__input"
                value={resumoEdit.total_pix}
                onValueChange={value => setResumoEdit(v => ({ ...v, total_pix: value }))}
                placeholder="0,00"
              />
            ) : (
              <span className="summary-card__value pix">{formatCurrency(resumoCaixa?.total_pix ?? 0)}</span>
            )}
          </div>
        </div>

        {/* Mensagem de inconsistência */}
        {resumoCaixa && parseFloat(resumoCaixa.total_caixa) !== (parseFloat(resumoCaixa.total_dinheiro) + parseFloat(resumoCaixa.total_pix)) && (
          <span className="resumo-warning">
            Aviso: Total em caixa diferente da soma de dinheiro e pix.
          </span>
        )}
      </div>

      {/* Filtros colapsados */}
      <div className="card mb-4">
        <details>
          <summary
            style={{
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "space-between"
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter className="filter-header__icon" />
              Filtros
            </span>
            <span style={{ marginLeft: 12, display: 'flex', alignItems: 'center' }}>
              <span className="collapse-icon">
                <ChevronDown className="w-5 h-5 text-slate-400 details-chevron" />
              </span>
            </span>
            <style>{`
              details[open] .details-chevron {
                transform: rotate(180deg);
                transition: transform 0.2s;
              }
              .details-chevron {
                transition: transform 0.2s;
              }
            `}</style>
          </summary>
          <div className="filter-grid" style={{ marginTop: 12 }}>
            <div className="form-group">
              <label className="form-label">Início do período</label>
              <DatePicker
                value={semanaInicio}
                onChange={setSemanaInicio}
                placeholder="Selecione o início"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fim do período</label>
              <DatePicker
                value={semanaFim}
                onChange={setSemanaFim}
                placeholder="Selecione o fim"
              />
            </div>
            <div className="form-group">
              <Select
                label="Evento"
                value={eventoAlvo}
                className="py-[0.6rem]"
                onChange={e => setEventoAlvo(e.target.value)}
                options={[
                  { label: "Todos", value: "" },
                  ...eventos.map(ev => ({ label: ev.nome, value: String(ev.id) }))
                ]}
              />
            </div>
          </div>
        </details>
      </div>

      {/* Totais do período filtrado */}
      <div className="period-grid mb-6">
        {[
          { label: "Investido no período", value: totalInvestidoFiltrado, icon: TrendingDown, color: "text-red-600 bg-red-50" },
          { label: "Arrecadado no período", value: totalArrecadadoFiltrado, icon: TrendingUp, color: "text-green-600 bg-green-50" },
          { label: "Lucro líquido do período", value: lucroFiltrado, icon: DollarSign, color: lucroFiltrado >= 0 ? "text-blue-600 bg-blue-50" : "text-red-600 bg-red-50" },
        ].map((item) => (
          <div key={item.label} className="period-card">
            <div className={`period-card__icon ${item.color.split(" ")[1]}`}> 
              <item.icon className={`period-card__icon-svg ${item.color.split(" ")[0]}`} />
            </div>
            <div>
              <p className="period-card__value">{formatCurrency(item.value)}</p>
              <p className="period-card__label">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs flex gap-2">
        <button
          className={`tab-btn px-4 pt-2 pb-6 rounded-t-md font-semibold w-full sm:w-auto ${tab === 'ganhos' ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-500'}`}
          onClick={() => setTab('ganhos')}
        >
          Ganhos por Jovem
        </button>
        <button
          className={`tab-btn px-4 pt-2 pb-6 rounded-t-md font-semibold w-full sm:w-auto ${tab === 'arrecadacoes' ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-500'}`}
          onClick={() => setTab('arrecadacoes')}
        >
          Arrecadações
        </button>
      </div>

      {/* Conteúdo das guias */}
      {tab === 'ganhos' ? (
        // --- Ganhos por Jovem ---
        <div className="card" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, boxShadow: 'none', borderTop: 'none' }}>
          <div className="ganhos-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users2 className="ganhos-header__icon" />
              <h2 className="section-title--base">Caixa individual</h2>
            </div>
            {user?.role === "admin" && (
              <Button
                variant="outline"
                color="red"
                onClick={() => requireAuth(() => setConfirmZerar(true))}
                disabled={zerarGanhosMut.isPending}
                title="Zerar todas as receitas dos jovens"
                style={{ marginLeft: "auto" }}
              >
                Zerar Receitas
              </Button>
            )}
          </div>
          {jovensHab.length === 0 ? (
            <p className="empty-state">Nenhum jovem habilitado financeiramente.</p>
          ) : (
            (() => {
              const iniciarOperacao = (jovemId: number, tipo: "add" | "sub") => {
                setJovemOperando(jovemId);
                setTipoOperacao(tipo);
                setValorOperacao("");
              };
              const cancelarOperacao = () => {
                setJovemOperando(null);
                setTipoOperacao(null);
                setValorOperacao("");
              };
              const salvarOperacao = async (jovemId: number) => {
                setSalvando(true);
                try {
                  const valor = parseFloat(valorOperacao.replace(",", "."));
                  if (isNaN(valor) || valor === 0) {
                    toast.error("Informe um valor válido");
                    setSalvando(false);
                    return;
                  }
                  const valorFinal = tipoOperacao === "sub" ? -Math.abs(valor) : Math.abs(valor);
                  await financeiroApi.adicionarGanhoManual(jovemId, valorFinal);
                  qc.invalidateQueries({ queryKey: ["ganhos-mensais"] });
                  toast.success("Operação registrada!");
                  cancelarOperacao();
                } catch (e) {
                  toast.error("Erro ao registrar operação");
                } finally {
                  setSalvando(false);
                }
              };
              return (
                <>
                  {/* Tabela para desktop */}
                  <div className="ganhos-table-desktop">
                    <table className="data-table">
                      <thead>
                        <tr className="data-table__head-row">
                          <th className="data-table__head-cell">Jovem</th>
                          <th className="data-table__head-cell--right">Total arrecadado</th>
                          {user?.role === "admin" && <th className="data-table__head-cell--right pr-5">Ações</th>}
                        </tr>
                      </thead>
                      <tbody className="data-table__body">
                        {ganhosOrdenados.map((g, idx) => {
                          const temValor = parseFloat(g.total_mensal) > 0;
                          const classe = temValor && idx < 5 ? destaqueClasse[idx] : "";
                          const operando = jovemOperando === g.jovem_id;
                          return (
                            <tr key={g.jovem_id} className={`data-table__row${classe ? ` ${classe}` : ""}`}>
                              <td className="data-table__cell">
                                <div className="flex items-center gap-2">
                                  <div className="data-table__avatar--sm data-table__avatar--purple">
                                    {g.jovem_nome.charAt(0)}
                                  </div>
                                  <span className="jovem__name">{g.jovem_nome.split(" ").slice(0, 2).join(" ")}</span>
                                  {temValor && classe && idx < 3 ? (
                                    <span
                                      className={`ranking-badge ranking-badge--${classe} medalha-icon-pos`}
                                      title={`Medalha de ${idx + 1}º lugar`}
                                      style={{ display: 'inline-flex', alignItems: 'center' }}
                                    >
                                      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle', marginRight: 2 }}>
                                        <g style={{borderBottom: "1px solid black"}}>
                                          <rect x="6" y="26" width="5" height="8" rx="0.2" fill="#bdbdbd" />
                                          <rect x="17" y="26" width="5" height="8" rx="0.2" fill="#bdbdbd" />
                                        </g>
                                        {/* Medalha */}
                                        <circle cx="14" cy="16" r="12" fill={idx === 0 ? '#f7ae01' : idx === 1 ? '#ababab' : '#CD7F32'} stroke="#fff" strokeWidth="2" />
                                        <circle cx="14" cy="16" r="12" fill="none" stroke="#ffb300" strokeWidth="1.5" strokeDasharray="2 2" />
                                        <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff">{idx + 1}°</text>
                                      </svg>
                                    </span>
                                  ) : temValor && classe ? (
                                    <span className={`ranking-badge ranking-badge--${classe}`}>{idx + 1}º</span>
                                  ) : null}
                                </div>
                              </td>
                              <td className="data-table__cell--right font-semibold text-green-600">
                                {formatCurrency(g.total_mensal)}
                              </td>
                              {user?.role === "admin" && (
                                <td className="data-table__cell--right">
                                  {operando ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', width: '100%' }}>
                                      <CurrencyInput
                                        value={valorOperacao}
                                        onValueChange={setValorOperacao}
                                        className="input-inline-edit"
                                        style={{ color: tipoOperacao === "add" ? "green" : "red"  }}
                                        disabled={salvando}
                                        placeholder={tipoOperacao === "add" ? "+ R$ 0,00" : "- R$ 0,00"}
                                      />
                                      <Button className="mr-1" size="sm" variant="outline" onClick={() => salvarOperacao(g.jovem_id)} title="Salvar" disabled={salvando}>
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button className="mr-1" size="sm" variant="outline" onClick={cancelarOperacao} title="Cancelar" disabled={salvando}>
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <>
                                      <Button className="mr-1" size="sm" variant="outline" onClick={() => iniciarOperacao(g.jovem_id, "add")} title="Adicionar valor">
                                        +
                                      </Button>
                                      <Button className="mr-1" size="sm" variant="outline" onClick={() => iniciarOperacao(g.jovem_id, "sub")} title="Subtrair valor">
                                        -
                                      </Button>
                                    </>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="data-table__footer-row">
                          <td className="data-table__footer-cell">Total</td>
                          <td className="data-table__footer-cell--right">{formatCurrency(totalGanhosMensais)}</td>
                          {isAuthenticated && <td />}
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Cards para mobile */}
                  <div className="ganhos-grid-responsive">
                    {ganhosOrdenados.map((g, idx) => {
                      const temValor = parseFloat(g.total_mensal) > 0;
                      const classe = temValor && idx < 5 ? destaqueClasse[idx] : "";
                      const operando = jovemOperando === g.jovem_id;
                      return (
                        <div key={g.jovem_id} className={`ganho-card ${classe}`.trim()}>
                          <div className="ganho-card__header-mobile">
                            <div className="data-table__avatar--sm data-table__avatar--purple">
                              {g.jovem_nome.charAt(0)}
                            </div>
                            <div className="ganho-card__header-mobile-nome">
                              <span className="jovem__name">{g.jovem_nome.split(" ").slice(0, 2).join(" ")}</span>
                              {temValor && classe && idx < 3 ? (
                                    <span
                                      className={`ranking-badge ranking-badge--${classe} medalha-icon-pos`}
                                      title={`Medalha de ${idx + 1}º lugar`}
                                      style={{ display: 'inline-flex', alignItems: 'center' }}
                                    >
                                      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle', marginRight: 2 }}>
                                        {/* Faixa/fita abaixo do círculo */}
                                        <g>
                                          <rect x="6" y="26" width="5" height="8" rx="0.2" fill="#bdbdbd" />
                                          <rect x="17" y="26" width="5" height="8" rx="0.2" fill="#bdbdbd" />
                                        </g>
                                        {/* Medalha */}
                                        <circle cx="14" cy="16" r="12" fill={idx === 0 ? '#f7ae01' : idx === 1 ? '#ababab' : '#CD7F32'} stroke="#fff" strokeWidth="2" />
                                        <circle cx="14" cy="16" r="12" fill="none" stroke="#ffb300" strokeWidth="1.5" strokeDasharray="2 2" />
                                        <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff">{idx + 1}°</text>
                                      </svg>
                                    </span>
                                  ) : temValor && classe ? (
                                    <span className={`ranking-badge ranking-badge--${classe}`}>{idx + 1}º</span>
                                  ) : null}
                            </div>
                          </div>
                          <div className="ganho-card__value font-semibold text-green-600">
                            <span style={{color: "grey", fontSize: 15}}>Total arrecadado:</span> {formatCurrency(g.total_mensal)}
                          </div>
                          {user?.role === "admin" && (
                            <div className="ganho-card__actions">
                              {operando ? (
                                <div className="ganho-card__edit-row">
                                  <CurrencyInput
                                    value={valorOperacao}
                                    onValueChange={setValorOperacao}
                                    className="input-inline-edit"
                                    style={{ width: 90, textAlign: "right", color: tipoOperacao === "add" ? "green" : "red" }}
                                    disabled={salvando}
                                    placeholder={tipoOperacao === "add" ? "+ R$ 0,00" : "- R$ 0,00"}
                                  />
                                  <Button className="mr-1" size="sm" variant="outline" onClick={() => salvarOperacao(g.jovem_id)} title="Salvar" disabled={salvando}>
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button className="mr-1" size="sm" variant="outline" onClick={cancelarOperacao} title="Cancelar" disabled={salvando}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="ganho-card__btn-row">
                                  <Button className="mr-1" size="sm" variant="outline" onClick={() => iniciarOperacao(g.jovem_id, "add")} title="Adicionar valor">
                                    +
                                  </Button>
                                  <Button className="mr-1" size="sm" variant="outline" onClick={() => iniciarOperacao(g.jovem_id, "sub")} title="Subtrair valor">
                                    -
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()
          )}
        </div>
      ) : (
        // --- Arrecadações ---
        <>
          {/* Lista de vendas semanais */}
          <div className="card" style={{ marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, boxShadow: 'none', borderTop: 'none' }}>
            <h2 className="section-title--base">Arrecadações</h2>
            {isLoading ? (
              <p className="loading-state">Carregando...</p>
            ) : vendas.length === 0 ? (
              <p className="empty-state">Nenhuma venda no período.</p>
            ) : (
              <div className="space-y-3">
                {vendas.map((venda) => {
                  const expanded = expandedVendas.has(venda.id);
                  return (
                    <div key={venda.id} className="venda-item">
                      <div className="venda-item__header" onClick={() => toggleExpand(venda.id)}>
                        <div className="flex w-full justify-between items-start gap-3">
                          <div style={{ flex: 1 }}>
                            <p className="venda-item__title">
                              {formatDate(venda.semana_inicio)} — {formatDate(venda.semana_fim)}
                            </p>
                            <div className="venda-item__meta">
                              <span className="venda-item__meta--invested">Inv: {formatCurrency(venda.total_investido)}</span>
                              <span className="venda-item__meta--earned">Arr: {formatCurrency(venda.total_arrecadado)}</span>
                              <span className={parseFloat(venda.lucro_liquido) >= 0 ? "text-blue-600 font-medium" : "text-red-600 font-medium"}>
                                Lucro: {formatCurrency(venda.lucro_liquido)}
                              </span>
                            </div>
                          </div>
          
                          <div className="venda-header-actions-col">
                            <span className="chevron-mobile block sm:hidden" style={{ marginBottom: 4 }}>{expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}</span>
                            {/* Mobile: botões abaixo do chevron */}
                            {user?.role === "admin" && (
                              <div className="venda-header-actions-mobile-btns block sm:hidden" style={{ marginTop: 0 }}>
                                <button onClick={(e) => { e.stopPropagation(); requireAuth(() => setDistribuirVenda(venda)); }} className="action-btn action-btn--distribute" title="Distribuir ganhos">
                                  <Users2 className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); requireAuth(() => { setEditingVenda(venda); setModalVenda(true); }); }} className="action-btn action-btn--edit">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); requireAuth(() => setDeleteTarget(venda)); }} className="action-btn action-btn--delete" title="Remover venda">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {/* Desktop: chevron e botões lado a lado */}
                            <div className="venda-header-actions-desktop hidden sm:flex items-center">
                              {user?.role === "admin" && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); requireAuth(() => setDistribuirVenda(venda)); }} className="action-btn action-btn--distribute px-1" title="Distribuir ganhos">
                                    <Users2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); requireAuth(() => { setEditingVenda(venda); setModalVenda(true); }); }} className="action-btn action-btn--edit px-1">
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); requireAuth(() => setDeleteTarget(venda)); }} className="action-btn action-btn--delete px-1" title="Remover venda">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <span className="chevron-desktop">{expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {expanded && venda.itens.length > 0 && (
                        <div className="venda-item__details">
                          <p className="venda-item__details-title">Itens vendidos</p>
                          <table className="data-table">
                            <thead>
                              <tr className="venda-table__head-cell">
                                <th className="text-left pb-1">Produto</th>
                                <th className="text-right pb-1">Qtd</th>
                                <th className="text-right pb-1">Preço Unit.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {venda.itens.map((item) => (
                                <tr key={item.id} className="venda-table__row">
                                  <td className="venda-table__cell">{item.produto}</td>
                                  <td className="venda-table__cell--right">{item.quantidade}</td>
                                  <td className="venda-table__cell--right">{formatCurrency(item.preco_unitario)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="venda-item__details-footer">
                            <span className="font-medium text-right block w-full">Total arrecadado: {
                              formatCurrency(venda.total_arrecadado)
                            }</span>
                            {venda.observacoes && <span className="italic">{venda.observacoes}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modais e dialogs globais */}
      <Modal open={modalVenda} onClose={() => { setModalVenda(false); setEditingVenda(null); }} title={editingVenda ? "Editar Venda" : "Registrar Venda Semanal"} size="lg">
        <VendaForm
          editing={editingVenda}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["vendas"] });
            qc.invalidateQueries({ queryKey: ["ganhos-mensais"] });
            setModalVenda(false);
            setEditingVenda(null);
          }}
          onCancel={() => { setModalVenda(false); setEditingVenda(null); }}
        />
      </Modal>

      {distribuirVenda && (
        <DistribuirGanhosModal
          open={!!distribuirVenda}
          venda={distribuirVenda}
          jovens={jovensHab}
          onClose={() => setDistribuirVenda(null)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["ganhos-mensais"] });
            setDistribuirVenda(null);
            toast.success("Ganhos distribuídos!");
          }}
        />
      )}

      {/* Confirmação para deletar venda */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        message={`Remover a venda da semana ${deleteTarget ? formatDate(deleteTarget.semana_inicio) : ""}?`}
        loading={deleteMut.isPending}
      />

      {/* Confirmação para zerar receitas dos jovens */}
      <ConfirmDialog
        open={confirmZerar}
        onClose={() => setConfirmZerar(false)}
        onConfirm={() => {
          setConfirmZerar(false);
          zerarGanhosMut.mutate();
        }}
        message="Tem certeza que deseja zerar todas as receitas dos jovens? Essa ação não pode ser desfeita."
        loading={zerarGanhosMut.isPending}
      />
    </div>
  );
}