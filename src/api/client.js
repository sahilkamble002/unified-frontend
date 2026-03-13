import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  clearAuth
} from "../utils/storage.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api/v1";

let refreshPromise = null;

const parseResponse = async (response) => {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const unwrapData = (payload) => {
  if (payload && Object.prototype.hasOwnProperty.call(payload, "data")) {
    return payload.data;
  }
  return payload;
};

const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    })
      .then(async (res) => {
        if (!res.ok) {
          return false;
        }
        const payload = await parseResponse(res);
        const token =
          payload?.data?.accessToken || payload?.accessToken || null;
        if (token) {
          setAccessToken(token);
          return true;
        }
        return false;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const apiRequest = async (
  path,
  options = {},
  config = { auth: true, retry: true }
) => {
  const { auth, retry } = config;
  const { method = "GET", headers = {}, body } = options;
  const finalHeaders = { ...headers };

  let finalBody = body;
  if (body && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
    finalBody = JSON.stringify(body);
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: finalBody
  });

  if (response.status === 401 && auth && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest(path, options, { auth: true, retry: false });
    }
    clearAuth();
  }

  const payload = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(payload?.message || "Request failed");
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  return unwrapData(payload);
};
