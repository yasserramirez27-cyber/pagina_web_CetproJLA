/**
 * Cliente de la API para el panel.
 * Envía siempre la cabecera anti-CSRF y redirige al login si la sesión venció.
 */

export async function api(ruta, { metodo = 'GET', datos, formData } = {}) {
  const opciones = {
    method: metodo,
    credentials: 'same-origin',
    headers: { 'X-Requested-With': 'cetpro-admin' },
  };
  if (formData) {
    opciones.body = formData;
  } else if (datos !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(datos);
  }

  let resp;
  try {
    resp = await fetch(ruta, opciones);
  } catch {
    throw new Error('No hay conexión con el servidor. ¿Está encendido?');
  }

  if (resp.status === 401 && !ruta.startsWith('/api/auth/login')) {
    location.href = '/admin/login.html?expirada=1';
    throw new Error('Sesión expirada.');
  }
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json.error || `Error ${resp.status}`);
  return json;
}
