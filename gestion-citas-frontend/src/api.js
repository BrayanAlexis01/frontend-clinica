/**
 * Adaptador de la API. IMPORTANTE: estas rutas son orientativas y deben contrastarse
 * contra /swagger-ui/index.html o /v3/api-docs del backend real antes de producción.
 * No se guardan datos médicos reales en el navegador.
 */
export const API_BASE = (import.meta.env.VITE_API_URL || 'https://sistema-gestion-citas.onrender.com').replace(/\/$/, '');
export const ROUTES = {
  login: '/api/auth/login',
  registro: '/api/auth/registro',
  especialidades: '/api/especialidades',
  medicos: '/api/medicos',
  citas: '/api/citas',
  disponibilidad: '/api/disponibilidad',
};
const TOKEN_KEY = 'acapulco_access_token';
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setToken = t => t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY);
export async function request(path, { method = 'GET', body, auth = true, ...options } = {}) {
  const token = getToken();
  const response = await fetch(API_BASE + path, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    ...options,
  });
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) throw new Error(typeof data === 'string' ? data : data?.message || data?.error || `Error HTTP ${response.status}`);
  return data;
}
export function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}
export const services = {
  login: body => request(ROUTES.login, { method: 'POST', body, auth: false }),
  registro: body => request(ROUTES.registro, { method: 'POST', body, auth: false }),
  especialidades: () => request(ROUTES.especialidades),
  medicos: () => request(ROUTES.medicos),
  citas: () => request(ROUTES.citas),
  crearCita: body => request(ROUTES.citas, { method: 'POST', body }),
  cancelar: id => request(`${ROUTES.citas}/${encodeURIComponent(id)}/cancelar`, { method: 'PATCH' }),
  reprogramar: (id, body) => request(`${ROUTES.citas}/${encodeURIComponent(id)}/reprogramar`, { method: 'PATCH', body }),
};
