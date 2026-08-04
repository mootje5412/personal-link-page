import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type User = {
  name: string;
  email: string;
  avatar?: string;
  provider: 'google' | 'email';
};

type AuthContextValue = {
  user: User | null;
  loginWithGoogle: (profile: { name: string; email: string; avatar?: string }) => void;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = 'geoloca_user';

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser);

  const persist = useCallback((next: User | null) => {
    setUser(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const loginWithGoogle = useCallback(
    (profile: { name: string; email: string; avatar?: string }) => {
      persist({
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        provider: 'google',
      });
    },
    [persist],
  );

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    await new Promise((r) => window.setTimeout(r, 500));
    if (!email.trim() || password.length < 6) {
      throw new Error('Invalid email or password.');
    }
    persist({
      name: email.split('@')[0] || 'User',
      email: email.trim().toLowerCase(),
      provider: 'email',
    });
  }, [persist]);

  const registerWithEmail = useCallback(async (name: string, email: string, password: string) => {
    await new Promise((r) => window.setTimeout(r, 600));
    if (!name.trim()) throw new Error('Please enter your name.');
    if (!email.trim()) throw new Error('Please enter your email.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    persist({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      provider: 'email',
    });
  }, [persist]);

  const logout = useCallback(() => persist(null), [persist]);

  const value = useMemo(
    () => ({ user, loginWithGoogle, loginWithEmail, registerWithEmail, logout }),
    [user, loginWithGoogle, loginWithEmail, registerWithEmail, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
