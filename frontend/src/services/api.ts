import axios from 'axios';

export const API_URL: string = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hl_token');
      localStorage.removeItem('hl_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
