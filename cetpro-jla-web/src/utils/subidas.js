/**
 * Subida de imágenes del panel.
 * - Solo JPG, PNG y WEBP (se revisa el contenido real del archivo,
 *   no solo la extensión). SVG no se acepta: puede contener scripts.
 * - Nombre aleatorio: nadie puede pisar ni adivinar archivos.
 */
'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const multer = require('multer');
const config = require('./config');
const { ErrorValidacion } = require('./validar');

const recibir = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxImagenMB * 1024 * 1024, files: 10, fields: 40 },
});

/** Detecta el tipo por los primeros bytes ("firma mágica"). */
function tipoReal(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'jpg';
  if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return 'png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/**
 * Guarda el archivo recibido en public/uploads/<carpeta>/ y devuelve
 * la ruta pública (/uploads/<carpeta>/<nombre>).
 */
function guardarImagen(archivo, carpeta) {
  const ext = tipoReal(archivo.buffer);
  if (!ext) throw new ErrorValidacion(`«${archivo.originalname}» no es una imagen JPG, PNG o WEBP.`);
  const destino = path.join(config.rutaUploads, carpeta);
  fs.mkdirSync(destino, { recursive: true });
  const nombre = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(destino, nombre), archivo.buffer);
  return `/uploads/${carpeta}/${nombre}`;
}

/** Borra una imagen subida. Ignora rutas fuera de public/uploads. */
function borrarImagen(rutaPublica) {
  if (!rutaPublica || !rutaPublica.startsWith('/uploads/')) return;
  const absoluta = path.resolve(config.rutaUploads, '.' + rutaPublica.slice('/uploads'.length));
  if (!absoluta.startsWith(path.resolve(config.rutaUploads) + path.sep)) return;
  fs.rm(absoluta, { force: true }, () => {});
}

module.exports = { recibir, guardarImagen, borrarImagen };
