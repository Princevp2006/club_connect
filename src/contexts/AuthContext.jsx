import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "@/api";
import { tokenStore, UNAUTHORIZED_EVENT } from "@/api/apiClient";
const AuthCtx = createContext(null);
export function homeFor(role) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "STUDENT_LEADER") return "/leader/dashboard";
  return "/app";
}
const unwrapUser = (x) => x?.user ?? x;
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setUser(null);
      setStatus("anonymous");
      return;
    }
    try {
      const me = unwrapUser(await authApi.getMe());
      setUser(me);
      setStatus("authenticated");
    } catch {
      tokenStore.clear();
      setUser(null);
      setStatus("anonymous");
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setStatus("anonymous");
      qc.clear();
      toast.error("Your session has expired. Please sign in again.");
      navigate({ to: "/login", replace: true });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [navigate, qc]);
  const completeLogin = useCallback(async (token, u) => {
    tokenStore.set(token);
    const me = u ?? unwrapUser(await authApi.getMe());
    setUser(me);
    setStatus("authenticated");
    return me;
  }, []);
  const login = useCallback(
    async (email, password) => {
      const res = await authApi.login({ email, password });
      const token = res?.token ?? res?.accessToken ?? res?.jwt;
      if (!token) throw new Error("Login response did not include a token.");
      return completeLogin(token, res?.user ? unwrapUser(res.user) : undefined);
    },
    [completeLogin],
  );
  const logout = useCallback(async () => {
    await qc.cancelQueries();
    qc.clear();
    tokenStore.clear();
    setUser(null);
    setStatus("anonymous");
    navigate({ to: "/login", replace: true });
  }, [navigate, qc]);
  const value = useMemo(
    () => ({ user, status, login, completeLogin, logout, refresh }),
    [user, status, login, completeLogin, logout, refresh],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
