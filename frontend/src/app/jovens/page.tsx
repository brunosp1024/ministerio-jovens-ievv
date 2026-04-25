"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jovensApi } from "@/services/api";
import { Jovem, JovemCreate, JovemUpdate } from "@/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DatePicker from "@/components/ui/DatePicker";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Toggle from "@/components/ui/Toggle";
import { Plus, Pencil, Trash2, Users, Search, Gift, Download } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { formatDate, calcularIdade, formatPhone } from "@/lib/utils";
import toast from "react-hot-toast";
import { Controller, useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";

export default function JovensPage() {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Jovem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Jovem | null>(null);

  const perfis = [
    { label: "Integrante", value: "integrante" },
    { label: "Liderança", value: "lideranca" },
    { label: "Diretoria", value: "diretoria" },
    { label: "Mídia", value: "midia" },
    { label: "Tesouraria", value: "tesouraria" }
  ]

  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  
  const { data: jovens = [], isLoading } = useQuery({
    queryKey: ["jovens"],
    queryFn: () => jovensApi.listar(),
  });

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<JovemCreate>();

  const createMutation = useMutation({
    mutationFn: jovensApi.criar,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["jovens"] }); toast.success("Jovem cadastrado!"); closeModal(); },
    onError: () => toast.error("Erro ao cadastrar jovem."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: JovemUpdate }) => jovensApi.atualizar(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["jovens"] }); toast.success("Jovem atualizado!"); closeModal(); },
    onError: () => toast.error("Erro ao atualizar jovem."),
  });

  const deleteMutation = useMutation({
    mutationFn: jovensApi.deletar,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["jovens"] }); toast.success("Jovem removido!"); setDeleteTarget(null); },
    onError: () => toast.error("Erro ao remover jovem."),
  });

  // Função para classificar faixa etária
  function faixaEtaria(idade: number): { label: string; color: string } {
    if (idade <= 13) return { label: "Pré-adolescente", color: "#10b981" };
    if (idade <= 17) return { label: "Adolescente", color: "#5054ff" };
    if (idade <= 25) return { label: "Jovem", color: "#f59e42" };
    if (idade <= 35) return { label: "Jovem adulto", color: "#3b327d" };
    return { label: "Mentor", color: "#6d28d9" };
  }

  // Função para exportar CSV
  function exportarCSV() {
    if (!jovens.length) return;
    const headers = [
      "ID",
      "Nome",
      "Perfil",
      "Telefone",
      "Data de Nascimento",
      "Idade",
      "Endereço",
      "Financeiro",
      "Status",
      "Foto URL"
    ];
    const rows = jovens.map((j) => [
      j.id,
      j.nome,
      j.perfil ?? "",
      j.telefone ?? "",
      formatDate(j.data_nascimento),
      j.endereco ?? "",
      j.habilitado_financeiro ? "Habilitado" : "Não habilitado",
      j.ativo ? "Ativo" : "Inativo",
      j.foto_url ?? ""

    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `jovens_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function openCreate() { reset({ perfil: "integrante" }); setEditing(null); setModalOpen(true); }
  function openEdit(j: Jovem) {
    setEditing(j);
    reset({
      nome: j.nome,
      telefone: j.telefone ?? "",
      data_nascimento: j.data_nascimento,
      endereco: j.endereco ?? "",
      habilitado_financeiro: j.habilitado_financeiro,
      ativo: j.ativo,
      foto_url: j.foto_url ?? "",
      perfil: j.perfil ?? "integrante"
    });
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditing(null); reset({}); }

  function onSubmit(data: JovemCreate) {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  }

  // Data de hoje no fuso local, ignorando horário
  const hoje = new Date();
  const hojeDia = hoje.getDate();
  const hojeMes = hoje.getMonth() + 1;
  
  const filtered = jovens.filter((j) =>
    j.nome.toLowerCase().includes(search.toLowerCase())
  );

  const aniversariantes = jovens.filter((j) => {
    // Garante que a comparação é feita apenas com dia e mês, sem problemas de fuso
    const [ano, mes, dia] = String(j.data_nascimento).split("-").map(Number);
    return mes === hojeMes && dia === hojeDia;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Users className="page-title__icon" /> Jovens</h1>
          <p className="page-subtitle">{jovens.length} {jovens.length === 1 ? "jovem cadastrado" : "jovens cadastrados"}</p>
        </div>
        {isAuthenticated && (
          <div className="flex gap-2">
            <Button onClick={openCreate}><Plus className="w-4 h-4" /> Novo Jovem</Button>
            <Button variant="outline" onClick={exportarCSV}><Download className="w-4 h-4" /> Exportar</Button>
          </div>
        )}
      </div>

      {aniversariantes.length > 0 && (
        <div className="alert-warning">
          <Gift className="alert-warning__icon" />
          <div>
            <p className="alert-warning__title">🎂 Aniversariante(s) hoje!</p>
            <p className="alert-warning__text">{aniversariantes.map((j) => j.nome).join(", ")}</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            className="search-input"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p className="loading-state">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="empty-state">Nenhum jovem encontrado.</p>
        ) : (
          <>
            {/* Mobile: Cards */}
            <div
              className="jovens-cards-list flex flex-col gap-4 md:hidden"
            >
              {filtered.map((j) => {
                const idade = calcularIdade(j.data_nascimento);
                const faixa = faixaEtaria(idade);
                return (
                  <div key={j.id} className="jovem-card">
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>

                      {/* Imagem perfil */}
                      {j.foto_url ? (
                        <img src={j.foto_url} alt={j.nome} className="image-jovem-card" />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 22 }}>
                          {j.nome.split(" ").filter(Boolean).slice(0, 2).map((n) => n.charAt(0).toUpperCase()).join("")}
                        </div>
                      )}

                      {/* Nome e perfil do jovem */}
                      <div style={{ display: "flex", flexDirection: "column", top: -4 }}>
                        <span style={{ fontWeight: 600, fontSize: 18 }}>{j.nome.split(" ").filter(Boolean).slice(0, 2).join(" ")}</span>
                        <span style={{ display: "inline-block", position: "relative", top: -4 }}>
                          <Badge bgColor="#fff" textColor="#0d1f3c" fontSize={10}>{perfis.find(p => p.value === j.perfil)?.label ?? '-'}</Badge>
                        </span>
                      </div>
                    </div>

                    {/* Informações adicionais + botões */}
                    <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 6, width: "100%" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontWeight: 600, color: "#64748b", fontSize: 12 }}>Aniversário:</span>
                          <span style={{ fontSize: 12, opacity: 0.7 }}>
                            {(() => {
                              const [ano, mes, dia] = String(j.data_nascimento).split("-").map(Number);
                              if (!ano || !mes || !dia) return "";
                              return `${dia} de ${meses[mes-1]} (${idade} anos)`;
                            })()}
                          </span>
                        </div>
                        {j.telefone && (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontWeight: 600, color: "#64748b", fontSize: 12 }}>Telefone:</span>
                            <span style={{ fontSize: 12, opacity: 0.7 }}>{j.telefone}</span>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontWeight: 600, color: "#64748b", fontSize: 12 }}>Faixa Etária:</span>
                          <Badge bgColor={faixa.color} textColor="#fff">{faixa.label}</Badge>
                        </div>
                      </div>
                      {isAuthenticated && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", justifyContent: "flex-start" }}>
                          <button onClick={() => openEdit(j)} className="action-btn action-btn--edit"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteTarget(j)} className="action-btn action-btn--delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: Tabela */}
            <div className="overflow-x-auto hidden md:block">
              <table className="data-table">
                <thead>
                  <tr className="data-table__head-row">
                    {[
                      "Nome",
                      <span key="Nascimento / Idades" style={{ whiteSpace: "nowrap" }}>Nascimento / Idade</span>,
                      "Telefone",
                      "Faixa Etária",
                      "Financeiro",
                      "Status",
                      ...(isAuthenticated ? ["Ações"] : [])
                    ].map((h) => (
                      <th key={typeof h === "string" ? h : h.key} className="data-table__head-cell">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="data-table__body">
                  {filtered.map((j) => {
                    const idade = calcularIdade(j.data_nascimento);
                    const faixa = faixaEtaria(idade);
                    return (
                      <tr key={j.id} className="data-table__row">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            {j.foto_url ? (
                              <img
                                src={j.foto_url}
                                alt={j.nome}
                                className="data-table__avatar"
                              />
                            ) : (
                              <div className="data-table__avatar data-table__avatar--blue">
                                {j.nome.split(" ").filter(Boolean).slice(0, 2).map((n) => n.charAt(0).toUpperCase()).join("")}
                              </div>
                            )}
                            <div>
                              <p className="jovem__name">{j.nome.split(" ").filter(Boolean).slice(0, 2).join(" ")}</p>
                              <Badge bgColor="#fff" textColor="#0d1f3c" fontSize={10}>{perfis.find(p => p.value === j.perfil)?.label ?? '-'}</Badge>
                            </div>
                          </div>
                        </td>
                        <td className="data-table__cell">
                          {formatDate(j.data_nascimento)} <br />
                          <span className="jovem__age">({idade} anos)</span>
                        </td>
                        <td className="data-table__cell">
                          {j.telefone && <p className="jovem__telefone">{formatPhone(j.telefone)}</p>}
                        </td>
                        <td className="py-3 pr-4" style={{ whiteSpace: "nowrap" }}>
                          <Badge bgColor={faixa.color} textColor="#fff">{faixa.label}</Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`jovem__financeiro ${j.habilitado_financeiro ? "badge-green" : "badge-red"}`}>
                            {j.habilitado_financeiro ? "Habilitado" : "Não habilitado"}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={j.ativo ? "badge-green" : "badge-red"}>{j.ativo ? "Ativo" : "Inativo"}</span>
                        </td>
                        {isAuthenticated && (
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEdit(j)} className="action-btn action-btn--edit"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => setDeleteTarget(j)} className="action-btn action-btn--delete"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal cadastro/edição */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? "Editar Jovem" : "Novo Jovem"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-group" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8 }}>
              <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <img
                  src={editing?.foto_url ?? "img/default-avatar.png"}
                  alt="Foto do jovem"
                  style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "2px solid #cbd5e1", boxShadow: "0 4px 16px 0 rgba(0,0,0,0.18)" }}
                />

                {/* Sombra oval abaixo da imagem */}
                <div style={{
                  width: 80,
                  height: 16,
                  background: "rgba(0,0,0,0.15)",
                  borderRadius: "50%",
                  marginTop: 0,
                  filter: "blur(1.5px)",
                  zIndex: 0
                }} />
              
              </div>
            </div>
          </div>
          <Input label="Nome completo *" {...register("nome", { required: "Nome é obrigatório" })} error={errors.nome?.message} placeholder="Ex: João da Silva" />
          <Controller
            control={control}
            name="data_nascimento"
            rules={{ required: "Data é obrigatória" }}
            render={({ field }) => (
              <DatePicker
                label="Data de nascimento *"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                error={errors.data_nascimento?.message}
                placeholder="Escolha a data"
              />
            )}
          />
          <div className="form-grid-2">
            <Controller
              control={control}
              name="perfil"
              render={({ field }) => (
                <Select
                  label="Perfil"
                  value={field.value ?? "integrante"}
                  onChange={e => field.onChange(e.target.value)}
                  onBlur={field.onBlur}
                  name={field.name}
                  error={errors.perfil?.message}
                  options={perfis}
                />
              )}
            />
            <Controller
              control={control}
              name="telefone"
              render={({ field }) => (
                <Input
                  label="Telefone"
                  placeholder="(83) 99999-9999"
                  value={formatPhone(field.value ?? "")}
                  onChange={e => field.onChange(e.target.value.replace(/\D/g, ""))}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              )}
            />
          </div>
          <Input label="Endereço" {...register("endereco")} placeholder="Rua, número, bairro" />
          <div className="form-grid-2">
            <Controller
              control={control}
              name="habilitado_financeiro"
              render={({ field }) => (
                <Toggle
                  label="Habilitado financeiro"
                  checked={!!field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="ativo"
              render={({ field }) => (
                <Toggle
                  label="Status (Ativo)"
                  checked={field.value !== false}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="form-actions">
            <Button variant="outline" type="button" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        message={`Tem certeza que deseja remover "${deleteTarget?.nome}"? Esta ação não pode ser desfeita.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
