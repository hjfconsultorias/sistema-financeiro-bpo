import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "../lib/trpc";
import type { SystemUser } from "../../../drizzle/schema";

// Tipo parcial do usuário retornado pelo login
type LoginUser = Pick<SystemUser, 'id' | 'name' | 'email' | 'profile'>;

interface AuthContextType {
  user: LoginUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: LoginUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Verifica se há token armazenado ao carregar
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
      } catch (error) {
        console.error("Erro ao recuperar dados do usuário:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  // Configura o token no header das requisições tRPC
  useEffect(() => {
    if (token) {
      // O token será enviado automaticamente pelo tRPC client
      // através do header Authorization: Bearer <token>
    }
  }, [token]);

  const login = (newToken: string, userData: LoginUser) => {
    localStorage.setItem("authToken", newToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
