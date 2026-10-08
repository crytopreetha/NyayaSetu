import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { authApi, AuthUser, ApiError } from '../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  loginCitizen: (email: string, password: string) => Promise<void>;
  loginLawyer: (email: string, password: string) => Promise<void>;
  registerCitizen: (data: RegisterCitizenInput) => Promise<void>;
  registerLawyer: (data: RegisterLawyerInput) => Promise<void>;
  logout: () => void;
}

export interface RegisterCitizenInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  preferredLanguage?: string;
}

export interface RegisterLawyerInput extends RegisterCitizenInput {
  barCouncilNumber: string;
  bio?: string;
  specialization?: string[];
  experienceYears?: number;
  city: string;
  state: string;
  languagesSpoken?: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'nyayasetu_token';
const USER_KEY = 'nyayasetu_user';

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(() => {
    // Hydrate from localStorage on first render
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userJson = localStorage.getItem(USER_KEY);
      const user = userJson ? (JSON.parse(userJson) as AuthUser) : null;
      return { token, user, isAuthenticated: !!token && !!user, isLoading: false };
    } catch {
      return { token: null, user: null, isAuthenticated: false, isLoading: false };
    }
  });

  // Validate token on mount (in case it expired)
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return;

    setState((s) => ({ ...s, isLoading: true }));
    authApi
      .getProfile()
      .then((profile) => {
        const user = profile as AuthUser;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setState({
          token: stored,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      })
      .catch(() => {
        // Token invalid or expired — clear session
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState({ token: null, user: null, isAuthenticated: false, isLoading: false });
      });
  }, []);

  const persist = useCallback((token: string, user: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ token, user, isAuthenticated: true, isLoading: false });
  }, []);

  const loginCitizen = useCallback(async (email: string, password: string) => {
    const { token, user } = await authApi.login(email, password);
    if (user.role !== 'CITIZEN') {
      throw new ApiError(403, 'This login portal is for citizens only. Please use the Lawyer Portal.');
    }
    persist(token, user);
  }, [persist]);

  const loginLawyer = useCallback(async (email: string, password: string) => {
    const { token, user } = await authApi.login(email, password);
    if (user.role !== 'LAWYER') {
      throw new ApiError(403, 'This login portal is for lawyers only. Please use the Citizen Portal.');
    }
    persist(token, user);
  }, [persist]);

  const registerCitizen = useCallback(async (data: RegisterCitizenInput) => {
    const { token, user } = await authApi.registerCitizen(data);
    persist(token, user);
  }, [persist]);

  const registerLawyer = useCallback(async (data: RegisterLawyerInput) => {
    const { token, user } = await authApi.registerLawyer(data);
    persist(token, user);
  }, [persist]);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ token: null, user: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, loginCitizen, loginLawyer, registerCitizen, registerLawyer, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
};
