"use client";
import { useState } from "react";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth } from "@/contexts/AuthContext";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { LogIn } from "lucide-react";
import { useForm } from "react-hook-form";


export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isReady, loginOpen, openLogin, closeLogin, login } = useAuth();
  const { register, handleSubmit, formState: { errors }, setError } = useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isReady) return null;

  async function onSubmit(data: any) {
    setLoading(true);
    setErrorMsg("");
    const ok = await login(data);
    if (!ok) setErrorMsg("Usuário ou senha inválidos");
    setLoading(false);
  }

  if (!isAuthenticated) {
    return (
      <Modal open={true} onClose={() => {}} title="Bem-vindo ao <JDV>">
        <form onSubmit={handleSubmit(onSubmit)}
          style={{
            minWidth: 340,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            padding: 12
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <img
              src="/img/logo-512.png"
              alt="Logo JDV"
              style={{ width: 54, height: 54, objectFit: 'contain', marginBottom: 4, borderRadius: 12, boxShadow: '0 2px 12px #e0e7ff' }}
            />
            <h2 style={{ fontWeight: 800, fontSize: 26, color: '#1e3a8a', letterSpacing: -1 }}>Acesse o sistema</h2>
            <span style={{ color: '#3b82f6', fontWeight: 500, fontSize: 15 }}>Ministério de Jovens</span>
          </div>
          <Input
            label="Usuário"
            placeholder="Seu usuário"
            autoFocus
            {...register("username", { required: true })}
            error={errors.username && "Campo obrigatório"}
            style={{ fontSize: 18 }}
          />
          <Input
            label="Senha"
            placeholder="Sua senha"
            type="password"
            {...register("password", { required: true })}
            error={errors.password && "Campo obrigatório"}
            style={{ fontSize: 18 }}
          />
          {errorMsg && <span style={{ color: '#ef4444', fontWeight: 500 }}>{errorMsg}</span>}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            style={{ width: '100%', fontSize: 18, marginTop: 8, background: 'linear-gradient(90deg,#1e3a8a,#3b82f6)', border: 'none', color: '#fff', borderRadius: 8 }}
          >
            Entrar
          </Button>
          <span style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>Powered by Verbo da Vida</span>
        </form>
      </Modal>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-shell__content">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  );
}
