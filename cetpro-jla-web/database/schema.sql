-- ================================================================
-- CETPRO JOAQUÍN LÓPEZ ANTAY — Esquema de la base de datos
-- Motor: SQLite (sql.js, sin instalaciones nativas)
-- Se ejecuta automáticamente la primera vez que arranca el servidor.
-- ================================================================

PRAGMA foreign_keys = ON;

-- Usuarios del panel (contraseñas con scrypt + sal, nunca en texto plano)
CREATE TABLE IF NOT EXISTS usuarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario     TEXT    NOT NULL UNIQUE,
  nombre      TEXT    NOT NULL,
  clave_hash  TEXT    NOT NULL,
  rol         TEXT    NOT NULL DEFAULT 'administrador',
  ultimo_acceso   TEXT,
  acceso_anterior TEXT,
  creado      TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Programas de estudio (alimentan las tarjetas y el modal de la web)
CREATE TABLE IF NOT EXISTS especialidades (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  slug              TEXT    NOT NULL UNIQUE,          -- identificador en la web (data-carrera)
  nombre            TEXT    NOT NULL,
  ciclo             TEXT    NOT NULL CHECK (ciclo IN ('auxiliar','tecnico','basico')),
  duracion          TEXT    NOT NULL,                 -- "1 Año de estudio"
  duracion_corta    TEXT    NOT NULL,                 -- "1 Año"
  color             TEXT    NOT NULL DEFAULT '#0A6C9E',
  descripcion_corta TEXT    NOT NULL DEFAULT '',      -- texto de la tarjeta
  descripcion       TEXT    NOT NULL DEFAULT '',      -- texto del modal
  requisitos        TEXT    NOT NULL DEFAULT '[]',    -- JSON: lista de textos
  turnos            TEXT    NOT NULL DEFAULT '[]',    -- JSON: lista de textos
  familia           TEXT    NOT NULL DEFAULT '',      -- familia productiva (RD 02617-2026)
  modulos           TEXT    NOT NULL DEFAULT '[]',    -- JSON: [{nombre, horas, creditos?}]
  icono_svg         TEXT,                             -- ícono original (solo semilla)
  imagen            TEXT,                             -- /uploads/especialidades/...
  estado            TEXT    NOT NULL DEFAULT 'borrador' CHECK (estado IN ('publicado','borrador')),
  orden             INTEGER NOT NULL DEFAULT 0,
  creado            TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  actualizado       TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Convocatorias de admisión (banner en la web)
CREATE TABLE IF NOT EXISTS convocatorias (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo       TEXT    NOT NULL,
  descripcion  TEXT    NOT NULL DEFAULT '',
  fecha_inicio TEXT,
  fecha_fin    TEXT,
  vacantes     INTEGER,
  requisitos   TEXT    NOT NULL DEFAULT '[]',        -- JSON
  estado       TEXT    NOT NULL DEFAULT 'borrador' CHECK (estado IN ('publicado','borrador')),
  creado       TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  actualizado  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Noticias y actividades
CREATE TABLE IF NOT EXISTS noticias (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo      TEXT    NOT NULL,
  fecha       TEXT    NOT NULL,
  resumen     TEXT    NOT NULL DEFAULT '',
  contenido   TEXT    NOT NULL DEFAULT '',
  imagen      TEXT,
  estado      TEXT    NOT NULL DEFAULT 'borrador' CHECK (estado IN ('publicado','borrador')),
  creado      TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
  actualizado TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Galería de fotos (mural de talleres + galería del modal de cada carrera)
CREATE TABLE IF NOT EXISTS galeria (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  archivo         TEXT    NOT NULL,
  titulo          TEXT    NOT NULL DEFAULT '',
  especialidad_id INTEGER REFERENCES especialidades(id) ON DELETE SET NULL,
  creado          TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Consultas enviadas desde el formulario de contacto de la web
CREATE TABLE IF NOT EXISTS consultas (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre       TEXT    NOT NULL,
  contacto     TEXT    NOT NULL,                     -- celular o correo
  especialidad TEXT,
  mensaje      TEXT    NOT NULL,
  leido        INTEGER NOT NULL DEFAULT 0,
  creado       TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Configuración general y textos de la página de inicio (clave → valor)
CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_especialidades_estado ON especialidades(estado, orden);
CREATE INDEX IF NOT EXISTS idx_noticias_estado       ON noticias(estado, fecha);
CREATE INDEX IF NOT EXISTS idx_consultas_leido       ON consultas(leido, creado);
