import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("electrostock_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("electrostock_token");
    if (!token) {
      setLoading(false);
      return;
    }

    apiClient
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.data);
        localStorage.setItem("electrostock_user", JSON.stringify(res.data.data));
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem("electrostock_token");
        localStorage.removeItem("electrostock_user");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const res = await apiClient.post("/auth/login", { email, password });
    const { token, user: loggedInUser } = res.data.data;
    localStorage.setItem("electrostock_token", token);
    localStorage.setItem("electrostock_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }

  function logout() {
    localStorage.removeItem("electrostock_token");
    localStorage.removeItem("electrostock_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
