/**
 * ================================================================
 * CETPRO JOAQUÍN LÓPEZ ANTAY — Servidor web
 * Sirve la página pública, el panel del administrador y la API.
 * Arranque: npm start  →  http://localhost:3000
 * ================================================================
 */
'use strict';

const path    = require('path');
const crypto  = require('crypto');
const express = require('express');
const multer  = require('multer');

const config = require('./utils/config');
const db     = require('../database/db');
const auth   = require('./utils/auth');
const render = require('./utils/render');

const app = express();
const RUTA = (...p) => path.join(config.raiz, ...p);

app.disable('x-powered-by');
if (config.detrasDeProxy) app.set('trust proxy', 1);

/* ── Cabeceras de seguridad (recomendaciones de AUDITORIA_SEGURIDAD.md) ── */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "frame-src https://www.facebook.com https://www.youtube-nocookie.com",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (config.cookieSegura) res.setHeader('Strict-Transport-Security', 'max-age=15552000');
  next();
});

app.use(express.json({ limit: '100kb' }));

/* ── API ─────────────────────────────────────────────────────── */
app.use('/api/auth',  require('./api/auth'));
app.use('/api/admin', (req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); }, require('./api/admin'));
app.use('/api',       require('./api/publico'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

/* ── Página pública (armada con datos de la BD) ──────────────── */
const enviarHTML = (res, html) => res.type('html').set('Cache-Control', 'no-cache').send(html);

app.get(['/', '/index.html'], (req, res) => enviarHTML(res, render.paginaInicio()));
app.get('/matricula.html', (req, res) => enviarHTML(res, render.paginaMatricula()));
app.get('/noticias/:id(\\d+)', (req, res, next) => {
  const html = render.paginaNoticia(Number(req.params.id));
  return html ? enviarHTML(res, html) : next();
});

/* ── Panel del administrador ─────────────────────────────────── */
// Sin sesión no se entrega el panel: se redirige al login
app.get(['/admin', '/admin/', '/admin/index.html'], (req, res) => {
  if (!auth.sesionActual(req)) return res.redirect('/admin/login.html');
  res.set('Cache-Control', 'no-store').sendFile(RUTA('src', 'admin', 'index.html'));
});
app.get('/admin/login.html', (req, res) => {
  if (auth.sesionActual(req)) return res.redirect('/admin/');
  res.set('Cache-Control', 'no-store').sendFile(RUTA('src', 'admin', 'login.html'));
});

/* ── Archivos estáticos ──────────────────────────────────────── */
const estatico = (carpeta) => express.static(carpeta, { index: false, maxAge: '1h' });
app.use('/admin',      estatico(RUTA('src', 'admin')));
app.use('/components', estatico(RUTA('src', 'components')));
app.use('/styles',     estatico(RUTA('src', 'styles')));
app.use('/img',        estatico(RUTA('public', 'img')));
app.use('/uploads',    estatico(RUTA('public', 'uploads')));

/* ── 404 y errores ───────────────────────────────────────────── */
app.use((req, res) => res.status(404).type('html').send(
  '<!doctype html><meta charset="utf-8"><title>Página no encontrada</title>' +
  '<p style="font-family:system-ui;padding:2rem">Página no encontrada. <a href="/">Volver al inicio</a></p>'));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let status = err.status || 500;
  let mensaje = status < 500 ? err.message : 'Ocurrió un error en el servidor.';
  if (err instanceof multer.MulterError) {
    status = 400;
    mensaje = err.code === 'LIMIT_FILE_SIZE'
      ? `Cada imagen debe pesar menos de ${config.maxImagenMB} MB.`
      : err.code === 'LIMIT_FILE_COUNT' ? 'Puedes subir hasta 10 imágenes a la vez.' : 'No se pudo recibir el archivo.';
  } else if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    status = 400; mensaje = 'Datos no válidos.';
  }
  if (status >= 500) console.error(err);
  res.status(status).json({ error: mensaje });
});

/* ── Arranque ────────────────────────────────────────────────── */
async function iniciar() {
  const estado = await db.conectar();

  // Primer arranque: se crea el usuario "admin" con una contraseña aleatoria
  if (db.uno('SELECT COUNT(*) AS n FROM usuarios').n === 0) {
    const clave = process.env.ADMIN_CLAVE || crypto.randomBytes(9).toString('base64url');
    db.ejecutar('INSERT INTO usuarios (usuario, nombre, clave_hash) VALUES (?, ?, ?)',
      ['admin', 'Administrador', auth.hashClave(clave)]);
    console.log('\n  ┌─ Usuario del panel creado ─────────────────');
    console.log('  │  Usuario:    admin');
    console.log(`  │  Contraseña: ${clave}`);
    console.log('  │  Anótala y cámbiala en el panel → Configuración.');
    console.log('  └────────────────────────────────────────────');
  }
  if (estado.sembrada) console.log('  ✔ Base de datos creada con las especialidades iniciales.');
  if (estado.ofertaAplicada) console.log('  ✔ Oferta actualizada según la RD N.° 02617-2026-UGEL-HGA (3 ciclos, 10 programas).');

  app.listen(config.puerto, () => {
    console.log(`\n  ✔ Web pública:  http://localhost:${config.puerto}`);
    console.log(`  ✔ Panel admin:  http://localhost:${config.puerto}/admin\n`);
  });
}

if (require.main === module) {
  iniciar().catch(err => { console.error('No se pudo iniciar el servidor:', err); process.exit(1); });
}

module.exports = { app, iniciar };
