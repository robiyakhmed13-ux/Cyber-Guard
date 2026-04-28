import { createContext, useContext, useEffect, useState } from "react";
import { phase3Request } from "@/lib/phase3-api";

export type Phase3Role = "admin" | "analyst" | "viewer";

export interface Phase3User {
  id: number;
  username: string;
  role: Phase3Role;
}

interface StoredSession {
  token: string;
  user: Phase3User;
}

interface Phase3AuthContextValue {
  user: Phase3User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (username: string, password: string) => Promise<Phase3User>;
  loginWithRole: (role: Phase3Role) => Promise<Phase3User>;
  logout: () => void;
}

const STORAGE_KEY = "cyberguard-phase3-session";

const demoCredentials: Record<Phase3Role, { username: string; password: string }> = {
  admin: { username: "admin", password: "Admin123!" },
  analyst: { username: "analyst1", password: "Analyst123!" },
  viewer: { username: "viewer1", password: "Analyst123!" },
};

const Phase3AuthContext = createContext<Phase3AuthContextValue | undefined>(undefined);

export const Phase3AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Phase3User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredSession;
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsHydrated(true);
  }, []);

  const persistSession = (session: StoredSession | null) => {
    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setToken(null);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session.user);
    setToken(session.token);
  };

  const login = async (username: string, password: string) => {
    const response = await phase3Request<{ user: Phase3User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    const session = {
      user: response.data.user,
      token: response.data.token,
    };

    persistSession(session);
    return session.user;
  };

  const loginWithRole = (role: Phase3Role) => {
    const credentials = demoCredentials[role];
    return login(credentials.username, credentials.password);
  };

  const logout = () => {
    persistSession(null);
  };

  return (
    <Phase3AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isHydrated,
        login,
        loginWithRole,
        logout,
      }}
    >
      {children}
    </Phase3AuthContext.Provider>
  );
};

export const usePhase3Auth = () => {
  const context = useContext(Phase3AuthContext);
  if (!context) {
    throw new Error("usePhase3Auth must be used inside Phase3AuthProvider");
  }
  return context;
};
