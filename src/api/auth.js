import { apiRequest } from "./client.js";

export const login = (payload) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: payload
  }, { auth: false, retry: false });

export const register = (payload) =>
  apiRequest("/users/register", {
    method: "POST",
    body: payload
  }, { auth: false, retry: false });

export const logout = (refreshToken) =>
  apiRequest("/auth/logout", {
    method: "POST",
    body: { refreshToken }
  }, { auth: false, retry: false });
