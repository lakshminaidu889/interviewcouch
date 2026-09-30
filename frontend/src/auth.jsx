import { createContext, useContext, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const save = (t) => {
    localStorage.setItem("token", t);
    setToken(t);
  };

  const login = async (email, password) => {
    const data = await api("/api/auth/login", { method: "POST", body: { email, password } });
    save(data.access_token);
  };

  const register = async (email, password) => {
    await api("/api/auth/register", { method: "POST", body: { email, password } });
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
