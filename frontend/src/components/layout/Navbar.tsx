"use client";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Menu, Bell, Lock, LogIn, LogOut, CheckCheck } from "lucide-react";
import { notificacoesApi } from "@/services/api";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { LoginPayload } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

interface Props {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const { isAuthenticated, user, loginOpen, loginLoading, openLogin, closeLogin, login, logout } = useAuth();
  const { register, handleSubmit, reset } = useForm<LoginPayload>();

  const { data: count } = useQuery({
    queryKey: ["notificacoes-count"],
    queryFn: notificacoesApi.countNaoLidas,
    refetchInterval: 60_000,
  });

  const { data: notificacoes = [] } = useQuery({
    queryKey: ["notificacoes", open],
    queryFn: () => notificacoesApi.listar(),
    enabled: open,
  });

  const marcarLida = useMutation({
    mutationFn: notificacoesApi.marcarLida,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notificacoes"] });
      qc.invalidateQueries({ queryKey: ["notificacoes-count"] });
    },
  });

  const marcarTodas = useMutation({
    mutationFn: notificacoesApi.marcarTodasLidas,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notificacoes"] });
      qc.invalidateQueries({ queryKey: ["notificacoes-count"] });
    },
  });

  // Fechar ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function onSubmit(data: LoginPayload) {
    const ok = await login(data);
    if (ok) {
      reset({ username: "", password: "" });
    }
  }

  return (
    <>
      <header className="navbar">
        <button
          onClick={onMenuClick}
          className="navbar__menu-btn"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden lg:block">
          <p className="navbar__title">Ministério de Jovens — Verbo da Vida</p>
        </div>

        <div className="navbar__actions">
          <div className="navbar__status-badge">
            <Lock className="navbar__status-icon" />
            {isAuthenticated ? `Logado como ${user?.username}` : "Modo leitura"}
          </div>

          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="navbar__bell-btn"
              aria-label="Notificações"
            >
              <Bell className="navbar__bell-icon" />
              {(count?.count ?? 0) > 0 && (
                <span className="navbar__bell-count">
                  {count!.count > 99 ? "99+" : count!.count}
                </span>
              )}
            </button>

            {open && (
              <div className="notifications">
                <div className="notifications__header">
                  <h3 className="notifications__title">Notificações</h3>
                  {isAuthenticated && notificacoes.some((n) => !n.lida) && (
                    <button
                      onClick={() => marcarTodas.mutate()}
                      className="notifications__mark-all"
                    >
                      <CheckCheck className="notifications__mark-all-icon" /> Marcar todas como lidas
                    </button>
                  )}
                </div>

                {!isAuthenticated && (
                  <div className="notifications__warning">
                    Entre com sua conta para marcar notificações como lidas.
                  </div>
                )}

                <ul className="notifications__list">
                  {notificacoes.length === 0 && (
                    <li className="notifications__empty">
                      Nenhuma notificação
                    </li>
                  )}
                  {notificacoes.map((n) => (
                    <li
                      key={n.id}
                      className={cn(
                        "notifications__item",
                        isAuthenticated ? "notifications__item--clickable" : "cursor-default",
                        !n.lida && "notifications__item--unread"
                      )}
                      onClick={() => isAuthenticated && !n.lida && marcarLida.mutate(n.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="notifications__item-title">{n.titulo}</p>
                          <p className="notifications__item-message">{n.mensagem}</p>
                          <p className="notifications__item-time">{formatDateTime(n.created_at)}</p>
                        </div>
                        {!n.lida && (
                          <span className="notifications__unread-dot" />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" /> Sair
            </Button>
          ) : (
            <Button size="sm" onClick={openLogin}>
              <LogIn className="w-4 h-4" /> Entrar
            </Button>
          )}
        </div>
      </header>

      <Modal open={loginOpen} onClose={closeLogin} title="Entrar para editar" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="navbar__login-info">
            O sistema continua aberto para consulta. Criação, edição e outras alterações exigem login.
          </div>
          <Input label="Usuário" {...register("username", { required: true })} placeholder="admin" />
          <Input label="Senha" type="password" {...register("password", { required: true })} placeholder="••••••••" />
          <div className="form-actions">
            <Button variant="outline" type="button" onClick={closeLogin}>Cancelar</Button>
            <Button type="submit" loading={loginLoading}>Entrar</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
