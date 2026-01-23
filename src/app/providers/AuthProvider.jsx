import React from "react";
import { authStore } from "../stores/authStore";

const AuthContext = React.createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = React.useState(authStore.getState());

  React.useEffect(() => {
    let isMounted = true;
    authStore.hydrate().then(() => {
      if (!isMounted) return;
      setAuth(authStore.getState());
    });
    const unsub = authStore.subscribe((s) => setAuth(s));
    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const refreshProfile = React.useCallback(() => authStore.hydrate(), []);

  const value = React.useMemo(
    () => ({ auth, authStore, refreshProfile }),
    [auth, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
