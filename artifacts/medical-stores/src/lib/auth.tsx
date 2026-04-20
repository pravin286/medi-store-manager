import { createContext, useContext, useEffect, useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import type { UserResponse } from "@workspace/api-client-react";

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  login: (token: string, user: UserResponse) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("authToken");
  });
  
  const [user, setUser] = useState<UserResponse | null>(() => {
    const savedUser = localStorage.getItem("authUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const { data: me, isLoading: isMeLoading } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  useEffect(() => {
    if (me) {
      setUser(me);
      localStorage.setItem("authUser", JSON.stringify(me));
    }
  }, [me]);

  const login = (newToken: string, newUser: UserResponse) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("authToken", newToken);
    localStorage.setItem("authUser", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
  };

  const isLoading = !!token && isMeLoading;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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
