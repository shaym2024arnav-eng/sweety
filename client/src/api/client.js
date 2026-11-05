const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'sweety_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Error carrying the server's message and the field it relates to. */
export class ApiError extends Error {
  constructor(message, status, field) {
    super(message);
    this.status = status;
    this.field = field;
  }
}

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is it running?', 0);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Expired/invalid session on a protected call -> log the user out
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(data.error || 'Something went wrong.', res.status, data.field);
  }
  return data;
}

export const api = {
  signup: (body) => request('/auth/signup', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),

  listReadings: ({ page = 1, limit = 20 } = {}) => request(`/readings?page=${page}&limit=${limit}`),
  createReading: (body) => request('/readings', { method: 'POST', body }),
  updateReading: (id, body) => request(`/readings/${id}`, { method: 'PUT', body }),
  deleteReading: (id) => request(`/readings/${id}`, { method: 'DELETE' }),

  reports: (date) => request(`/reports?date=${date}`),
  chart: (date) => request(`/reports/chart?date=${date}`),
};
