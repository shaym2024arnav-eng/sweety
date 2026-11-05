import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Restore the session on page load if a token is saved
  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) return;
    api
      .me()
      .then(({ user: me }) => setUser(me))
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout]);

  const handleAuth = useCallback(({ user: u, token }) => {
    tokenStore.set(token);
    setUser(u);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login: async (body) => handleAuth(await api.login(body)),
      signup: async (body) => handleAuth(await api.signup(body)),
      logout,
    }),
    [user, loading, handleAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
