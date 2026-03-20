import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.js";
import { disableWebPush, initializeWebPush } from "../lib/web-push.js";
import {
  clearAuth,
  getRefreshToken,
  getStoredUser,
  setAccessToken,
  setRefreshToken,
  setStoredUser
} from "../utils/storage.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    initializeWebPush().catch(() => {
      // best-effort registration; app should continue if push setup fails
    });

    return undefined;
  }, [user]);

  const login = async (payload) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(payload);
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
      }
      if (data?.refreshToken) {
        setRefreshToken(data.refreshToken);
      }
      if (data?.user) {
        setStoredUser(data.user);
        setUser(data.user);
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload) => {
    setIsLoading(true);
    try {
      return await authApi.register(payload);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();
    try {
      await disableWebPush();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // ignore logout errors
    } finally {
      clearAuth();
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
