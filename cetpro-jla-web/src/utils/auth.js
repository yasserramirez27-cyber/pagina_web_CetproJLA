/**
 * ================================================================
 * AUTENTICACIÓN DEL PANEL
 * - Contraseñas con scrypt + sal aleatoria (módulo crypto de Node)
 * - Sesión en memoria con cookie HttpOnly + SameSite=Strict
 * - Límite de intentos de inicio de sesión por IP
 * - Cabecera obligatoria en peticiones que modifican datos (anti-CSRF)
 * ================================================================
 */
'use strict';

const crypto = require('crypto');
const config = require('./config');

const COOKIE = 'cetpro_sesion';
const sesiones = new Map(); // token → { usuarioId, expira }

/* ── Contraseñas ─────────────────────────────────────────────── */
function hashClave(clave) {
  const sal  = crypto.randomBytes(16);
  const hash = crypto.scryptSync(clave, sal, 64);
  return `scrypt$${sal.toString('hex')}$${hash.toString('hex')}`;
}

function verificarClave(clave, guardado) {
  const [tipo, salHex, hashHex] = String(guardado).split('$');
  if (tipo !== 'scrypt' || !salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, 'hex');
  const calculado = crypto.scryptSync(String(clave), Buffer.from(salHex, 'hex'), esperado.length);
  return crypto.timingSafeEqual(esperado, calculado);
}

/* ── Cookies ─────────────────────────────────────────────────── */
function leerCookie(req, nombre) {
  const cabecera = req.headers.cookie || '';
  for (const parte of cabecera.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nombre) return decodeURIComponent(v.join('='));
  }
  return null;
}

function opcionesCookie(maxAgeSeg) {
  return [
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeg}`,
    config.cookieSegura ? 'Secure' : '',
  ].filter(Boolean).join('; ');
}

/* ── Sesiones ────────────────────────────────────────────────── */
function crearSesion(res, usuarioId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const seg = config.horasSesion * 3600;
  sesiones.set(token, { usuarioId, expira: Date.now() + seg * 1000 });
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; ${opcionesCookie(seg)}`);
}

function cerrarSesion(req, res) {
  const token = leerCookie(req, COOKIE);
  if (token) sesiones.delete(token);
  res.setHeader('Set-Cookie', `${COOKIE}=; ${opcionesCookie(0)}`);
}

/** Cierra todas las sesiones de un usuario (p. ej., al cambiar la contraseña). */
function cerrarSesionesDe(usuarioId, excepto = null) {
  for (const [token, s] of sesiones) {
    if (s.usuarioId === usuarioId && token !== excepto) sesiones.delete(token);
  }
}

function sesionActual(req) {
  const token = leerCookie(req, COOKIE);
  const s = token && sesiones.get(token);
  if (!s) return null;
  if (s.expira < Date.now()) { sesiones.delete(token); return null; }
  return { ...s, token };
}

// Limpieza periódica de sesiones vencidas
setInterval(() => {
  const ahora = Date.now();
  for (const [t, s] of sesiones) if (s.expira < ahora) sesiones.delete(t);
}, 15 * 60 * 1000).unref();

/* ── Middlewares ─────────────────────────────────────────────── */
function requiereSesion(req, res, next) {
  const s = sesionActual(req);
  if (!s) return res.status(401).json({ error: 'Tu sesión expiró. Vuelve a iniciar sesión.' });
  req.sesion = s;
  next();
}

/**
 * Las peticiones que cambian datos deben traer la cabecera
 * X-Requested-With: cetpro-admin. Un sitio ajeno no puede enviarla
 * sin permiso CORS, así que bloquea ataques CSRF.
 */
function antiCSRF(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Requested-With') !== 'cetpro-admin') {
    return res.status(403).json({ error: 'Petición no permitida.' });
  }
  next();
}

/** Limitador simple en memoria: `max` intentos por `ventanaMin` minutos e IP. */
function limitador({ max, ventanaMin, mensaje }) {
  const registro = new Map();
  setInterval(() => {
    const ahora = Date.now();
    for (const [ip, r] of registro) if (r.reinicio < ahora) registro.delete(ip);
  }, ventanaMin * 60 * 1000).unref();

  const mw = (req, res, next) => {
    const ip = req.ip || 'desconocida';
    const ahora = Date.now();
    let r = registro.get(ip);
    if (!r || r.reinicio < ahora) r = { n: 0, reinicio: ahora + ventanaMin * 60 * 1000 };
    r.n++;
    registro.set(ip, r);
    if (r.n > max) {
      res.setHeader('Retry-After', Math.ceil((r.reinicio - ahora) / 1000));
      return res.status(429).json({ error: mensaje });
    }
    next();
  };
  mw.reiniciar = (req) => registro.delete(req.ip || 'desconocida');
  return mw;
}

module.exports = {
  hashClave, verificarClave, crearSesion, cerrarSesion, cerrarSesionesDe,
  sesionActual, requiereSesion, antiCSRF, limitador,
};
