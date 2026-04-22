"use client";
import { useQuery } from "@tanstack/react-query";
import { jovensApi, eventosApi, financeiroApi } from "@/services/api";
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const { data: jovens = [] } = useQuery({ queryKey: ["jovens"], queryFn: () => jovensApi.listar() });
  const { data: eventos = [] } = useQuery({ queryKey: ["eventos"], queryFn: () => eventosApi.listar() });
  const { data: resumo } = useQuery({ queryKey: ["resumo-geral"], queryFn: () => financeiroApi.resumoCaixa() });

  const stats = [
    { label: "Jovens cadastrados", value: jovens.length, icon: Users, color: "bg-blue-500", href: "/jovens" },
    { label: "Eventos", value: eventos.length, icon: Calendar, color: "bg-purple-500", href: "/eventos" },
    { label: "Em caixa", value: resumo ? formatCurrency(resumo.total_caixa) : "R$ 0,00", icon: DollarSign, color: "bg-green-500", href: "/financeiro" },
    { label: "Jovens ativos", value: jovens.filter((j) => j.ativo).length, icon: TrendingUp, color: "bg-amber-500", href: "/jovens" },
  ];

  const proximosEventos = [...eventos]
    .filter((e) => new Date(e.data_evento) >= new Date())
    .sort((a, b) => new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime())
    .slice(0, 5);

  return (
    <div className="page">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="page-description">Bem-vindo ao sistema Jovens do Verbo - JDV</p>
      </div>

      <div className="stats-grid">
        {stats.map((s) => (
          <Link href={s.href} key={s.label}>
            <div className="card card--clickable">
              <div className="stat-card__content">
                <div className={`${s.color} stat-card__icon`}>
                  <s.icon className="stat-card__icon-svg" />
                </div>
                <div>
                  <p className="stat-card__value">{s.value}</p>
                  <p className="stat-card__label">{s.label}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2 className="section-title--base">Próximos Eventos</h2>
          {proximosEventos.length === 0 ? (
            <p className="empty-state">Nenhum evento próximo.</p>
          ) : (
            <ul className="dashboard-list">
              {proximosEventos.map((e) => (
                <li key={e.id} className="dashboard-list-item">
                  <div className="dashboard-list-item__icon">
                    <Calendar className="dashboard-list-item__icon-svg" />
                  </div>
                  <div>
                    <p className="dashboard-list-item__title">{e.nome}</p>
                    <p className="dashboard-list-item__subtitle">{formatDateTime(e.data_evento)}</p>
                    {e.local && <p className="dashboard-list-item__detail">{e.local}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="section-title--base">Resumo Financeiro</h2>
          {!resumo ? (
            <p className="empty-state">Nenhum dado financeiro registrado.</p>
          ) : (
            <ul className="dashboard-list">
              {[
                ["Total em caixa", resumo.total_caixa],
                ["Total em dinheiro", resumo.total_dinheiro],
                ["Total em pix", resumo.total_pix]
              ].map(([label, value]) => (
                <li key={label} className="dashboard-list-item--between">
                  <span className="dashboard-list-item__label">{label}</span>
                  <span className="dashboard-list-item__value">{formatCurrency(value as string)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
