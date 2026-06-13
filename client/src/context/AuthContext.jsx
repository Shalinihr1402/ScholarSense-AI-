import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("scholarsense_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("scholarsense_token")));

  useEffect(() => {
    const token = localStorage.getItem("scholarsense_token");

    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .me()
      .then((data) => {
        setUser(data.user);
        localStorage.setItem("scholarsense_user", JSON.stringify(data.user));
      })
      .catch(() => {
        localStorage.removeItem("scholarsense_token");
        localStorage.removeItem("scholarsense_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const data = await authApi.login(credentials);
    localStorage.setItem("scholarsense_token", data.token);
    localStorage.setItem("scholarsense_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await authApi.register(payload);
    localStorage.setItem("scholarsense_token", data.token);
    localStorage.setItem("scholarsense_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("scholarsense_token");
    localStorage.removeItem("scholarsense_user");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
