/**
 * ================================================================
 * PANEL DEL ADMINISTRADOR — Arranque y navegación
 * Rutas con # (sin recargar): #/dashboard, #/especialidades, ...
 * Cada módulo vive en /admin/modulos/<nombre>.js
 * ================================================================
 */
import { api } from '/components/api.js';
import { icono } from '/components/iconos.js';
import { html, esc, toast } from '/components/ui.js';

const MODULOS = [
  { ruta: 'dashboard',      texto: 'Dashboard',              icono: 'casa',       titulo: 'Dashboard',             sub: 'Gestión del sitio web institucional' },
  { ruta: 'inicio',         texto: 'Página de inicio',       icono: 'dashboard',     titulo: 'Página de inicio',      sub: 'Textos principales de la portada' },
  { ruta: 'especialidades', texto: 'Especialidades',         icono: 'birrete',    titulo: 'Especialidades',        sub: 'Administra los programas de formación' },
  { ruta: 'convocatorias',  texto: 'Admisión / Convocatorias', icono: 'calendario', titulo: 'Admisión / Convocatorias', sub: 'Fechas, vacantes y requisitos de admisión' },
  { ruta: 'noticias',       texto: 'Noticias',               icono: 'noticia',    titulo: 'Noticias',              sub: 'Eventos, talleres y logros institucionales' },
  { ruta: 'galeria',        texto: 'Galería',                icono: 'imagen',     titulo: 'Galería',               sub: 'Fotos de talleres y actividades' },
  { ruta: 'contactos',      texto: 'Contactos',              icono: 'correo',     titulo: 'Contactos',             sub: 'Consultas enviadas desde la web' },
  { ruta: 'configuracion',  texto: 'Configuración',          icono: 'ajustes',    titulo: 'Configuración',         sub: 'Datos de contacto, redes y seguridad' },
];

const contenido = document.getElementById('contenido');
const menu      = document.getElementById('menu');
const lateral   = document.getElementById('lateral');
const velo      = document.getElementById('lateral-velo');
const btnMenu   = document.getElementById('btn-menu');

const ctx = { usuario: null, refrescarAvisos };

/* ── Menú lateral ────────────────────────────────────────────── */
menu.innerHTML = MODULOS.map(m =>
  `<a href="#/${m.ruta}" class="lateral__enlace" data-ruta="${m.ruta}">${icono(m.icono, 19)}<span>${esc(m.texto)}</span>${m.ruta === 'contactos' ? '<span class="lateral__contador" id="contador-menu" hidden></span>' : ''}</a>`
).join('');

document.getElementById('btn-salir').innerHTML = `${icono('salir', 19)}<span>Cerrar sesión</span>`;
btnMenu.innerHTML = icono('menu', 22);

const abrirMenu = (abrir) => {
  lateral.classList.toggle('lateral--abierto', abrir);
  velo.hidden = !abrir;
  btnMenu.setAttribute('aria-expanded', String(abrir));
};
btnMenu.addEventListener('click', () => abrirMenu(!lateral.classList.contains('lateral--abierto')));
velo.addEventListener('click', () => abrirMenu(false));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !velo.hidden) abrirMenu(false); });

document.getElementById('btn-salir').addEventListener('click', async () => {
  try { await api('/api/auth/logout', { metodo: 'POST' }); } catch { /* igual salimos */ }
  location.href = '/admin/login.html';
});

/* ── Barra superior ──────────────────────────────────────────── */
function pintarUsuario(u) {
  const iniciales = u.nombre.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
  document.getElementById('usuario-barra').innerHTML = String(html`
    <span class="avatar" aria-hidden="true">${iniciales}</span>
    <span class="barra__usuario-texto"><strong>${u.nombre}</strong><small>CETPRO JLA</small></span>`);
}

async function refrescarAvisos() {
  try {
    const r = await api('/api/admin/resumen');
    const n = r.consultas.sinLeer;
    const campana = document.getElementById('campana');
    campana.innerHTML = icono('campana', 21) + (n ? `<span class="punto">${n > 9 ? '9+' : n}</span>` : '');
    campana.setAttribute('aria-label', n ? `${n} consultas sin leer` : 'No hay consultas sin leer');
    const c = document.getElementById('contador-menu');
    c.hidden = !n;
    c.textContent = n;
    return r;
  } catch { return null; }
}

/* ── Router ──────────────────────────────────────────────────── */
let rutaActual = null;

async function navegar() {
  const [, ruta = 'dashboard', accion = ''] = location.hash.match(/^#\/([\w-]+)\/?([\w-]*)/) || [];
  const mod = MODULOS.find(m => m.ruta === ruta) || MODULOS[0];

  menu.querySelectorAll('.lateral__enlace').forEach(a => {
    const activo = a.dataset.ruta === mod.ruta;
    a.classList.toggle('lateral__enlace--activo', activo);
    if (activo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  document.getElementById('titulo-modulo').textContent = mod.titulo;
  document.getElementById('subtitulo-modulo').textContent = mod.sub;
  document.title = `${mod.titulo} · Panel CETPRO JLA`;
  abrirMenu(false);

  const cambioDeModulo = rutaActual !== mod.ruta;
  rutaActual = mod.ruta;
  if (cambioDeModulo) contenido.innerHTML = '<div class="cargando">Cargando…</div>';
  try {
    const modulo = await import(`./modulos/${mod.ruta}.js`);
    await modulo.render(contenido, { ...ctx, accion });
    if (cambioDeModulo) contenido.focus({ preventScroll: true });
  } catch (err) {
    console.error(err);
    contenido.innerHTML = String(html`<div class="tarjeta error-carga"><h2>No se pudo cargar el módulo</h2><p>${err.message}</p></div>`);
  }
}

/* ── Inicio ──────────────────────────────────────────────────── */
(async () => {
  try {
    const { usuario } = await api('/api/auth/yo');
    ctx.usuario = usuario;
    pintarUsuario(usuario);
  } catch (err) {
    toast(err.message, 'error');
    return;
  }
  refrescarAvisos();
  window.addEventListener('hashchange', navegar);
  if (!location.hash) history.replaceState(null, '', '#/dashboard');
  navegar();
})();
