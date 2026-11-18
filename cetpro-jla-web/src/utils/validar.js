/**
 * Validación y limpieza de datos que llegan del panel o de la web.
 * Regla de oro: nunca confiar en lo que envía el navegador.
 */
'use strict';

class ErrorValidacion extends Error {
  constructor(mensaje) { super(mensaje); this.status = 400; }
}

/** Texto plano recortado, con longitud máxima y opcionalmente obligatorio. */
function texto(valor, campo, { max = 200, requerido = false } = {}) {
  const v = (valor ?? '').toString().replace(/\u0000/g, '').trim();
  if (requerido && !v) throw new ErrorValidacion(`El campo «${campo}» es obligatorio.`);
  if (v.length > max) throw new ErrorValidacion(`«${campo}» admite como máximo ${max} caracteres.`);
  return v;
}

/** Fecha AAAA-MM-DD válida (o null si viene vacía y no es obligatoria). */
function fecha(valor, campo, { requerido = false } = {}) {
  const v = texto(valor, campo, { max: 10, requerido });
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) {
    throw new ErrorValidacion(`«${campo}» debe ser una fecha válida.`);
  }
  return v;
}

function entero(valor, campo, { min = 0, max = 100000 } = {}) {
  if (valor === '' || valor == null) return null;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ErrorValidacion(`«${campo}» debe ser un número entre ${min} y ${max}.`);
  }
  return n;
}

function color(valor) {
  const v = (valor ?? '').toString().trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toUpperCase() : '#0A6C9E';
}

function opcion(valor, permitidas, campo) {
  if (!permitidas.includes(valor)) throw new ErrorValidacion(`Valor no válido para «${campo}».`);
  return valor;
}

/** Lista desde un textarea (una línea por elemento) o desde un arreglo. */
function lista(valor, campo, { maxItems = 15, maxLargo = 160 } = {}) {
  let items = Array.isArray(valor) ? valor : (valor ?? '').toString().split(/\r?\n/);
  items = items.map(i => i.toString().trim()).filter(Boolean);
  if (items.length > maxItems) throw new ErrorValidacion(`«${campo}» admite como máximo ${maxItems} líneas.`);
  items.forEach(i => {
    if (i.length > maxLargo) throw new ErrorValidacion(`Cada línea de «${campo}» admite ${maxLargo} caracteres.`);
  });
  return items;
}

/** "Panadería y Pastelería" → "panaderia-y-pasteleria" */
function slug(valor) {
  return (valor ?? '').toString()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'especialidad';
}

/** URL http(s) o vacío. */
function url(valor, campo) {
  const v = texto(valor, campo, { max: 300 });
  if (!v) return '';
  try {
    const u = new URL(v);
    if (!['http:', 'https:'].includes(u.protocol)) throw new Error();
    return u.toString();
  } catch {
    throw new ErrorValidacion(`«${campo}» debe ser un enlace que empiece con https://`);
  }
}

module.exports = { ErrorValidacion, texto, fecha, entero, color, opcion, lista, slug, url };
