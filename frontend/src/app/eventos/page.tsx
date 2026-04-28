"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventosApi } from "@/services/api";
import { Evento, EventoCreate } from "@/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import DatePicker from "@/components/ui/DatePicker";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import { Calendar, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { Controller, useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { anoAtual } from "@/lib/utils";

export default function EventosPage() {
  const qc = useQueryClient();
  const { isAuthenticated, openLogin, user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Evento | null>(null);
  const [ano, setAno] = useState<number>(anoAtual());

  // Gera lista de anos para o filtro (exibe últimos 5 anos)
  const anos = Array.from({ length: 5 }, (_, i) => anoAtual() - i);

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: ["eventos", ano],
    queryFn: () => eventosApi.listar(ano),
  });

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<EventoCreate>();

  const createMut = useMutation({
    mutationFn: eventosApi.criar,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["eventos"] }); toast.success("Evento criado!"); closeModal(); },
    onError: () => toast.error("Erro ao criar evento."),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EventoCreate> }) => eventosApi.atualizar(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["eventos"] }); toast.success("Evento atualizado!"); closeModal(); },
    onError: () => toast.error("Erro ao atualizar evento."),
  });

  const deleteMut = useMutation({
    mutationFn: eventosApi.deletar,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["eventos"] }); toast.success("Evento removido!"); setDeleteTarget(null); },
    onError: () => toast.error("Erro ao remover evento."),
  });

  function openCreate() { reset({ ativo: true }); setEditing(null); setModalOpen(true); }
  function openEdit(e: Evento) {
    setEditing(e);
    reset({
      nome: e.nome,
      descricao: e.descricao,
      data_evento: e.data_evento.slice(0, 16),
      local: e.local,
      ativo: typeof e.ativo === "string" ? e.ativo === "true" : !!e.ativo
    });
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditing(null); reset({}); }
  function onSubmit(data: EventoCreate) {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  }

  const futuros = eventos
    .filter((e) => new Date(e.data_evento) >= new Date())
    .sort((a, b) => Number(new Date(a.data_evento)) - Number(new Date(b.data_evento)));

  const passados = eventos
    .filter((e) => new Date(e.data_evento) < new Date())
    .sort((a, b) => Number(new Date(b.data_evento)) - Number(new Date(a.data_evento)));

  function requireAuth(action: () => void) {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    action();
  }

  function EventoCard({ evento }: { evento: Evento }) {
    const passado = new Date(evento.data_evento) < new Date();
    return (
      <div className="card card--hover">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="evento-card__badges">
              <span className={passado ? "badge-red" : "badge-green"}>{passado ? "Realizado" : "Próximo"}</span>
              {!evento.ativo && <span className="badge-red">Inativo</span>}
            </div>
            <h3 className="evento-card__title">{evento.nome}</h3>
            {evento.descricao && <p className="evento-card__description">{evento.descricao}</p>}
            <div className="evento-card__meta">
              <span className="evento-card__meta-item"><Calendar className="evento-card__meta-icon" />{formatDate(evento.data_evento)}</span>
              {evento.local && <span className="evento-card__meta-item"><MapPin className="evento-card__meta-icon" />{evento.local}</span>}
            </div>
          </div>
          {user?.role === "admin" && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => requireAuth(() => openEdit(evento))} className="action-btn action-btn--edit"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => requireAuth(() => setDeleteTarget(evento))} className="action-btn action-btn--delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Calendar className="page-title__icon" /> Eventos</h1>
          <p className="page-subtitle">{eventos.length} {eventos.length === 1 ? "evento cadastrado" : "eventos cadastrados"}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Select
            value={ano}
            onChange={e => setAno(Number(e.target.value))}
            options={anos.map(a => ({ label: String(a), value: a }))}
            style={{ minWidth: 100 }}
          />
          {user?.role === "admin" && (
            <Button onClick={() => requireAuth(openCreate)}><Plus className="w-4 h-4" /> Novo Evento</Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="loading-state--lg">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {futuros.length > 0 && (
            <div>
              <h2 className="section-title">Próximos eventos ({futuros.length})</h2>
              <div className="cards-grid">
                {futuros.map((e) => <EventoCard key={e.id} evento={e} />)}
              </div>
            </div>
          )}
          {passados.length > 0 && (
            <div>
              <h2 className="section-title">Eventos realizados ({passados.length})</h2>
              <div className="cards-grid">
                {passados.map((e) => <EventoCard key={e.id} evento={e} />)}
              </div>
            </div>
          )}
          {eventos.length === 0 && <p className="loading-state--lg">Nenhum evento cadastrado.</p>}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editing ? "Editar Evento" : "Novo Evento"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome do evento *" {...register("nome", { required: "Nome é obrigatório" })} error={errors.nome?.message} placeholder="Ex: Culto de Jovens" />
          <Controller
            control={control}
            name="data_evento"
            rules={{ required: "Data é obrigatória" }}
            render={({ field }) => (
              <DatePicker
                label="Data e hora *"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                error={errors.data_evento?.message}
                placeholder="Escolha uma data"
              />
            )}
          />
          <Input label="Local" {...register("local")} placeholder="Ex: Igreja Sede" />
          <Textarea label="Descrição" {...register("descricao")} placeholder="Descreva o evento..." />
          <Select
            label="Status"
            defaultValue="true"
            {...register("ativo", { setValueAs: (v) => v === "true" ? true : v === "false" ? false : v })}
            options={[
              { label: "Ativo", value: "true" },
              { label: "Inativo", value: "false" }
            ]}
          />
          <div className="form-actions">
            <Button variant="outline" type="button" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" loading={createMut.isPending || updateMut.isPending}>{editing ? "Salvar" : "Criar Evento"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        message={`Remover o evento "${deleteTarget?.nome}"?`}
        loading={deleteMut.isPending}
      />
    </div>
  );
}
