/**
 * Configuración del servidor. Se puede cambiar con un archivo .env
 * en la raíz del proyecto (ver .env.example) o con variables de entorno.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', '..');

// Lector mínimo de .env (CLAVE=valor), sin dependencias
const rutaEnv = path.join(RAIZ, '.env');
if (fs.existsSync(rutaEnv)) {
  for (const linea of fs.readFileSync(rutaEnv, 'utf8').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

module.exports = {
  raiz:          RAIZ,
  puerto:        Number(process.env.PORT) || 3000,
  rutaBD:        process.env.DB_PATH || path.join(RAIZ, 'database', 'cetpro.sqlite'),
  rutaUploads:   path.join(RAIZ, 'public', 'uploads'),
  // true cuando el sitio se publique con HTTPS (Render, Railway, etc.)
  cookieSegura:  process.env.COOKIE_SEGURA === 'true',
  horasSesion:   Number(process.env.HORAS_SESION) || 8,
  maxImagenMB:   3,
  // Detrás de un proxy (hosting), para leer la IP real del visitante
  detrasDeProxy: process.env.DETRAS_DE_PROXY === 'true',
};
