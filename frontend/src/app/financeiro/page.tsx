"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { financeiroApi, jovensApi } from "@/services/api";
import {
  DollarSign, Plus, Filter, TrendingUp, TrendingDown,
  Wallet, CreditCard, Banknote, ChevronDown, ChevronUp, Pencil, Trash2, Users2
} from "lucide-react";
import { formatCurrency, formatDate, MESES, mesAtual, anoAtual } from "@/lib/utils";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import toast from "react-hot-toast";
import VendaForm from "@/components/financeiro/VendaForm";
import DistribuirGanhosModal from "@/components/financeiro/DistribuirGanhosModal";
import { VendaSemanal } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAuth } from "@/contexts/AuthContext";

export default function FinanceiroPage() {
  const qc = useQueryClient();
  const { isAuthenticated, openLogin } = useAuth();

  const [mes, setMes] = useState(mesAtual());
  const [ano, setAno] = useState(anoAtual());
  const [semanaInicio, setSemanaInicio] = useState("");
  const [semanaFim, setSemanaFim] = useState("");

  const [modalVenda, setModalVenda] = useState(false);
  const [editingVenda, setEditingVenda] = useState<VendaSemanal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VendaSemanal | null>(null);
  const [distribuirVenda, setDistribuirVenda] = useState<VendaSemanal | null>(null);
  const [expandedVendas, setExpandedVendas] = useState<Set<number>>(new Set());

  const { data: jovensHab = [] } = useQuery({ queryKey: ["jovens-hab"], queryFn: jovensApi.habilitados });

  const filtros = {
    semana_inicio: semanaInicio || undefined,
    semana_fim: semanaFim || undefined,
  };

  const { data: vendas = [], isLoading } = useQuery({
    queryKey: ["vendas", filtros],
    queryFn: () => financeiroApi.listarVendas(filtros),
  });

  const { data: resumo } = useQuery({
    queryKey: ["resumo"],
    queryFn: () => financeiroApi.resumo(),
  });

  const { data: ganhosMensais = [] } = useQuery({
    queryKey: ["ganhos-mensais", mes, ano],
    queryFn: () => financeiroApi.ganhosMensais(mes, ano),
  });

  const deleteMut = useMutation({
    mutationFn: financeiroApi.deletarVenda,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendas"] });
      qc.invalidateQueries({ queryKey: ["resumo"] });
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

  const totalGanhosMensais = ganhosMensais.reduce((s, g) => s + parseFloat(g.total_mensal), 0);

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
        {isAuthenticated && (
          <Button onClick={() => requireAuth(() => { setEditingVenda(null); setModalVenda(true); })}>
            <Plus className="w-4 h-4" /> Nova Venda
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="filter-header">
          <Filter className="filter-header__icon" />
          <h2 className="filter-header__title">Filtros</h2>
        </div>
        <div className="filter-grid">
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
        </div>
      </div>

      {/* Resumo geral */}
      {resumo && (
        <div className="summary-grid">
          {[
            { label: "Total em Caixa", value: resumo.total_caixa, icon: Wallet, color: "bg-blue-500" },
            { label: "Dinheiro", value: resumo.total_dinheiro, icon: Banknote, color: "bg-green-500" },
            { label: "Pix", value: resumo.total_pix, icon: CreditCard, color: "bg-purple-500" },
            { label: "Lucro Líquido Total", value: resumo.lucro_liquido, icon: TrendingUp, color: "bg-amber-500" },
          ].map((item) => (
            <div key={item.label} className="card">
              <div className="summary-card__content">
                <div className={`${item.color} summary-card__icon`}>
                  <item.icon className="summary-card__icon-svg" />
                </div>
                <div>
                  <p className="summary-card__value">{formatCurrency(item.value)}</p>
                  <p className="summary-card__label">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Totais do período filtrado */}
      <div className="period-grid">
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

      {/* Lista de vendas semanais */}
      <div className="card">
        <h2 className="section-title--base">Semanas</h2>
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
                    <div className="flex items-center gap-3">
                      <div>
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
                    </div>
                    <div className="flex items-center">
                      {isAuthenticated && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); requireAuth(() => setDistribuirVenda(venda)); }} className="action-btn action-btn--distribute" title="Distribuir ganhos">
                            <Users2 className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); requireAuth(() => { setEditingVenda(venda); setModalVenda(true); }); }} className="action-btn action-btn--edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); requireAuth(() => setDeleteTarget(venda)); }} className="action-btn action-btn--delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
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
                            <th className="text-right pb-1">Unit.</th>
                            <th className="text-right pb-1">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {venda.itens.map((item) => (
                            <tr key={item.id} className="venda-table__row">
                              <td className="venda-table__cell">{item.produto}</td>
                              <td className="venda-table__cell--right">{item.quantidade}</td>
                              <td className="venda-table__cell--right">{formatCurrency(item.preco_unitario)}</td>
                              <td className="venda-table__cell--total">{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="venda-item__details-footer">
                        <span>Dinheiro: {formatCurrency(venda.valor_dinheiro)}</span>
                        <span>Pix: {formatCurrency(venda.valor_pix)}</span>
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

      {/* Ganhos mensais por jovem */}
      <div className="card">
        <div className="ganhos-header">
          <Users2 className="ganhos-header__icon" />
          <h2 className="section-title--base">
            Ganhos por Jovem — {MESES.find((m2) => m2.value === mes)?.label} {ano}
          </h2>
        </div>
        {ganhosMensais.length === 0 ? (
          <p className="empty-state">Nenhum ganho registrado no período.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="data-table__head-row">
                    <th className="data-table__head-cell">Jovem</th>
                    <th className="data-table__head-cell--right">Total no Mês</th>
                    <th className="data-table__head-cell--right">% do Total</th>
                  </tr>
                </thead>
                <tbody className="data-table__body">
                  {ganhosMensais.map((g) => {
                    const pct = totalGanhosMensais > 0 ? (parseFloat(g.total_mensal) / totalGanhosMensais * 100).toFixed(1) : "0";
                    return (
                      <tr key={g.jovem_id} className="data-table__row">
                        <td className="data-table__cell">
                          <div className="flex items-center gap-2">
                            <div className="data-table__avatar--sm data-table__avatar--purple">
                              {g.jovem_nome.charAt(0)}
                            </div>
                            <span className="jovem__name">{g.jovem_nome}</span>
                          </div>
                        </td>
                        <td className="data-table__cell--right font-semibold text-green-600">{formatCurrency(g.total_mensal)}</td>
                        <td className="data-table__cell--right text-slate-500">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="data-table__footer-row">
                    <td className="data-table__footer-cell">Total</td>
                    <td className="data-table__footer-cell--right">{formatCurrency(totalGanhosMensais)}</td>
                    <td className="data-table__cell--right text-slate-500">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modais */}
      <Modal open={modalVenda} onClose={() => { setModalVenda(false); setEditingVenda(null); }} title={editingVenda ? "Editar Venda" : "Registrar Venda Semanal"} size="lg">
        <VendaForm
          editing={editingVenda}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ["vendas"] });
            qc.invalidateQueries({ queryKey: ["resumo"] });
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

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        message={`Remover a venda da semana ${deleteTarget ? formatDate(deleteTarget.semana_inicio) : ""}?`}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
