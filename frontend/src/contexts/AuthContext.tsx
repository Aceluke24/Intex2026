import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { API_PREFIX, apiUrl } from "@/lib/apiBase";

interface User {
  email: string;
  userName: string;
  supporterId: number | null;
  roles: string[];
  mfaEnabled: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refetch: () => Promise<void>;
  isAdmin: boolean;
  isDonor: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await fetch(apiUrl(`${API_PREFIX}/auth/me`), { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
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
