/**
 * Verifica que el proyecto tenga la estructura de carpetas acordada.
 * Uso: npm run verificar
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const RAIZ = path.join(__dirname, '..', '..');

const ESPERADO = [
  ['public/',            'Imágenes, logo, banners y fotos subidas'],
  ['public/img/logo.jpg','Logo institucional'],
  ['public/uploads/',    'Imágenes que se suben desde el panel'],
  ['src/',               'Código fuente'],
  ['src/pages/',         'Vistas del sitio (inicio, matrícula, noticia)'],
  ['src/admin/',         'Panel del administrador'],
  ['src/admin/modulos/', 'Un archivo por módulo del menú lateral'],
  ['src/components/',    'Componentes reutilizables (navegador)'],
  ['src/styles/',        'Estilos CSS'],
  ['src/utils/',         'Funciones y configuraciones (servidor)'],
  ['src/api/',           'Rutas de la API (añadida: la imagen no indica dónde va el servidor)'],
  ['src/server.js',      'Servidor Express'],
  ['database/',          'Conexión y scripts de BD'],
  ['database/schema.sql','Tablas'],
  ['database/seed.sql',  'Datos iniciales'],
  ['database/db.js',     'Conexión'],
  ['package.json',       'Dependencias y comandos'],
  ['README.md',          'Instrucciones'],
];

let faltan = 0;
console.log('\n  cetpro-jla-web/ — verificación de estructura\n');
for (const [ruta, desc] of ESPERADO) {
  const existe = fs.existsSync(path.join(RAIZ, ruta));
  if (!existe) faltan++;
  console.log(`  ${existe ? '✔' : '✘'} ${ruta.padEnd(22)} ${desc}`);
}
const dependencias = fs.existsSync(path.join(RAIZ, 'node_modules', 'express'));
console.log(`\n  ${dependencias ? '✔' : '✘'} Dependencias instaladas${dependencias ? '' : ' → ejecuta: npm install'}`);
console.log(faltan ? `\n  Faltan ${faltan} elementos.\n` : '\n  Estructura completa. ✦\n');
process.exit(faltan ? 1 : 0);
