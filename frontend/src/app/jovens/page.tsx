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
import { Plus, Pencil, Trash2, Users, Search, Gift } from "lucide-react";
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

  function openCreate() { reset({}); setEditing(null); setModalOpen(true); }
  function openEdit(j: Jovem) {
    setEditing(j);
    reset({
      nome: j.nome, email: j.email ?? "", telefone: j.telefone ?? "",
      data_nascimento: j.data_nascimento, endereco: j.endereco ?? "",
      habilitado_financeiro: j.habilitado_financeiro, ativo: j.ativo,
    });
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditing(null); reset({}); }

  function onSubmit(data: JovemCreate) {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  }

  const hoje = new Date();
  const filtered = jovens.filter((j) =>
    j.nome.toLowerCase().includes(search.toLowerCase()) ||
    (j.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const aniversariantes = jovens.filter((j) => {
    const d = new Date(j.data_nascimento);
    return d.getMonth() === hoje.getMonth() && d.getDate() === hoje.getDate();
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Users className="page-title__icon" /> Jovens</h1>
          <p className="page-subtitle">{jovens.length} {jovens.length === 1 ? "jovem cadastrado" : "jovens cadastrados"}</p>
        </div>
        {isAuthenticated && (
          <Button onClick={openCreate}><Plus className="w-4 h-4" /> Novo Jovem</Button>
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
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p className="loading-state">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="empty-state">Nenhum jovem encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr className="data-table__head-row">
                  {["Nome", "Nascimento / Idade", "Telefone", "Financeiro", "Status", ...(isAuthenticated ? ["Ações"] : [])].map((h) => (
                    <th key={h} className="data-table__head-cell">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="data-table__body">
                {filtered.map((j) => (
                  <tr key={j.id} className="data-table__row">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="data-table__avatar data-table__avatar--blue">
                          {j.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="jovem__name">{j.nome}</p>
                          {j.email && <p className="jovem__email">{j.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="data-table__cell">{formatDate(j.data_nascimento)} <span className="jovem__age">({calcularIdade(j.data_nascimento)} anos)</span></td>
                    <td className="data-table__cell">{j.telefone ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <span className={j.habilitado_financeiro ? "badge-green" : "badge-red"}>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal cadastro/edição */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? "Editar Jovem" : "Novo Jovem"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Input label="E-mail" {...register("email")} type="email" placeholder="joao@email.com" />
            <Controller
              control={control}
              name="telefone"
              render={({ field }) => (
                <Input
                  label="Telefone"
                  placeholder="(83) 99999-9999"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(formatPhone(e.target.value))}
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
