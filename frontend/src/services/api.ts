import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_URL: string = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const TOKEN_KEY = 'hl_token';
export const REFRESH_KEY = 'hl_refresh';
export const USER_KEY = 'hl_user';

// The store registers a listener so Redux (and the socket, which reads the token from Redux) picks up
// tokens obtained by a silent refresh. Kept as a callback to avoid an api -> store import cycle.
let onTokensRefreshed: ((token: string, refreshToken: string) => void) | null = null;
export const setTokensRefreshedListener = (fn: (token: string, refreshToken: string) => void): void => {
  onTokensRefreshed = fn;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const signOutLocally = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
};

// One refresh in flight at a time; concurrent 401s wait for it instead of each rotating the token
// (a second rotation of the same token would look like token theft and sign the user out).
let refreshing: Promise<string> | null = null;
const refreshAccessToken = (): Promise<string> => {
  if (!refreshing) {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    refreshing = (refreshToken
      ? axios.post(`${API_URL}/auth/refresh`, { refreshToken }, { withCredentials: true }).then((res) => {
          const { token, refreshToken: next } = res.data.data as { token: string; refreshToken: string };
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(REFRESH_KEY, next);
          onTokensRefreshed?.(token, next);
          return token;
        })
      : Promise.reject(new Error('No refresh token'))
    ).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
};

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/verify-email', '/auth/resend-verification', '/auth/refresh'];

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError<{ code?: string }>) => {
    const config = err.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const url = String(config?.url ?? '');
    // 401/403 from the auth endpoints are form errors (wrong password, bad code), not an expired session.
    if (!config || AUTH_ENDPOINTS.some((p) => url.includes(p))) return Promise.reject(err);

    if (err.response?.status === 403 && err.response.data?.code === 'ACCOUNT_SUSPENDED') {
      signOutLocally();
      return Promise.reject(err);
    }
    if (err.response?.status === 401 && !config._retried) {
      config._retried = true;
      try {
        const token = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
        return api(config);
      } catch {
        signOutLocally();
      }
    }
    return Promise.reject(err);
  }
);

export default api;
