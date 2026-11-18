/**
 * ================================================================
 * CONEXIÓN A LA BASE DE DATOS — SQLite con sql.js
 * ----------------------------------------------------------------
 * sql.js es SQLite compilado a WebAssembly: funciona en Windows,
 * Linux o Mac sin instalar compiladores ni MySQL.
 * La base vive en un solo archivo: database/cetpro.sqlite
 * ================================================================
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const config = require('../src/utils/config');

const RUTA_BD     = config.rutaBD;
const RUTA_SCHEMA = path.join(__dirname, 'schema.sql');
const RUTA_SEED   = path.join(__dirname, 'seed.sql');

let db = null;

/** sql.js no acepta `undefined`: lo convertimos a NULL. */
const limpiar = (params = []) => params.map(p => (p === undefined ? null : p));

/** Escribe la base en disco de forma atómica (archivo temporal + rename). */
function guardar() {
  const datos = Buffer.from(db.export());
  // export() reabre la base y reinicia los PRAGMA: los reactivamos
  db.run('PRAGMA foreign_keys = ON');
  const tmp = `${RUTA_BD}.tmp`;
  try {
    fs.writeFileSync(tmp, datos);
    fs.renameSync(tmp, RUTA_BD);
  } catch {
    // En Windows un antivirus puede bloquear el rename: escritura directa
    fs.writeFileSync(RUTA_BD, datos);
    fs.rmSync(tmp, { force: true });
  }
}

/**
 * Pone al día una base creada con una versión anterior:
 *  - agrega las columnas `familia` y `modulos`;
 *  - permite el ciclo 'basico' (SQLite no deja cambiar un CHECK, así que
 *    la tabla se reconstruye conservando ids, fotos y textos).
 */
function migrarEstructura(schema) {
  const columnas = todos('PRAGMA table_info(especialidades)').map(c => c.name);
  if (!columnas.includes('familia')) db.run(`ALTER TABLE especialidades ADD COLUMN familia TEXT NOT NULL DEFAULT ''`);
  if (!columnas.includes('modulos')) db.run(`ALTER TABLE especialidades ADD COLUMN modulos TEXT NOT NULL DEFAULT '[]'`);

  const sqlTabla = uno(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'especialidades'`).sql;
  if (sqlTabla.includes(`'basico'`)) return;

  const crear = schema.match(/CREATE TABLE IF NOT EXISTS especialidades \([\s\S]*?\n\);/)[0]
    .replace('IF NOT EXISTS especialidades', 'especialidades_nueva');
  const lista = todos('PRAGMA table_info(especialidades)').map(c => `"${c.name}"`).join(', ');
  // Sin esto, DROP TABLE dispararía ON DELETE SET NULL y la galería perdería sus carreras
  db.run('PRAGMA foreign_keys = OFF');
  try {
    db.exec(`BEGIN;
      ${crear}
      INSERT INTO especialidades_nueva (${lista}) SELECT ${lista} FROM especialidades;
      DROP TABLE especialidades;
      ALTER TABLE especialidades_nueva RENAME TO especialidades;
      COMMIT;`);
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  } finally {
    db.run('PRAGMA foreign_keys = ON');
  }
  db.exec(schema); // vuelve a crear el índice de especialidades
}

/**
 * Aplica una sola vez la oferta autorizada por la RD N.° 02617-2026-UGEL-HGA:
 * nombres oficiales, ciclo, familia, módulos y duración; agrega los programas nuevos.
 */
function aplicarOferta() {
  if (uno(`SELECT valor FROM configuracion WHERE clave = 'oferta_rd_aplicada'`)) return false;
  const { RESOLUCION, PROGRAMAS, duracionDe } = require('./oferta-rd-02617');

  for (const p of PROGRAMAS) {
    const { duracion, duracion_corta } = duracionDe(p);
    const modulos = JSON.stringify(p.modulos);
    const actual = uno('SELECT * FROM especialidades WHERE slug = ?', [p.slug]);

    if (actual) {
      // Solo se reemplaza un texto si nadie lo cambió desde el panel
      const texto = (campo) => (p[campo] && p.antes?.[campo] === actual[campo] ? p[campo] : actual[campo]);
      db.run(`UPDATE especialidades SET nombre=?, ciclo=?, familia=?, modulos=?, duracion=?, duracion_corta=?,
                descripcion_corta=?, descripcion=?, orden=?, actualizado=datetime('now','localtime') WHERE id=?`,
        limpiar([p.nombre, p.ciclo, p.familia, modulos, duracion, duracion_corta,
          texto('descripcion_corta'), texto('descripcion'), p.orden, actual.id]));
    } else if (p.nuevo) {
      db.run(`INSERT INTO especialidades (slug, nombre, ciclo, familia, modulos, duracion, duracion_corta, color,
                descripcion_corta, descripcion, requisitos, turnos, icono_svg, estado, orden)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'publicado',?)`,
        limpiar([p.slug, p.nombre, p.ciclo, p.familia, modulos, duracion, duracion_corta, p.color,
          p.descripcion_corta, p.descripcion, JSON.stringify(p.requisitos), JSON.stringify(p.turnos), p.icono_svg, p.orden]));
    }
  }

  const cfg = [['rd_oferta_numero', RESOLUCION.numero], ['rd_oferta_fecha', RESOLUCION.fecha],
    ['oferta_rd_aplicada', new Date().toISOString().slice(0, 10)]];
  cfg.forEach(([clave, valor]) =>
    db.run('INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?, ?)', [clave, valor]));
  return true;
}

/** Abre (o crea) la base, aplica el esquema y carga los datos iniciales. */
async function conectar() {
  const SQL = await initSqlJs();
  const existe = fs.existsSync(RUTA_BD);
  db = existe ? new SQL.Database(fs.readFileSync(RUTA_BD)) : new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  const schema = fs.readFileSync(RUTA_SCHEMA, 'utf8');
  db.exec(schema);
  migrarEstructura(schema);

  const vacia = uno('SELECT COUNT(*) AS n FROM configuracion').n === 0;
  if (vacia) db.exec(fs.readFileSync(RUTA_SEED, 'utf8'));
  const ofertaAplicada = aplicarOferta();

  guardar();
  return { nueva: !existe, sembrada: vacia, ofertaAplicada };
}

/** SELECT que devuelve todas las filas como objetos. */
function todos(sql, params = []) {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(limpiar(params));
    const filas = [];
    while (stmt.step()) filas.push(stmt.getAsObject());
    return filas;
  } finally {
    stmt.free();
  }
}

/** SELECT que devuelve solo la primera fila (o null). */
function uno(sql, params = []) {
  return todos(sql, params)[0] ?? null;
}

/** INSERT / UPDATE / DELETE. Guarda en disco al terminar. */
function ejecutar(sql, params = []) {
  db.run(sql, limpiar(params));
  const cambios = db.getRowsModified();
  const id = uno('SELECT last_insert_rowid() AS id').id;
  guardar();
  return { id, cambios };
}

module.exports = { conectar, todos, uno, ejecutar, RUTA_BD };
