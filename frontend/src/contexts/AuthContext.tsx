import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { API_PREFIX } from "@/lib/apiBase";
import { apiFetchJson, ApiHttpError } from "@/lib/apiFetch";

interface User {
  id: string;
  email: string;
  userName: string;
  supporterId: number | null;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  mfaEnabled: boolean;
}

type AuthMeResponse = User | { user: User | null };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refetch: () => Promise<User | null>;
  isAdmin: boolean;
  isDonor: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async (): Promise<User | null> => {
    try {
      const data = await apiFetchJson<AuthMeResponse>(`${API_PREFIX}/auth/me`, { timeoutMs: 10000 });
      const resolvedUser = "user" in data ? data.user : data;
      setUser(resolvedUser);
      return resolvedUser;
    } catch (error) {
      if (error instanceof ApiHttpError && (error.status === 401 || error.status === 403)) {
        console.warn("[AuthContext] Session not authenticated for /api/auth/me.");
      } else {
        console.error("[AuthContext] Failed to fetch /api/auth/me", error);
      }
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMe(); }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      refetch: fetchMe,
      isAdmin: user?.roles.includes("Admin") ?? false,
      isDonor: user?.roles.includes("Donor") ?? false,
      isAuthenticated: user !== null,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
