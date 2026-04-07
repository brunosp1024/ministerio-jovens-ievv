"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { authApi } from "@/services/api";
import { clearAuthSession, loadAuthSession, saveAuthSession } from "@/lib/auth";
import type { AuthSession, LoginPayload } from "@/types";

interface AuthContextValue {
  isAuthenticated: boolean;
  isReady: boolean;
  user: AuthSession["user"] | null;
  loginOpen: boolean;
  loginLoading: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  login: (payload: LoginPayload) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const storedSession = loadAuthSession();
    if (!storedSession) {
      setIsReady(true);
      return;
    }

    authApi.me()
      .then((user) => {
        const nextSession = {
          ...storedSession,
          user,
        };
        saveAuthSession(nextSession);
        setSession(nextSession);
      })
      .catch(() => {
        clearAuthSession();
        setSession(null);
      })
      .finally(() => setIsReady(true));
  }, []);

  async function login(payload: LoginPayload) {
    setLoginLoading(true);
    try {
      const nextSession = await authApi.login(payload);
      saveAuthSession(nextSession);
      setSession(nextSession);
      setLoginOpen(false);
      toast.success("Login realizado.");
      return true;
    } catch {
      toast.error("Usuário ou senha inválidos.");
      return false;
    } finally {
      setLoginLoading(false);
    }
  }

  function logout() {
    clearAuthSession();
    setSession(null);
    toast.success("Sessão encerrada.");
  }

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: !!session,
    isReady,
    user: session?.user ?? null,
    loginOpen,
    loginLoading,
    openLogin: () => setLoginOpen(true),
    closeLogin: () => setLoginOpen(false),
    login,
    logout,
  }), [isReady, loginLoading, loginOpen, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}