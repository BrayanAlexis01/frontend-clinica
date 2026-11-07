export const API_BASE = (import.meta.env.VITE_API_URL || 'https://sistema-gestion-citas.onrender.com').replace(/\/$/, '');
export const ROUTES = {
  login: '/api/auth/login',
  registro: '/api/auth/register',
  especialidades: '/api/especialidades',
  medicos: '/api/medicos',
  medicosDisponibles: '/api/medicos/disponibles',
  citas: '/api/citas',
  misCitas: '/api/citas/mis-citas',
  disponibilidad: '/api/citas/disponibilidad',
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
  if (!response.ok || data?.success === false) throw new Error(typeof data === 'string' ? data : data?.message || data?.error || `Error HTTP ${response.status}`);
  return data && typeof data === 'object' && 'data' in data ? data.data : data;
}
export function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.contenido)) return data.contenido;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}
export function asAvailableTimes(data) {
  const source = Array.isArray(data) ? data : [
    data?.horariosDisponibles, data?.horasDisponibles, data?.slotsDisponibles,
    data?.availableSlots, data?.disponibilidad, data?.content
  ].find(Array.isArray);
  if (!source) return [];
  const times = source.filter(item => {
    if (typeof item === 'string') return true;
    if (!item || typeof item !== 'object') return false;
    if (item.disponible === false || item.available === false || item.ocupado === true || item.reservado === true || item.activo === false) return false;
    if (item.estado && !['DISPONIBLE', 'LIBRE', 'AVAILABLE'].includes(String(item.estado).toUpperCase())) return false;
    return true;
  }).map(item => {
    const value = typeof item === 'string' ? item : item.hora ?? item.horaInicio ?? item.hora_inicio ?? item.inicio ?? item.fechaHora;
    if (typeof value !== 'string') return '';
    const match = value.match(/(?:^|T)(\d{2}):(\d{2})(?::\d{2})?/);
    return match && Number(match[1]) < 24 && Number(match[2]) < 60 ? match[1] + ':' + match[2] : '';
  }).filter(Boolean);
  return [...new Set(times)].sort();
}
export const services = {
  login: body => request(ROUTES.login, { method: 'POST', body, auth: false }),
  registro: body => request(ROUTES.registro, { method: 'POST', body, auth: false }),
  especialidades: () => request(ROUTES.especialidades),
  medicos: () => request(ROUTES.medicos + '?pagina=0&tamano=100'),
  medicosDisponibles: especialidadId => request(ROUTES.medicosDisponibles + '?especialidadId=' + encodeURIComponent(especialidadId)),
  disponibilidad: (medicoId, fecha) => request(ROUTES.disponibilidad + '?medicoId=' + encodeURIComponent(medicoId) + '&fecha=' + encodeURIComponent(fecha) + '&soloLibres=true'),
  citas: () => request(ROUTES.misCitas + '?pagina=0&tamano=100'),
  crearCita: body => request(ROUTES.citas, { method: 'POST', body: {
    medicoId: Number(body.medicoId),
    fechaHora: body.fecha + 'T' + body.hora + ':00',
    tipo: 'CONSULTA',
    motivo: body.motivo || undefined
  } }),
  cancelar: (id, motivo) => request(ROUTES.citas + '/' + encodeURIComponent(id) + '/cancelar', { method: 'PATCH', body: { motivo } }),
  reprogramar: (id, body) => request(ROUTES.citas + '/' + encodeURIComponent(id) + '/reprogramar', { method: 'PATCH', body: { nuevaFechaHora: body.fecha + 'T' + body.hora + ':00' } }),
};
